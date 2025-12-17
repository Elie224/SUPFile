FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Build de l'application avec VITE_API_URL
# Render passe automatiquement les variables d'environnement au build
# Utiliser la variable d'environnement directement (Render les injecte)
ENV VITE_API_URL=${VITE_API_URL:-https://supfile-1.onrender.com}

RUN npm run build

# Stage de production
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration nginx pour le routing SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
