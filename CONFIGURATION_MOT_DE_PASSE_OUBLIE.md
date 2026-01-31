# Configuration - Récupération de Mot de Passe Oublié

## ✅ Fonctionnalité Implémentée

La fonctionnalité de récupération de mot de passe a été ajoutée avec succès à SUPFile.

## 📋 Ce qui a été fait

### Backend
- ✅ Ajout des champs `reset_password_token` et `reset_password_expires` au modèle User
- ✅ Création de `backend/utils/mailer.js` pour l'envoi d'emails
- ✅ Ajout des fonctions dans `authController.js` :
  - `forgotPassword()` - Demande de réinitialisation
  - `verifyResetToken()` - Vérification du token
  - `resetPassword()` - Réinitialisation du mot de passe
- ✅ Ajout des routes dans `backend/routes/auth.js` :
  - `POST /api/auth/forgot-password`
  - `GET /api/auth/verify-reset-token/:token`
  - `POST /api/auth/reset-password`
- ✅ Ajout de `nodemailer` dans les dépendances

### Frontend
- ✅ Création de `ForgotPassword.jsx` - Page de demande
- ✅ Création de `ResetPassword.jsx` - Page de réinitialisation
- ✅ Ajout du lien "Mot de passe oublié ?" sur la page de connexion
- ✅ Ajout des routes dans `main.jsx`

### Email
- ✅ Template HTML professionnel avec le logo SUPFile
- ✅ Expiration du token : **15 minutes**
- ✅ Message d'avertissement visible dans l'email

## 🚀 Déploiement Requis

### 1. Installer nodemailer sur le serveur

Connectez-vous à votre serveur backend et exécutez :

```bash
cd backend
npm install
```

### 2. Redéployer sur Fly.io

**Option A : Via Fly.io CLI (recommandé)**

```bash
cd backend
flyctl deploy
```

**Option B : Via GitHub Actions (si configuré)**

Le déploiement se fera automatiquement après le push.

### 3. Configurer les variables d'environnement

Ajoutez ces variables sur Fly.io :

```bash
# Configuration SMTP (exemple avec Gmail)
flyctl secrets set SMTP_HOST=smtp.gmail.com
flyctl secrets set SMTP_PORT=587
flyctl secrets set SMTP_USER=votre_email@gmail.com
flyctl secrets set SMTP_PASS=[REDACTED]
flyctl secrets set SMTP_FROM=noreply@supfile.com

# URL du frontend
flyctl secrets set FRONTEND_URL=https://flourishing-banoffee-c0b1ad.netlify.app
```

**⚠️ Important pour Gmail :**
- N'utilisez PAS votre mot de passe Gmail normal
- Créez un "Mot de passe d'application" :
  1. Allez sur https://myaccount.google.com/security
  2. Activez la validation en 2 étapes si ce n'est pas fait
  3. Allez dans "Mots de passe des applications"
  4. Créez un nouveau mot de passe pour "Mail"
  5. Utilisez ce mot de passe dans `SMTP_PASS`

## 🧪 Test en Mode Développement

Si SMTP n'est pas configuré, le système fonctionne en mode développement :
- L'URL de réinitialisation s'affiche dans les logs du serveur
- Aucun email n'est envoyé
- Vous pouvez copier l'URL depuis les logs pour tester

## 📧 Fonctionnement

1. **L'utilisateur oublie son mot de passe**
   - Il clique sur "Mot de passe oublié ?" sur la page de connexion
   - Il entre son adresse email

2. **Le système génère un token**
   - Token sécurisé (crypto.randomBytes)
   - Hashé en SHA256 avant stockage en base
   - Expire après **15 minutes**

3. **L'email est envoyé**
   - Template professionnel avec logo SUPFile
   - Bouton de réinitialisation
   - Avertissement d'expiration visible
   - Lien alternatif si le bouton ne fonctionne pas

4. **L'utilisateur clique sur le lien**
   - Le token est vérifié automatiquement
   - Si valide : formulaire de nouveau mot de passe
   - Si expiré : message d'erreur avec option de redemander

5. **Nouveau mot de passe**
   - Validation : 8 caractères, 1 majuscule, 1 chiffre
   - Toutes les sessions sont révoquées
   - L'utilisateur peut se reconnecter

## 🔒 Sécurité

- ✅ Token hashé en base de données
- ✅ Expiration après 15 minutes
- ✅ Message générique (ne révèle pas si l'email existe)
- ✅ Révocation de toutes les sessions après réinitialisation
- ✅ Validation stricte du mot de passe

## 📱 Pages Frontend

### `/forgot-password`
- Formulaire email
- Message de succès
- Lien retour connexion

### `/reset-password?token=...`
- Vérification automatique du token
- Formulaire nouveau mot de passe
- Confirmation du mot de passe
- Messages d'erreur clairs

## 🐛 Résolution du problème 404

**Cause :** Le backend déployé sur Fly.io n'a pas encore les nouvelles routes.

**Solution :**
1. Installer nodemailer : `npm install` dans le dossier backend
2. Redéployer : `flyctl deploy` depuis le dossier backend
3. Configurer SMTP (voir section "Configurer les variables d'environnement")

## ✅ Vérification

Après déploiement, testez :

1. Allez sur votre site : https://flourishing-banoffee-c0b1ad.netlify.app
2. Cliquez sur "Mot de passe oublié ?"
3. Entrez votre email
4. Vérifiez que vous recevez l'email (ou consultez les logs en mode dev)
5. Cliquez sur le lien dans l'email
6. Réinitialisez votre mot de passe
7. Connectez-vous avec le nouveau mot de passe

## 📝 Notes

- En production, configurez SMTP pour l'envoi réel d'emails
- En développement, l'URL apparaît dans les logs du serveur
- Le logo est chargé depuis votre frontend déployé
- Les tokens expirent après 15 minutes pour la sécurité
