# syntax=docker/dockerfile:1
#
# Image de production de Building Service
#   docker build -t building-service .
#   docker run -p 8080:8080 -e ADMIN_PASSWORD=… -v building-service-data:/data building-service
#
# Toutes les données vivantes (contenu, médias, messages, mot de passe, sauvegardes) sont dans /data :
# montez-y un volume pour ne rien perdre lors des mises à jour.

# ---------- 1. Construction du site ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- 2. Image finale : Node seul, aucune dépendance npm ----------
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data \
    DIST_DIR=/app/dist \
    SEED_FILE=/app/seed/content.json

WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
COPY src/content/content.json ./seed/content.json
COPY package.json ./

RUN mkdir -p /data && chown -R node:node /data
USER node

EXPOSE 8080
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["node", "server/index.js"]
