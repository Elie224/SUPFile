# Configuration SMTP (Gmail / Google) – Emails SUPFile

SUPFile envoie des emails pour :
- **Vérification d’adresse e-mail** (activation du compte)
- **Mot de passe oublié** (réinitialisation)

Ces emails contiennent des liens **expirant au bout de 15 minutes**.

---

## 1. Variables d’environnement

Le backend lit ces variables :

- `SMTP_HOST` (ex: `smtp.gmail.com`)
- `SMTP_PORT` (ex: `587`)
- `SMTP_USER` (ex: `votre_email@gmail.com`)
- `SMTP_PASS` (Gmail : **mot de passe d’application**)
- `SMTP_FROM` (optionnel, sinon `SMTP_USER`)
- `FRONTEND_URL` (recommandé) : URL du frontend utilisée pour construire les liens cliquables

Sans configuration SMTP complète, les emails ne partiront pas (le backend loguera un avertissement).

---

## 2. Configuration Gmail (recommandé)

Gmail nécessite un **mot de passe d’application** (et donc la validation en 2 étapes) :

1. Activer la validation en 2 étapes : https://myaccount.google.com/security
2. Générer un mot de passe d’application :
   - Sécurité → Mots de passe des applications
   - Choisir une app (Mail) et un appareil
   - Copier le mot de passe généré (16 caractères)

---

## 3. Exemple : secrets Fly.io

Depuis le dossier `backend` (PowerShell) :

```powershell
flyctl secrets set SMTP_HOST=smtp.gmail.com --app supfile
flyctl secrets set SMTP_PORT=587 --app supfile
flyctl secrets set SMTP_USER="votre_email@gmail.com" --app supfile
flyctl secrets set SMTP_PASS="xxxx xxxx xxxx xxxx" --app supfile
flyctl secrets set SMTP_FROM="SUPFile <votre_email@gmail.com>" --app supfile
flyctl secrets set FRONTEND_URL="https://supfile.netlify.app" --app supfile

flyctl apps restart supfile
```

Remplacer :
- `votre_email@gmail.com` par votre adresse
- `xxxx xxxx xxxx xxxx` par le **mot de passe d’application** (pas le mot de passe Gmail habituel)
- `FRONTEND_URL` par l’URL réelle de votre frontend

---

## 4. Vérification

1. Tester la création de compte : l’utilisateur reçoit un email « Vérifier mon email ».
2. Tester « Mot de passe oublié » : l’utilisateur reçoit un email « Réinitialiser mon mot de passe ».
3. Vérifier aussi les spams/courriers indésirables (surtout au début).

---

## 5. Notes importantes

- **Réception** : l’utilisateur reçoit les emails dans sa boîte (ex: Gmail). SUPFile n’a rien à configurer côté “réception”, il envoie via SMTP.
- **Liens** : ils pointent vers le frontend (ex: `/verify-email?token=...` et `/reset-password?token=...`).
- **Expiration** : tokens vérif/reset expirent au bout de **15 minutes**.
