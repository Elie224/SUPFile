# Configuration SMTP – Envoi d’email de réinitialisation de mot de passe

Quand un utilisateur demande à récupérer son mot de passe, un **email** doit être envoyé à **l’adresse qu’il a saisie** avec un lien pour réinitialiser son mot de passe. Pour cela, il faut configurer SMTP.

---

## 1. Comportement actuel

- **Sans SMTP** : l’URL de réinitialisation est seulement affichée dans les logs du serveur (mode développement).
- **Avec SMTP** : un vrai email est envoyé à l’adresse fournie par l’utilisateur, avec le lien de réinitialisation et le logo SUPFile.

---

## 2. Configuration SMTP sur Fly.io (production)

Sur Fly.io, les paramètres SMTP sont définis via des **secrets** (variables d’environnement sécurisées).

### Option A : Gmail

1. **Activer la validation en 2 étapes** sur votre compte Google :  
   https://myaccount.google.com/security

2. **Créer un mot de passe d’application** :
   - Aller dans « Sécurité » → « Mots de passe des applications »
   - Choisir « Mail » et votre appareil
   - Copier le mot de passe généré (16 caractères)

3. **Définir les secrets sur Fly.io** (PowerShell, dans le dossier `backend`) :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend

flyctl secrets set SMTP_HOST=smtp.gmail.com
flyctl secrets set SMTP_PORT=587
flyctl secrets set SMTP_USER=votre_email@gmail.com
flyctl secrets set SMTP_PASS=[REDACTED] xxxx xxxx xxxx
flyctl secrets set SMTP_FROM="SUPFile <votre_email@gmail.com>"
flyctl secrets set FRONTEND_URL=https://flourishing-banoffee-c0b1ad.netlify.app
```

Remplacez :
- `votre_email@gmail.com` par votre adresse Gmail
- `xxxx xxxx xxxx xxxx` par le **mot de passe d’application** (pas votre mot de passe Gmail habituel)

4. **Redémarrer l’app** (pour charger les nouveaux secrets) :

```powershell
flyctl apps restart supfile
```

---

### Option B : Autre fournisseur (Outlook, OVH, etc.)

Même principe : définir les secrets avec les valeurs fournies par votre hébergeur.

**Exemple Outlook / Microsoft 365 :**

```powershell
flyctl secrets set SMTP_HOST=smtp.office365.com
flyctl secrets set SMTP_PORT=587
flyctl secrets set SMTP_USER=votre_email@outlook.com
flyctl secrets set SMTP_PASS=[REDACTED]
flyctl secrets set SMTP_FROM="SUPFile <votre_email@outlook.com>"
flyctl secrets set FRONTEND_URL=https://flourishing-banoffee-c0b1ad.netlify.app
```

**Exemple OVH :**

```powershell
flyctl secrets set SMTP_HOST=ssl0.ovh.net
flyctl secrets set SMTP_PORT=587
flyctl secrets set SMTP_USER=votre_email@votredomaine.com
flyctl secrets set SMTP_PASS=[REDACTED]
flyctl secrets set SMTP_FROM="SUPFile <votre_email@votredomaine.com>"
flyctl secrets set FRONTEND_URL=https://flourishing-banoffee-c0b1ad.netlify.app
```

---

## 3. Vérification

1. Lister les secrets (sans afficher les valeurs) :

```powershell
flyctl secrets list
```

Vous devez voir au moins : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FRONTEND_URL`.

2. Tester la récupération de mot de passe :

- Sur le site : https://flourishing-banoffee-c0b1ad.netlify.app → « Mot de passe oublié ? »
- Saisir l’email du compte
- Vérifier la boîte de réception (et les spams) : un email doit arriver à **cette adresse** avec le lien de réinitialisation et le logo SUPFile.

3. Consulter les logs :

```powershell
flyctl logs
```

En cas de succès, vous ne devriez plus voir « Configuration SMTP incomplète » ni « [DEV MODE] » ; à la place, un message du type « Email de réinitialisation envoyé à : … ».

---

## 4. Résumé des variables

| Variable        | Description                                      | Exemple                    |
|----------------|--------------------------------------------------|----------------------------|
| `SMTP_HOST`    | Serveur SMTP                                     | `smtp.gmail.com`           |
| `SMTP_PORT`    | Port (souvent 587 ou 465)                        | `587`                      |
| `SMTP_USER`    | Compte email utilisé pour envoyer                | `votre_email@gmail.com`    |
| `SMTP_PASS`    | Mot de passe (Gmail : mot de passe d’application)| Mot de passe d’application |
| `SMTP_FROM`    | Adresse / nom affiché comme expéditeur (optionnel) | `SUPFile <email@...>`   |
| `FRONTEND_URL` | URL du frontend (pour le lien dans l’email)      | `https://...netlify.app`   |

---

## 5. Envoi vers l’adresse fournie par l’utilisateur

Le code envoie toujours l’email à **l’adresse que l’utilisateur a saisie** dans le formulaire « Mot de passe oublié » :

- L’utilisateur entre son email → le backend génère un token et appelle `sendPasswordResetEmail(email, resetUrl)`.
- L’email est envoyé à cette adresse `email` avec le lien de réinitialisation et le logo SUPFile.

Dès que SMTP est correctement configuré (comme ci-dessus), ce comportement est actif en production.
