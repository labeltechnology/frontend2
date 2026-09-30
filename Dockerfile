# Build du frontend puis service des fichiers statiques par `serve`, sans nginx.
#
# L'URL de l'API est inscrite dans le bundle À LA COMPILATION : elle est donc
# passée en argument de build, pas en variable d'environnement du conteneur.
# Sans nginx pour relayer /api et /ws, elle doit pointer vers le backend
# (ex. http://IP_DU_VPS:8080), et le backend doit autoriser cette origine
# (APP_CORS_ALLOWED_ORIGINS).

FROM node:22-alpine AS build
WORKDIR /app

# Les dépendances sont copiées seules d'abord : tant que package*.json ne change
# pas, Docker réutilise cette couche et ne réinstalle rien.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve@14 && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
# -s : toute URL inconnue renvoie index.html (BrowserRouter).
# 0.0.0.0 : écoute sur toutes les interfaces, pas seulement localhost.
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000"]
