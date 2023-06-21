FROM node:latest

# Set the working directory to the mounted project directory
WORKDIR /react

# Install dependencies & start in developer mode
# CMD npm install && npm run start

# Alternatively for producion mode - build and start the serve command to serve the built files
CMD rm -rf ./build && npm install && npm install -g serve && npm run build && npm run minify && npm run obfuscate && serve -s build -l 3000