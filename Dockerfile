# 1. Imagen base
FROM node:18-alpine

# 2. Directorio de trabajo
WORKDIR /app

# 3. Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# 4. Copiar el resto de la app
COPY . .

# 5. Build de Next.js
RUN npm run build

# 6. Exponer el puerto (por defecto next dev corre en 3000)
EXPOSE 3000

# 7. Comando para desarrollo (no recomendado después de build)
CMD ["npm", "run", "start"]
