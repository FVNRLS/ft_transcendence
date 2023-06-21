FROM node:latest

WORKDIR /nest

# DEVELOPMENT MODE: enable to install dependencies, make xdg-open executable & start. Launches the project in interactive watch mode.
ENTRYPOINT npm install && chmod +x /nest/node_modules/prisma/build/xdg-open && npm run start:dev

# PRODUCTION MODE - enable to build the backend and serve the static version.
# ENTRYPOINT npm install && chmod +x /nest/node_modules/prisma/build/xdg-open && npm run start:prod


