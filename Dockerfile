# Build du frontend puis service par nginx.
#
# L'URL de l'API est inscrite dans le bundle À LA COMPILATION : elle est donc
# passée en argument de build, pas en variable d'environnement du conteneur.
# Vide (défaut) = même origine, voir .env.production.example et nginx.conf.

FROM node:22-alpine AS build
WORKDIR /app

# Les dépendances sont copiées seules d'abord : tant que package*.json ne change
# pas, Docker réutilise cette couche et ne réinstalle rien.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
