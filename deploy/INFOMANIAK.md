# Mise en ligne sur une machine virtuelle Infomaniak, avec Nginx

Le site tourne dans Docker et n'écoute que sur la machine elle-même (`127.0.0.1:8080`).
**Nginx** reçoit les visiteurs et fournit le HTTPS avec un certificat **Let's Encrypt** gratuit, renouvelé automatiquement.

Pas encore de nom de domaine ? L'adresse gratuite `https://<ip-avec-tirets>.sslip.io` fonctionne tout de suite.

## 1. Créer la machine virtuelle

Dans le **Manager Infomaniak** (offre *VPS Cloud* ou *Public Cloud*) :

- image **Ubuntu 24.04** (ou 22.04) ;
- **1 vCPU, 2 Go de RAM, 20 Go de disque** suffisent pour commencer ;
- ajoutez votre **clé SSH** publique (sur votre PC : `type $env:USERPROFILE\.ssh\id_ed25519.pub`,
  ou créez-en une avec `ssh-keygen -t ed25519`) ;
- **ouvrez les ports 22, 80 et 443** dans le pare-feu / groupe de sécurité de la machine.
  Sans les ports 80 et 443, le site et le certificat HTTPS ne fonctionnent pas.

Notez l'**adresse IP publique** (IPv4). L'utilisateur de connexion est `ubuntu`.

## 2. Installer le site (10 minutes)

Depuis le dossier du projet, sur votre PC (PowerShell) :

```powershell
scp -r deploy ubuntu@IP_DE_LA_VM:/tmp/building-service
ssh ubuntu@IP_DE_LA_VM
```

Puis sur la machine :

```bash
sudo mv /tmp/building-service /opt/building-service
cd /opt/building-service && sudo bash install-nginx.sh
```

Le script :

1. installe Docker, Nginx et Certbot ;
2. crée la configuration `.env` avec l'adresse `https://<ip>.sslip.io`, **vous demande le mot de passe de l'admin**
   et un e-mail (facultatif) pour Let's Encrypt ;
3. ouvre le pare-feu de la machine (SSH, HTTP, HTTPS) ;
4. vous demande un **jeton GitHub** si l'image est privée (droit `read:packages`) ;
5. démarre le site, configure Nginx et obtient le certificat HTTPS ;
6. programme la sauvegarde quotidienne des médias.

À la fin, il affiche l'adresse du site et de l'admin.

## 3. Mise à jour automatique à chaque push sur `main`

Comme dans [README.md](README.md#3-mise-à-jour-automatique-à-chaque-push-sur-main), avec ces secrets GitHub :

| Secret | Valeur |
|---|---|
| `VPS_HOST` | adresse IP de la machine |
| `VPS_USER` | `ubuntu` |
| `VPS_SSH_KEY` | clé **privée** dédiée au déploiement (sa clé publique ajoutée dans `~/.ssh/authorized_keys` de `ubuntu`) |

L'utilisateur `ubuntu` a été ajouté au groupe `docker` par le script : la CI lance simplement `./update.sh`.
Mise à jour manuelle : `cd /opt/building-service && ./update.sh`

## 4. Passer à un vrai nom de domaine

1. Chez votre registrar (Infomaniak ou autre), créez deux enregistrements **A** vers l'IP de la machine :
   `mon-domaine.cm` et `www.mon-domaine.cm`.
2. Dans `/opt/building-service/.env` (`nano .env`) :
   ```
   SITE_HOST=www.mon-domaine.cm
   SITE_ALIASES=mon-domaine.cm
   ```
3. `sudo bash install-nginx.sh` : Nginx et le certificat sont refaits, les données ne bougent pas.

## 5. Alertes, sauvegardes

Identique à la version Caddy : voir [README.md](README.md), sections 4 et 5.

## Dépannage

| Problème | Commande / solution |
|---|---|
| Journaux du site | `docker compose logs -f site` |
| Journaux Nginx | `sudo tail -f /var/log/nginx/error.log` |
| Tester la configuration Nginx | `sudo nginx -t` |
| Le site répond-il derrière Nginx ? | `curl http://127.0.0.1:8080/healthz` |
| Certificat refusé | ports 80/443 ouverts dans le Manager Infomaniak ? le nom pointe vers la bonne IP ? puis `sudo bash install-nginx.sh` |
| État du certificat | `sudo certbot certificates` (renouvellement : `sudo certbot renew --dry-run`) |
| Envoi d'une grosse vidéo refusé | augmenter `client_max_body_size` dans `/etc/nginx/sites-available/building-service`, puis `sudo systemctl reload nginx` |
