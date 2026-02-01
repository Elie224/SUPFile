FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

# Invalider le cache des sources: fly deploy --build-arg CACHE_BUST=$(date +%s)
ARG CACHE_BUST
RUN echo "Sources at ${CACHE_BUST:-none}"
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 5000

CMD ["node", "app.js"]
