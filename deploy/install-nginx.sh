#!/usr/bin/env bash
# Installation de Building Service derrière Nginx (ex. machine virtuelle Infomaniak, Ubuntu 22.04 / 24.04)
#
#   1. depuis ton PC :  scp -r deploy ubuntu@IP_DE_LA_VM:/tmp/building-service
#   2. sur la VM     :  sudo mv /tmp/building-service /opt/building-service
#                       cd /opt/building-service && sudo bash install-nginx.sh
#
# Le script : installe Docker, Nginx et Certbot, crée .env (adresse https gratuite <ip>.sslip.io, mot de passe admin),
# démarre le site sur 127.0.0.1:8080, configure Nginx, obtient le certificat HTTPS Let's Encrypt
# (renouvelé automatiquement) et programme la sauvegarde des médias.
#
# On peut le relancer sans risque : après un changement de SITE_HOST (nom de domaine) dans .env,
# il refait la configuration Nginx et le certificat. Les données et le mot de passe ne sont pas touchés.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

say()  { printf '\n\033[1;31m▸\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33m!\033[0m %s\n' "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script avec sudo : sudo bash install-nginx.sh" >&2
  exit 1
fi

# ---------- 1. Docker, Nginx, Certbot ----------
if ! command -v docker >/dev/null 2>&1; then
  say "Installation de Docker…"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true

if ! command -v nginx >/dev/null 2>&1 || ! command -v certbot >/dev/null 2>&1; then
  say "Installation de Nginx et Certbot…"
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx certbot python3-certbot-nginx
fi
systemctl enable --now nginx >/dev/null 2>&1 || true

# ---------- 2. Configuration (.env) ----------
set_env() { # set_env CLE VALEUR : remplace ou ajoute une ligne du .env, sans problème de caractères spéciaux
  grep -v "^$1=" .env > .env.tmp || true
  printf '%s=%s\n' "$1" "$2" >> .env.tmp
  mv .env.tmp .env
}
get_env() { grep "^$1=" .env 2>/dev/null | tail -n 1 | cut -d= -f2- || true; }

if [ ! -f .env ]; then
  cp .env.example .env

  IP="$(curl -4 -fsS https://api.ipify.org || hostname -I | awk '{print $1}')"
  say "Adresse du site : https://${IP//./-}.sslip.io (remplaçable plus tard par votre nom de domaine)"
  set_env SITE_HOST "${IP//./-}.sslip.io"

  while :; do
    read -rsp "Mot de passe de l'administration (8 caractères minimum) : " PW; echo
    read -rsp "Confirmez le mot de passe : " PW2; echo
    if [ "${#PW}" -ge 8 ] && [ "$PW" = "$PW2" ]; then break; fi
    echo "Mots de passe différents ou trop courts, recommencez."
  done
  set_env ADMIN_PASSWORD "$PW"

  read -rp "E-mail pour Let's Encrypt (avertissements d'expiration, facultatif) : " LE_MAIL
  set_env LETSENCRYPT_EMAIL "$LE_MAIL"
  echo "Les alertes (Telegram, e-mail, WhatsApp, SMS) se configurent dans $APP_DIR/.env (voir README.md)."
fi
# Docker Compose utilise la version Nginx (lu aussi par update.sh et la CI)
set_env COMPOSE_FILE docker-compose.nginx.yml
chmod 600 .env

SITE_HOST="$(get_env SITE_HOST)"
SITE_ALIASES="$(get_env SITE_ALIASES)"   # ex. « mon-domaine.cm » quand SITE_HOST=www.mon-domaine.cm
LE_MAIL="$(get_env LETSENCRYPT_EMAIL)"
if [ -z "$SITE_HOST" ]; then
  echo "SITE_HOST est vide dans .env" >&2
  exit 1
fi

# ---------- 3. Droits : données (utilisateur 1000 du conteneur) et utilisateur sudo (mises à jour, CI) ----------
mkdir -p data
if [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != "root" ]; then
  chown -R "$SUDO_USER" "$APP_DIR"
  usermod -aG docker "$SUDO_USER"
fi
chown -R 1000:1000 data
chmod +x "$APP_DIR"/*.sh

# ---------- 4. Pare-feu de la machine ----------
if command -v ufw >/dev/null 2>&1; then
  say "Pare-feu : SSH, HTTP et HTTPS autorisés"
  ufw allow OpenSSH >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw --force enable >/dev/null
fi

# ---------- 5. Registre d'images (dépôt privé) ----------
if ! docker pull -q ghcr.io/reborn-spaceline/buildingservices:latest >/dev/null 2>&1; then
  say "L'image est privée : connexion à GitHub Container Registry"
  echo "Jeton GitHub nécessaire (Settings → Developer settings → Personal access tokens, droit read:packages)."
  read -rp "Nom d'utilisateur GitHub : " GH_USER
  read -rsp "Jeton : " GH_TOKEN; echo
  echo "$GH_TOKEN" | docker login ghcr.io -u "$GH_USER" --password-stdin
  # Même accès pour l'utilisateur sudo (update.sh et la CI)
  if [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != "root" ]; then
    echo "$GH_TOKEN" | sudo -u "$SUDO_USER" docker login ghcr.io -u "$GH_USER" --password-stdin >/dev/null
  fi
fi

# ---------- 6. Démarrage du site ----------
# Ancienne installation avec Caddy : on l'arrête pour libérer les ports 80 et 443
if docker ps --format '{{.Names}}' | grep -q caddy; then
  say "Arrêt de l'ancienne version avec Caddy…"
  COMPOSE_FILE=docker-compose.yml docker compose down
fi
say "Démarrage du site…"
docker compose pull
docker compose up -d

for _ in $(seq 1 30); do
  curl -fsS http://127.0.0.1:8080/healthz >/dev/null 2>&1 && break
  sleep 2
done
curl -fsS http://127.0.0.1:8080/healthz >/dev/null 2>&1 || warn "Le site ne répond pas encore : docker compose logs -f site"

# ---------- 7. Nginx ----------
say "Configuration de Nginx pour $SITE_HOST $SITE_ALIASES"
NAMES="$SITE_HOST${SITE_ALIASES:+ $SITE_ALIASES}"
sed "s/__SERVER_NAMES__/$NAMES/" nginx-site.conf > /etc/nginx/sites-available/building-service
ln -sf /etc/nginx/sites-available/building-service /etc/nginx/sites-enabled/building-service
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ---------- 8. Certificat HTTPS (Let's Encrypt, renouvelé automatiquement par certbot) ----------
say "Certificat HTTPS…"
DOMAINS=()
for name in $NAMES; do DOMAINS+=(-d "$name"); done
if [ -n "$LE_MAIL" ]; then MAIL_ARGS=(-m "$LE_MAIL"); else MAIL_ARGS=(--register-unsafely-without-email); fi
if certbot --nginx "${DOMAINS[@]}" "${MAIL_ARGS[@]}" --agree-tos --non-interactive --redirect --keep-until-expiring --expand; then
  HTTPS_OK=1
else
  HTTPS_OK=0
  warn "Certificat HTTPS impossible pour l'instant. Vérifiez :"
  echo "   - que les ports 80 et 443 sont ouverts dans le groupe de sécurité Infomaniak (pare-feu du Manager) ;"
  echo "   - que le nom $SITE_HOST pointe bien vers l'adresse IP de cette machine ;"
  echo "   puis relancez : sudo bash install-nginx.sh"
fi

# ---------- 9. Sauvegarde quotidienne des médias (photos, vidéos) ----------
cat > /etc/cron.d/building-service <<CRON
30 3 * * * root $APP_DIR/backup-media.sh >> /var/log/building-service-backup.log 2>&1
CRON

say "Terminé."
if [ "$HTTPS_OK" = 1 ]; then
  echo "   Site  : https://$SITE_HOST"
  echo "   Admin : https://$SITE_HOST/admin"
else
  echo "   Site (sans HTTPS pour l'instant) : http://$SITE_HOST"
fi
