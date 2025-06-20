# Trabajo practico Software Libre - FI UNMDP
#### Catedra
Hinojal, Hernan; Casas, Martin.
#### Integrantes
Barriga, Nahuel; Firmani, Gregorio; Trinitario, Bruno.

## Descripcion
El trabajo practico trata de enseñar el uso de aplicaciones desarrolladas desde el punto de vista del software libre <br>
Lo que debiamos hacer es hacer un fork del repositorio https://github.com/casasmartinignacio/tp-sl-gestionganadera implemetar una base de datos con Mongo, permitir el despliegue de la aplicacion con Docker, y crear daemons que ejecuten algo cada cierto tiempo.

## Tecnologias principales
* MongoDB
* Docker
* Node
* Next.js
* React
* Debian
* VirtualBox

## Que implementamos?
Decidimos desviarnos un poco pero manteniendo el foco en el uso de software libre, y al mismo tiempo, permitirnos una experiencia cercana a la realidad.
Nuestra idea fue hacer un deploy real en un servidor real (en nuestro caso **Render**), integrar la aplicacion con mongo utilizando **Atlas** el cual tiene un *free tier* que nos permite tener nuetra base de datos en la nube.
En una instancia de **Debian** creamos un daemon que mediante el servicio cron ejecuta un script de backup para nuestra base de datos con las herramientas de desarrollo de mongo (mongodump en este caso) y el uso de bash para este pequeño script.

## Explicacion de tecnologias usadas

### Docker
El servicio de host que utilizamos nos permite utilizar archivos `docker compose` por lo que lo resolvimos creando un `dockerfile` cual describe la imagen que necesitamos para correr nuestra app

```
# 1. NODE 18 (de las versiones mas estables y apline(linux) para hacer un contenedor liviano)
FROM node:18-alpine 

# 2. Como vimos en Overlay FS de docker montamos dentro del FS del contenedor el directorio "/app" en el cual vamos a trabajar
WORKDIR /app

# 3. Copiamos en el directorio las las dependecnias y versiones que necesitamos para correr la app
COPY package*.json ./
# 3.1. Instalamos las dependecias
RUN npm install

# 4. Copiar el resto de la app
COPY . .

# 5. Hacemos build de la aplicacion para no saturar el servidor y tener mas performance
RUN npm run build

# 6. Exponer el puerto 3000 (puede se cualquier otro)
EXPOSE 3000

# 7. Ejecutamos la aplicacion buildeada
CMD ["npm", "run", "start"]
```

### Github actions CD y CI
Son archivos de configuracion para la gestion del proyecto, los archivos CI son acciones que se ejecutan luego de hacer un commit en el repo, lo que se suele ejecutar son tests, buidls, lints (identacion y formato), luego una vez pasado (o no) todo el CI se toma una decicion de que hacer con el commit, si dejarlo pasar, hacer deploy o negarlo. En nuestro caso si el commit es valido (pasa los tests, lint y build) se hace un deploy al servidor.
```
# aca indicamos el nombre de la accion, en este caso es un pipeline hacia deploy
# tambien configuramos cuando se ejecutan las acciones (en este caso cuado se hace un push a main o un PR)
name: CI pipeline
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

# Se describen las acciones a realizar cuando se quiere hacer el commit
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Instalar dependencias
        run: npm install

      - name: Lint (reglas de estilo)
        run: npm run lint
      
      - name: Build (opcional)
        run: npm run build

      #- name: Correr tests
      #        run: npm test

      - name: Deploy en Render
        if: success()
        run: curl -X POST https://api.render.com/deploy/srv-d17n7kodl3ps738uit5g?key=ne0yX-MR30g

```


## Emphasis

*This text will be italic*  
_This will also be italic_

**This text will be bold**  
__This will also be bold__

_You **can** combine them_

## Lists

### Unordered

* Item 1
* Item 2
* Item 2a
* Item 2b
    * Item 3a
    * Item 3b

### Ordered

1. Item 1
2. Item 2
3. Item 3
    1. Item 3a
    2. Item 3b

## Images

![This is an alt text.](/image/sample.webp "This is a sample image.")

## Links

You may be using [Markdown Live Preview](https://markdownlivepreview.com/).

## Blockquotes

> Markdown is a lightweight markup language with plain-text-formatting syntax, created in 2004 by John Gruber with Aaron Swartz.
>
>> Markdown is often used to format readme files, for writing messages in online discussion forums, and to create rich text using a plain text editor.

## Tables

| Left columns  | Right columns |
| ------------- |:-------------:|
| left foo      | right foo     |
| left bar      | right bar     |
| left baz      | right baz     |

## Blocks of code

```
let message = 'Hello world';
alert(message);
```

## Inline code

This web site is using `markedjs/marked`.
