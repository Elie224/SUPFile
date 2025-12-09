FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g eas-cli

RUN npm install

COPY . .

EXPOSE 19000 19001

CMD ["npm", "start"]
