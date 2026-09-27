#!/usr/bin/env bash
# Sauvegarde quotidienne de TOUT le dossier de données (médias compris) sur le VPS.
# Le contenu, les clients et les messages sont en plus envoyés chaque nuit hors du serveur
# (Telegram / e-mail) par le site lui-même. Pour une copie hors du VPS des médias,
# ajoutez à la fin une commande de transfert (rclone, rsync…) vers votre stockage.
set -euo pipefail
cd "$(dirname "$0")"

DEST=/var/backups/building-service
KEEP_DAYS=7
mkdir -p "$DEST"

tar -czf "$DEST/data-$(date +%F).tar.gz" data
find "$DEST" -name 'data-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date '+%F %T') sauvegarde OK : $(du -h "$DEST/data-$(date +%F).tar.gz" | cut -f1)"
