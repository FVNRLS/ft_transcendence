FROM node:latest

# Set the working directory to the mounted project directory
WORKDIR /react

# DEVELOPMENT MODE: enable to install dependencies & start, test runner and launch the project in interactive watch mode
# ENTRYPOINT npm install && npm run start

# PRODUCTION MODE - enable to build, obfuscate and serve the build directory
ENTRYPOINT rm -rf ./build && npm install && npm install -g serve && npm run build && npm run obfuscate && serve -s build -l 3000