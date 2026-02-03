# 🔧 Instructions Détaillées - GitHub OAuth

## 📍 Lien Direct

**Accès direct aux OAuth Apps GitHub** : https://github.com/settings/developers/oauth-apps

---

## 🎯 Étape 1 : Accéder à la Page OAuth Apps

1. **Cliquez sur ce lien** : https://github.com/settings/developers/oauth-apps
   - Si vous n'êtes pas connecté, GitHub vous demandera de vous connecter
   - Utilisez le compte GitHub avec lequel vous avez créé l'OAuth App

2. **Vous verrez** une page avec la liste de vos applications OAuth

---

## 🔍 Étape 2 : Trouver votre Application OAuth

**Sur la page "OAuth Apps"**, vous verrez une liste de vos applications.

**Ce que vous devez chercher** :

1. **Cherchez l'application** avec le **Client ID** : `Ov23ligHjSi2qTjUNtCc`
   - Le Client ID est affiché sous le nom de l'application
   - Il ressemble à : `Client ID: Ov23ligHjSi2qTjUNtCc`

2. **Le nom de l'application** pourrait être :
   - "SUPFile"
   - "supfile"
   - Ou un autre nom similaire

3. **Cliquez sur le nom** de l'application (pas sur "Edit" ou autres boutons)
   - Cliquez directement sur le texte du nom

---

## ✏️ Étape 3 : Modifier l'Authorization Callback URL

**Une fois que vous avez cliqué sur le nom de l'application**, vous verrez une page avec plusieurs champs :

```
┌─────────────────────────────────────────┐
│ Edit OAuth App                         │
├─────────────────────────────────────────┤
│ Application name                        │
│ [SUPFile ou nom similaire]             │
│                                         │
│ Homepage URL                            │
│ [https://...]                           │
│                                         │
│ Application description                 │
│ [Description]                           │
│                                         │
│ Authorization callback URL              │
│ [https://supfile-1.onrender.com/api/...] ← MODIFIER ICI
│                                         │
│ [Update application] [Cancel]           │
└─────────────────────────────────────────┘
```

**Ce que vous devez faire** :

1. **Faites défiler** jusqu'au champ **"Authorization callback URL"**
   - C'est généralement le quatrième champ dans la page
   - Il se trouve après "Application description"

2. **Cliquez dans le champ "Authorization callback URL"**
   - Le texte actuel sera probablement : `https://supfile-1.onrender.com/api/auth/github/callback`
   - Ou une autre URL similaire

3. **Sélectionnez tout le texte** dans ce champ :
   - **Windows** : Appuyez sur **Ctrl+A**
   - **Mac** : Appuyez sur **Cmd+A**
   - Ou cliquez trois fois rapidement dans le champ

4. **Supprimez l'ancienne URL** :
   - Appuyez sur **Suppr** ou **Backspace**
   - Le champ devrait être vide maintenant

5. **Tapez ou copiez-collez** la nouvelle URL :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```
   
   ⚠️ **Important** :
   - Commence par `https://` (pas `http://`)
   - Pas d'espace avant ou après
   - Exactement comme écrit ci-dessus
   - Pas de slash `/` à la fin (sauf après `callback`)

6. **Vérifiez** que le champ contient exactement :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```

---

## 💾 Étape 4 : Enregistrer les Modifications

1. **Faites défiler vers le bas** de la page

2. **Vous verrez deux boutons** en bas :
   - **"Update application"** (bouton vert) ← Cliquez ici
   - **"Cancel"** (bouton gris/blanc)

3. **Cliquez sur "Update application"**

---

## ✅ Étape 5 : Vérification

**Après avoir cliqué sur "Update application"** :

1. **Un message de confirmation** devrait apparaître en haut de la page :
   - "Application updated" ou "Application mise à jour"
   - En vert ou avec une icône de succès

2. **La page devrait se recharger** légèrement

3. **Vérifiez** que le champ "Authorization callback URL" affiche maintenant :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```

4. **Si vous voyez toujours l'ancienne URL** :
   - Rafraîchissez la page (F5)
   - Vérifiez que vous avez bien cliqué sur "Update application"

---

## 📋 Checklist Complète

- [ ] Cliqué sur : https://github.com/settings/developers/oauth-apps
- [ ] Connecté avec le bon compte GitHub
- [ ] Trouvé l'OAuth App avec Client ID : `Ov23ligHjSi2qTjUNtCc`
- [ ] Cliqué sur le nom de l'application
- [ ] Fait défiler jusqu'au champ "Authorization callback URL"
- [ ] Sélectionné tout le texte dans le champ (Ctrl+A)
- [ ] Supprimé l'ancienne URL
- [ ] Ajouté : `https://supfile.fly.dev/api/auth/github/callback`
- [ ] Vérifié qu'il n'y a pas d'erreur (pas d'espace, https:// correct)
- [ ] Fait défiler vers le bas
- [ ] Cliqué sur "Update application"
- [ ] Message de confirmation reçu
- [ ] Nouvelle URL visible dans le champ

---

## 🎯 URL Exacte à Copier-Coller

```
https://supfile.fly.dev/api/auth/github/callback
```

**Copiez cette URL** et collez-la dans le champ "Authorization callback URL" après avoir supprimé l'ancienne URL.

---

## 🆘 Si Vous Ne Trouvez Pas

### Si vous ne voyez pas la page OAuth Apps

1. **Vérifiez que vous êtes connecté** avec le bon compte GitHub
2. **Essayez le lien direct** : https://github.com/settings/developers/oauth-apps
3. **Ou allez dans** :
   - Cliquez sur votre photo de profil (en haut à droite)
   - Cliquez sur "Settings"
   - Dans le menu de gauche, cliquez sur "Developer settings"
   - Puis cliquez sur "OAuth Apps"

### Si vous ne trouvez pas votre OAuth App

1. **Vérifiez que vous êtes sur le bon compte** GitHub
2. **Cherchez** dans la liste toutes les applications OAuth
3. **Vérifiez le Client ID** de chaque application jusqu'à trouver `Ov23ligHjSi2qTjUNtCc`
4. **Note** : Si vous avez plusieurs comptes GitHub, assurez-vous d'être sur le bon

### Si le champ "Authorization callback URL" n'existe pas

1. **Vérifiez** que vous avez bien cliqué sur le nom de l'application (pas sur "Edit" ou autres)
2. **Faites défiler** vers le bas de la page
3. **Le champ devrait être** le quatrième ou cinquième champ dans la page

---

## ✅ Une Fois Terminé

Après avoir suivi ces étapes :

- ✅ **GitHub OAuth** acceptera maintenant les redirections depuis `https://supfile.fly.dev`
- ✅ **Votre application** pourra utiliser l'authentification GitHub avec le nouveau backend Fly.io

**Prochaine étape** : Mettre à jour Netlify (voir `GUIDE_DETAIL_MISE_A_JOUR.md`)

---

## 🎉 Résumé

1. **Aller sur** : https://github.com/settings/developers/oauth-apps
2. **Trouver** l'app avec Client ID : `Ov23ligHjSi2qTjUNtCc`
3. **Cliquer** sur le nom de l'application
4. **Modifier** "Authorization callback URL" avec : `https://supfile.fly.dev/api/auth/github/callback`
5. **Cliquer** sur "Update application"
6. **Vérifier** que la nouvelle URL est affichée

C'est tout ! 🚀
