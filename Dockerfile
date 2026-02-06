
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./


RUN npm install --legacy-peer-deps

# Set node environment variable to production

# ENV NODE_PORT=8080

# Bundle app source

COPY . .


RUN npm run build
RUN cd dist
# EXPOSE 8080

CMD ["node","./dist/main.js"]

