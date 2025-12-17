FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Build de l'application avec VITE_API_URL
# Render passe automatiquement les variables d'environnement au build Docker
# La variable VITE_API_URL doit être définie dans Render avant le build
ENV VITE_API_URL=${VITE_API_URL}

# Forcer le rebuild en ajoutant un timestamp pour invalider le cache
RUN echo "Building with VITE_API_URL=${VITE_API_URL}" && npm run build

# Stage de production
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration nginx pour le routing SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
