# Mise en ligne sur un VPS

Le site tourne dans Docker derrière **Caddy**, qui fournit le HTTPS automatiquement.
**Pas besoin de nom de domaine** : l'adresse gratuite `https://<ip-avec-tirets>.sslip.io` fonctionne tout de suite
(ex. `https://203-0-113-5.sslip.io`). Le jour où vous avez un domaine, une seule ligne change.

## 1. Louer un VPS

N'importe quel fournisseur convient (Contabo, Hetzner, OVH, DigitalOcean…) :

- système **Ubuntu 22.04 ou 24.04** ;
- **1 vCPU, 1 à 2 Go de RAM, 25 Go de disque** suffisent ;
- notez l'**adresse IP** et le **mot de passe root** (ou la clé SSH) fournis.

## 2. Installer le site (10 minutes)

Depuis le dossier du projet, sur votre PC (PowerShell) :

```powershell
scp -r deploy root@IP_DU_VPS:/opt/building-service
ssh root@IP_DU_VPS
```

Puis sur le VPS :

```bash
cd /opt/building-service && bash install.sh
```

Le script :

1. installe Docker ;
2. crée la configuration `.env` avec l'adresse `https://<ip>.sslip.io` et **vous demande le mot de passe de l'admin** ;
3. ouvre le pare-feu (SSH, HTTP, HTTPS) ;
4. vous demande un **jeton GitHub** si l'image est privée (GitHub → *Settings → Developer settings → Personal access tokens*, droit `read:packages`) ;
5. démarre le site et programme la sauvegarde quotidienne des médias.

À la fin, il affiche l'adresse du site et de l'admin.

## 3. Mise à jour automatique à chaque push sur `main`

Sur votre PC, créez une clé dédiée au déploiement :

```powershell
ssh-keygen -t ed25519 -f deploy_key -N '""' -C "github-actions"
type deploy_key.pub | ssh root@IP_DU_VPS "cat >> ~/.ssh/authorized_keys"
```

Dans GitHub → dépôt → *Settings → Secrets and variables → Actions*, ajoutez :

| Secret | Valeur |
|---|---|
| `VPS_HOST` | adresse IP du VPS |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | contenu complet du fichier `deploy_key` (clé **privée**) |

Supprimez ensuite `deploy_key` et `deploy_key.pub` de votre PC (ou rangez-les en lieu sûr).
Désormais, chaque push sur `main` : vérification → image Docker testée et publiée → **mise à jour du VPS**.

Mise à jour manuelle possible à tout moment : `cd /opt/building-service && ./update.sh`

## 4. Alertes des nouveaux messages

Dans `/opt/building-service/.env` (éditer avec `nano .env`), remplissez les canaux voulus, puis `./update.sh`.
Vérifiez ensuite dans **Admin → Sécurité → Alertes** et cliquez sur **Envoyer une alerte de test**.

### Telegram (gratuit, recommandé)

1. Dans Telegram, ouvrez **@BotFather** → `/newbot` → choisissez un nom → copiez le **jeton** dans `TELEGRAM_BOT_TOKEN`.
2. Écrivez n'importe quel message à votre nouveau bot.
3. Ouvrez `https://api.telegram.org/bot<JETON>/getUpdates` : le nombre après `"chat":{"id":` va dans `TELEGRAM_CHAT_ID`.
   Pour prévenir plusieurs personnes, mettez plusieurs identifiants séparés par des virgules.

Les **sauvegardes quotidiennes** arrivent aussi dans cette conversation.

### E-mail

Créez un compte **Brevo** (brevo.com, gratuit jusqu'à 300 mails/jour) → *SMTP & API → Clés API*, et validez l'adresse d'expédition.
Renseignez `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`. (Avec **Resend** : `EMAIL_PROVIDER=resend`.)

### WhatsApp

Nécessite un compte **Meta Business** et l'API WhatsApp Cloud (developers.facebook.com) :
`WHATSAPP_TOKEN` (jeton permanent), `WHATSAPP_PHONE_ID` (identifiant du numéro d'envoi), `WHATSAPP_TO`.
Meta n'autorise l'envoi libre que dans les 24 h suivant un message du destinataire : pour des alertes à tout moment,
faites approuver un **modèle** avec un paramètre de corps et indiquez son nom dans `WHATSAPP_TEMPLATE`.

### SMS (MboaSMS)

1. Sur <https://mboasms.com>, connectez-vous et copiez votre **clé API** (espace développeur) dans `MBOASMS_API_KEY`.
2. Demandez la validation d'un **nom d'expéditeur** (Sender ID, ex. `BUILDING`) et indiquez-le dans `MBOASMS_SENDER_ID` :
   sans Sender ID validé, MboaSMS refuse les envois.
3. Mettez le ou les numéros qui reçoivent les alertes dans `SMS_TO` (ex. `237656524739`).
4. Redémarrez (`docker compose up -d`) puis testez depuis l'admin : **Sécurité → Tester les alertes**.

Autre fournisseur SMS : laissez `MBOASMS_API_KEY` vide et renseignez l'adresse d'envoi de votre fournisseur dans `SMS_API_URL` ; `{to}` et `{message}` sont remplacés automatiquement.
Exemple : `SMS_API_URL=https://api.fournisseur.cm/send?user=XXX&key=YYY&to={to}&text={message}`.
Pour une API en POST : `SMS_API_METHOD=POST`, `SMS_API_BODY={"to":"{to}","message":"{message}"}`,
et les en-têtes éventuels dans `SMS_API_HEADERS` (JSON). Destinataire(s) : `SMS_TO`.

## 5. Sauvegardes

| Quoi | Quand | Où |
|---|---|---|
| Contenu, clients, brouillons, messages | chaque nuit (`BACKUP_HOUR`) | sur le serveur (`data/private/sauvegardes/`) **et** envoyé par Telegram / e-mail |
| Tout le dossier de données, médias compris | chaque nuit à 3 h 30 | `/var/backups/building-service/` (7 jours) |
| Manuel | à tout moment | Admin → Sécurité → Sauvegardes (*Télécharger*) |

Pour une copie des médias hors du VPS, ajoutez un transfert (rclone, rsync…) à la fin de `backup-media.sh`.

## 6. Passer à un vrai nom de domaine

1. Chez votre registrar, créez un enregistrement **A** : `www.mon-domaine.cm` → IP du VPS.
2. Dans `.env` : `SITE_HOST=www.mon-domaine.cm`
3. `./update.sh` — Caddy obtient le certificat HTTPS tout seul.

## Dépannage

| Problème | Commande / solution |
|---|---|
| Voir les journaux du site | `docker compose logs -f site` |
| Voir les journaux HTTPS | `docker compose logs -f caddy` |
| Le site ne répond pas | `docker compose ps` puis `./update.sh` |
| Mot de passe admin oublié | `rm data/private/admin.json`, vérifier `ADMIN_PASSWORD` dans `.env`, puis `docker compose restart site` |
| Restaurer le contenu | décompresser une archive de sauvegarde et replacer `content.json` dans `data/` (restauration depuis l'admin : prochaine étape) |
