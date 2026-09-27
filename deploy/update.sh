#!/usr/bin/env bash
# Met le site à jour avec la dernière image publiée (utilisé aussi par la CI). Les données sont conservées.
set -euo pipefail
cd "$(dirname "$0")"
docker compose pull
docker compose up -d
docker image prune -f >/dev/null
echo "Site à jour."
