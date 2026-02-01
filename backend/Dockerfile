FROM node:18-alpine

WORKDIR /usr/src/app

# Invalider le cache en passant: fly deploy --build-arg CACHE_BUST=$(date +%s)
ARG CACHE_BUST
RUN echo "Build at ${CACHE_BUST:-none}"

COPY package*.json ./

RUN npm install --production

COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 5000

CMD ["node", "app.js"]
