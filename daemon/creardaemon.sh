#!/bin/bash

# Validar argumento
if [ -z "$1" ]; then
  echo "Uso: $0 <intervalo_en_horas>"
  exit 1
fi

INTERVALO_HORAS="$1"
INTERVALO_SEGUNDOS=$((INTERVALO_HORAS * 3600))

# Variables
NOMBRE_SERVICIO="mongo-backup-daemon"
RUTA_BACKUP="/var/backups/mongodb"
RUTA_SCRIPT="/usr/local/bin/${NOMBRE_SERVICIO}.sh"
RUTA_UNIT="/etc/systemd/system/${NOMBRE_SERVICIO}.service"
RUTA_LOG="/var/log/${NOMBRE_SERVICIO}.log"
URI_ATLAS="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>"  # CAMBIAR

# Crear carpeta de backups y log
mkdir -p "$RUTA_BACKUP"
touch "$RUTA_LOG"

# Crear el script daemon
cat > "$RUTA_SCRIPT" <<EOF
#!/bin/bash

BACKUP_NUM=1
PREV_BACKUP=""

while true; do
  TIMESTAMP=\$(date '+%Y-%m-%d %H:%M:%S')
  
  # Eliminar backup anterior si existe
  if [ ! -z "\$PREV_BACKUP" ]; then
    rm -rf "\$PREV_BACKUP"
    echo "[\$TIMESTAMP] Se eliminó el backup #\$((BACKUP_NUM - 1))" >> "$RUTA_LOG"
  fi

  echo "[\$TIMESTAMP] Comenzó backup #\$BACKUP_NUM" >> "$RUTA_LOG"

  DESTINO="$RUTA_BACKUP/backup_\$BACKUP_NUM"
  mongodump --uri="$URI_ATLAS" --out="\$DESTINO"

  TIMESTAMP_END=\$(date '+%Y-%m-%d %H:%M:%S')
  echo "[\$TIMESTAMP_END] Terminó backup #\$BACKUP_NUM" >> "$RUTA_LOG"

  PREV_BACKUP="\$DESTINO"
  BACKUP_NUM=\$((BACKUP_NUM + 1))

  sleep $INTERVALO_SEGUNDOS
done
EOF

chmod +x "$RUTA_SCRIPT"

# Crear unidad systemd
cat > "$RUTA_UNIT" <<EOF
[Unit]
Description=MongoDB Atlas Backup Daemon

[Service]
ExecStart=$RUTA_SCRIPT
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

# Activar daemon
systemctl daemon-reexec
systemctl daemon-reload
systemctl enable "$NOMBRE_SERVICIO"
systemctl start "$NOMBRE_SERVICIO"

echo "Servicio '$NOMBRE_SERVICIO' creado e iniciado con intervalo de $INTERVALO_HORAS horas."
