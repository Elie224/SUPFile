# 🌐 Accès à Netlify - Instructions

## ⚠️ Important : Vous êtes sur Fly.io, pas Netlify !

D'après votre écran, vous êtes actuellement sur **Fly.io** (https://fly.io/apps/supfile).

**Fly.io** = Backend (API) → Vous avez déjà configuré ✅
**Netlify** = Frontend (Site web) → C'est là qu'il faut aller maintenant

---

## 🎯 Accéder à Netlify

### Étape 1 : Ouvrir Netlify dans un Nouvel Onglet

1. **Ouvrez un nouvel onglet** dans votre navigateur (Ctrl+T ou Cmd+T)
2. **Allez sur** : https://app.netlify.com/
3. **Connectez-vous** avec votre compte Netlify
   - ⚠️ **C'est un compte différent** de Fly.io
   - Si vous n'avez pas de compte Netlify, créez-en un

### Étape 2 : Trouver votre Site

**Sur le tableau de bord Netlify**, vous verrez une liste de vos sites.

**Ce que vous devez chercher** :

1. **Cherchez votre site SUPFile**
   - Le nom pourrait être : `flourishing-banoffee-c0b1ad` (ou un nom similaire)
   - Ou cherchez par le nom de domaine personnalisé si vous en avez un

2. **Cliquez sur le nom** de votre site

---

## 📋 Différence entre Fly.io et Netlify

### Fly.io (Backend - API)
- **URL** : https://fly.io/apps/supfile
- **Ce que vous voyez** : Overview, Machines, Secrets, Settings
- **Pas de "Site settings"** → C'est normal, c'est pour le backend

### Netlify (Frontend - Site Web)
- **URL** : https://app.netlify.com/
- **Ce que vous verrez** : Overview, Deploys, **Site settings** ← C'est ici !
- **C'est là** que vous trouverez "Site settings" et "Environment variables"

---

## 🎯 Chemin Complet pour Netlify

1. **Allez sur** : https://app.netlify.com/
2. **Connectez-vous** avec votre compte Netlify
3. **Cliquez sur votre site** (probablement `flourishing-banoffee-c0b1ad`)
4. **Cliquez sur l'onglet "Site settings"** (en haut de la page)
5. **Dans le menu de gauche**, cliquez sur **"Environment variables"**

---

## 🔍 Si Vous N'avez Pas de Compte Netlify

Si vous n'avez pas encore de compte Netlify ou si vous ne trouvez pas votre site :

1. **Allez sur** : https://app.netlify.com/
2. **Cliquez sur "Sign up"** ou "Log in"
3. **Connectez-vous** avec GitHub, Email, ou un autre service
4. **Si votre site est déjà déployé**, il devrait apparaître dans la liste
5. **Si votre site n'est pas déployé**, vous devrez le déployer d'abord

---

## 📋 Checklist

- [ ] Nouvel onglet ouvert dans le navigateur
- [ ] Allé sur : https://app.netlify.com/
- [ ] Connecté avec le compte Netlify
- [ ] Site trouvé dans la liste (probablement `flourishing-banoffee-c0b1ad`)
- [ ] Cliqué sur le nom du site
- [ ] Onglet "Site settings" visible (en haut de la page)
- [ ] Cliqué sur "Site settings"
- [ ] Menu "Environment variables" visible (menu de gauche)

---

## 🆘 Si Vous Ne Trouvez Pas Votre Site sur Netlify

### Option 1 : Vérifier que le Site Existe

1. **Vérifiez** que votre frontend a bien été déployé sur Netlify
2. **Cherchez** dans tous vos sites Netlify
3. **Vérifiez** que vous êtes connecté avec le bon compte Netlify

### Option 2 : Déployer le Site sur Netlify

Si votre site n'est pas encore sur Netlify :

1. **Allez sur** : https://app.netlify.com/
2. **Cliquez sur "Add new site"** → "Import an existing project"
3. **Connectez votre dépôt Git** (GitHub, GitLab, etc.)
4. **Configurez le build** :
   - Build command : `npm run build` (ou `yarn build`)
   - Publish directory : `dist` (ou `build`)
5. **Ajoutez la variable d'environnement** `VITE_API_URL` = `https://supfile.fly.dev`
6. **Déployez**

---

## 🎯 Résumé

**Vous êtes actuellement sur** : Fly.io (Backend) ✅
**Vous devez aller sur** : Netlify (Frontend) ← C'est là qu'il y a "Site settings"

**Lien direct Netlify** : https://app.netlify.com/

Ouvrez Netlify dans un nouvel onglet et suivez les instructions ! 🚀
