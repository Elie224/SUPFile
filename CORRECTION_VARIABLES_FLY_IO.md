# 🔧 Correction des Erreurs "has invalid format" sur Fly.io

## 🎯 Solution : Utiliser `flyctl secrets set` au lieu de l'interface web

L'interface web de Fly.io peut avoir des problèmes de validation. Utilisez la **ligne de commande** pour définir les variables d'environnement.

---

## 📋 Commandes à Exécuter

### 1. Ouvrir PowerShell dans le dossier backend

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
```

### 2. Définir les variables d'environnement une par une

**⚠️ IMPORTANT :** Remplacez les valeurs entre `[...]` par vos vraies valeurs.

```powershell
# Environnement
flyctl secrets set NODE_ENV=production

# Port
flyctl secrets set PORT=5000

# MongoDB
flyctl secrets set MONGO_URI="mongodb+srv://kouroumaelisee_db_user:3mvU3jm97uBaEDEt@cluster0.u3cxqhm.mongodb.net/supfile?retryWrites=true&w=majority"

# JWT Secrets (générez-les d'abord si vous ne les avez pas)
flyctl secrets set JWT_SECRET="[VOTRE_JWT_SECRET]"
flyctl secrets set JWT_REFRESH_SECRET="[VOTRE_JWT_REFRESH_SECRET]"
flyctl secrets set SESSION_SECRET="[VOTRE_SESSION_SECRET]"

# Frontend & CORS
flyctl secrets set FRONTEND_URL="https://flourishing-banoffee-c0b1ad.netlify.app"
flyctl secrets set CORS_ORIGIN="https://flourishing-banoffee-c0b1ad.netlify.app"

# OAuth Google
flyctl secrets set GOOGLE_CLIENT_ID="[VOTRE_GOOGLE_CLIENT_ID]"
flyctl secrets set GOOGLE_CLIENT_SECRET="[VOTRE_GOOGLE_CLIENT_SECRET]"
flyctl secrets set GOOGLE_REDIRECT_URI="https://supfile.fly.dev/api/auth/google/callback"

# OAuth GitHub
flyctl secrets set GITHUB_CLIENT_ID="[VOTRE_GITHUB_CLIENT_ID]"
flyctl secrets set GITHUB_CLIENT_SECRET="[VOTRE_GITHUB_CLIENT_SECRET]"
flyctl secrets set GITHUB_REDIRECT_URI="https://supfile.fly.dev/api/auth/github/callback"
```

---

## 🔑 Générer les Secrets JWT

Si vous n'avez pas encore généré les secrets, exécutez cette commande PowerShell **3 fois** pour générer 3 secrets différents :

```powershell
# Générer un secret aléatoire de 64 caractères
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Copiez chaque résultat** et utilisez-le pour :
1. `JWT_SECRET`
2. `JWT_REFRESH_SECRET` (différent du premier)
3. `SESSION_SECRET` (différent des deux autres)

---

## ⚠️ Points Importants

### 1. Nom de l'Application Fly.io

**Remplacez `supfile` par le nom réel de votre application Fly.io** dans les commandes ci-dessus.

Pour vérifier le nom de votre app :
```powershell
flyctl apps list
```

Ou si vous créez une nouvelle app :
```powershell
flyctl apps create supfile
```

### 2. URLs avec Caractères Spéciaux

Si vous avez des problèmes avec des URLs contenant des caractères spéciaux, utilisez des guillemets doubles :

```powershell
# ✅ CORRECT
flyctl secrets set FRONTEND_URL="https://flourishing-banoffee-c0b1ad.netlify.app"

# ❌ INCORRECT (sans guillemets si l'URL contient des caractères spéciaux)
flyctl secrets set FRONTEND_URL=https://flourishing-banoffee-c0b1ad.netlify.app
```

### 3. Vérifier les Variables Définies

Pour voir toutes les variables d'environnement définies :

```powershell
flyctl secrets list
```

---

## 🚨 Si l'Application Fly.io n'existe pas encore

Si vous n'avez pas encore créé l'application Fly.io, créez-la d'abord :

```powershell
# 1. Se connecter à Fly.io (si pas déjà fait)
flyctl auth login

# 2. Créer l'application
flyctl apps create supfile

# 3. Initialiser le projet (dans le dossier backend)
flyctl launch
```

**Note :** `flyctl launch` va créer un `fly.toml`. Vous pouvez répondre "no" aux questions et configurer manuellement.

---

## 🔍 Vérification

Après avoir défini toutes les variables :

```powershell
# Lister toutes les variables
flyctl secrets list

# Vérifier que l'app est configurée
flyctl status

# Voir les logs (après déploiement)
flyctl logs
```

---

## 📝 Alternative : Fichier de Secrets

Si vous préférez définir toutes les variables en une fois, créez un fichier `secrets.txt` :

```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://kouroumaelisee_db_user:3mvU3jm97uBaEDEt@cluster0.u3cxqhm.mongodb.net/supfile?retryWrites=true&w=majority
JWT_SECRET=votre_secret_ici
JWT_REFRESH_SECRET=votre_refresh_secret_ici
SESSION_SECRET=votre_session_secret_ici
FRONTEND_URL=https://flourishing-banoffee-c0b1ad.netlify.app
CORS_ORIGIN=https://flourishing-banoffee-c0b1ad.netlify.app
GOOGLE_CLIENT_ID=votre_google_client_id
GOOGLE_CLIENT_SECRET=votre_google_client_secret
GOOGLE_REDIRECT_URI=https://supfile.fly.dev/api/auth/google/callback
GITHUB_CLIENT_ID=votre_github_client_id
GITHUB_CLIENT_SECRET=votre_github_client_secret
GITHUB_REDIRECT_URI=https://supfile.fly.dev/api/auth/github/callback
```

Puis importez-le :

```powershell
flyctl secrets import < secrets.txt
```

**⚠️ ATTENTION :** Ne commitez **JAMAIS** ce fichier dans Git ! Supprimez-le après utilisation.

---

## 🎯 Résumé des Actions

1. ✅ Ouvrir PowerShell dans `backend/`
2. ✅ Se connecter : `flyctl auth login`
3. ✅ Créer l'app si nécessaire : `flyctl apps create supfile`
4. ✅ Définir les variables avec `flyctl secrets set`
5. ✅ Vérifier avec `flyctl secrets list`
6. ✅ Déployer : `flyctl deploy`

---

## ❓ Problèmes Courants

### Erreur : "app not found"
→ Créez d'abord l'application avec `flyctl apps create supfile`

### Erreur : "not authenticated"
→ Connectez-vous avec `flyctl auth login`

### Erreur : "invalid value"
→ Vérifiez qu'il n'y a pas d'espaces avant/après les guillemets
→ Utilisez des guillemets doubles pour les valeurs avec caractères spéciaux

### L'interface web montre toujours des erreurs
→ C'est normal, l'interface web peut avoir des bugs. Utilisez `flyctl secrets list` pour vérifier que les variables sont bien définies.
