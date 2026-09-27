#!/usr/bin/env bash
# Installation de Building Service sur un VPS neuf (Ubuntu / Debian), en une commande :
#
#   1. depuis ton PC :  scp -r deploy root@IP_DU_VPS:/opt/building-service
#   2. sur le VPS    :  cd /opt/building-service && sudo bash install.sh
#
# Le script : installe Docker, crée .env (adresse https gratuite <ip>.sslip.io, mot de passe admin),
# ouvre le pare-feu, se connecte au registre GitHub si besoin, démarre le site et programme la sauvegarde des médias.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

say() { printf '\n\033[1;31m▸\033[0m %s\n' "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script en root : sudo bash install.sh" >&2
  exit 1
fi

# ---------- 1. Docker ----------
if ! command -v docker >/dev/null 2>&1; then
  say "Installation de Docker…"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true

# ---------- 2. Configuration (.env) ----------
set_env() { # set_env CLE VALEUR : remplace ou ajoute une ligne du .env, sans problème de caractères spéciaux
  grep -v "^$1=" .env > .env.tmp || true
  printf '%s=%s\n' "$1" "$2" >> .env.tmp
  mv .env.tmp .env
}

if [ ! -f .env ]; then
  cp .env.example .env
  chmod 600 .env

  IP="$(curl -fsS https://api.ipify.org || hostname -I | awk '{print $1}')"
  say "Adresse du site : https://${IP//./-}.sslip.io (remplaçable plus tard par votre nom de domaine)"
  set_env SITE_HOST "${IP//./-}.sslip.io"

  while :; do
    read -rsp "Mot de passe de l'administration (8 caractères minimum) : " PW; echo
    read -rsp "Confirmez le mot de passe : " PW2; echo
    if [ "${#PW}" -ge 8 ] && [ "$PW" = "$PW2" ]; then break; fi
    echo "Mots de passe différents ou trop courts, recommencez."
  done
  set_env ADMIN_PASSWORD "$PW"
  echo "Les alertes (Telegram, e-mail, WhatsApp, SMS) se configurent dans $APP_DIR/.env (voir README.md)."
fi

# ---------- 3. Dossier de données (le conteneur tourne sous l'utilisateur 1000) ----------
mkdir -p data
chown -R 1000:1000 data

# ---------- 4. Pare-feu ----------
if command -v ufw >/dev/null 2>&1; then
  say "Pare-feu : SSH, HTTP et HTTPS autorisés"
  ufw allow OpenSSH >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443 >/dev/null
  ufw --force enable >/dev/null
fi

# ---------- 5. Registre d'images (dépôt privé) ----------
if ! docker pull -q ghcr.io/reborn-spaceline/buildingservices:latest >/dev/null 2>&1; then
  say "L'image est privée : connexion à GitHub Container Registry"
  echo "Jeton GitHub nécessaire (Settings → Developer settings → Personal access tokens, droit read:packages)."
  read -rp "Nom d'utilisateur GitHub : " GH_USER
  read -rsp "Jeton : " GH_TOKEN; echo
  echo "$GH_TOKEN" | docker login ghcr.io -u "$GH_USER" --password-stdin
fi

# ---------- 6. Démarrage ----------
say "Démarrage du site…"
docker compose pull
docker compose up -d

# ---------- 7. Sauvegarde quotidienne des médias (photos, vidéos) ----------
chmod +x "$APP_DIR/backup-media.sh" "$APP_DIR/update.sh"
cat > /etc/cron.d/building-service <<CRON
30 3 * * * root $APP_DIR/backup-media.sh >> /var/log/building-service-backup.log 2>&1
CRON

SITE_HOST="$(grep '^SITE_HOST=' .env | cut -d= -f2-)"
say "Terminé. Le site sera disponible dans une minute (certificat HTTPS) :"
echo "   Site  : https://$SITE_HOST"
echo "   Admin : https://$SITE_HOST/admin"
