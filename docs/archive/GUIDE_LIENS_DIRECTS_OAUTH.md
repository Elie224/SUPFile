# 🔗 Guide avec Liens Directs - OAuth Google et GitHub

## 🔧 Partie 1 : Google Cloud Console

### 📍 Lien Direct

**Accès direct aux Credentials** : https://console.cloud.google.com/apis/credentials

---

### Étape 1 : Accéder à la Console

1. **Cliquez sur ce lien** : https://console.cloud.google.com/apis/credentials
   - Si vous n'êtes pas connecté, Google vous demandera de vous connecter
   - Utilisez le compte Google avec lequel vous avez créé le projet OAuth

2. **Si vous voyez une page de sélection de projet** :
   - Cliquez sur le projet qui contient votre OAuth Client
   - Le nom du projet pourrait être "SUPFile" ou quelque chose de similaire

---

### Étape 2 : Trouver votre OAuth Client

**Sur la page des Credentials**, vous verrez un tableau avec plusieurs colonnes :

| Type | Name | Client ID | Actions |
|------|------|-----------|---------|
| OAuth 2.0 Client ID | [Nom de votre client] | 860515202678-rae4pot74t5jmbs12c2012ivki3neron | [Icônes] |

**Ce que vous devez faire** :

1. **Cherchez la ligne** avec "OAuth 2.0 Client ID" dans la colonne "Type"
2. **Cherchez le Client ID** : `860515202678-rae4pot74t5jmbs12c2012ivki3neron` dans la colonne "Client ID"
3. **Cliquez sur le nom** de l'OAuth Client (dans la colonne "Name")
   - ⚠️ **Ne cliquez pas** sur les icônes à droite (modifier, supprimer, etc.)
   - ⚠️ **Cliquez sur le texte du nom** lui-même

---

### Étape 3 : Page de Détails de l'OAuth Client

**Une fois que vous avez cliqué**, vous verrez une page avec plusieurs sections :

```
┌─────────────────────────────────────────┐
│ OAuth client                            │
├─────────────────────────────────────────┤
│ Name: [Nom de votre client]            │
│                                         │
│ Authorized JavaScript origins           │
│ ┌───────────────────────────────────┐  │
│ │ http://localhost:5000             │  │
│ │ https://supfile-1.onrender.com    │  │
│ └───────────────────────────────────┘  │
│                                         │
│ Authorized redirect URIs                │
│ ┌───────────────────────────────────┐  │
│ │ http://localhost:5000/api/auth/...│  │
│ │ https://supfile-1.onrender.com/...│  │
│ └───────────────────────────────────┘  │
│                                         │
│ [Save] [Cancel]                        │
└─────────────────────────────────────────┘
```

**Ce que vous devez faire** :

1. **Faites défiler** jusqu'à la section **"Authorized redirect URIs"**
2. **Vous verrez** probablement déjà des URLs comme :
   - `http://localhost:5000/api/auth/google/callback`
   - `https://supfile-1.onrender.com/api/auth/google/callback`
   - Ou d'autres URLs

3. **Cliquez sur le bouton "+ ADD URI"** (ou l'icône "+")
   - Ce bouton est généralement à droite de "Authorized redirect URIs"
   - Ou en bas de la liste des URLs existantes

4. **Un nouveau champ de texte apparaît** (vide)
   - Tapez exactement : `https://supfile.fly.dev/api/auth/google/callback`
   - ⚠️ **Copiez-collez** cette URL pour éviter les erreurs :
     ```
     https://supfile.fly.dev/api/auth/google/callback
     ```

5. **Vérifiez** :
   - ✅ Commence par `https://` (pas `http://`)
   - ✅ Pas d'espace avant ou après
   - ✅ Pas de slash `/` à la fin (sauf après `callback`)
   - ✅ Exactement : `https://supfile.fly.dev/api/auth/google/callback`

6. **Cliquez sur "Save"** en bas de la page
   - Le bouton est généralement en bleu
   - En bas à droite ou au centre de la page

---

### Étape 4 : Vérification

**Après avoir cliqué sur "Save"** :

1. **Vous verrez** un message en haut de la page : "OAuth client updated" ou similaire
2. **Vérifiez** que la nouvelle URL apparaît maintenant dans la liste "Authorized redirect URIs"
3. **Vous devriez voir** :
   ```
   Authorized redirect URIs
   ┌──────────────────────────────────────────────┐
   │ http://localhost:5000/api/auth/google/callback│
   │ https://supfile-1.onrender.com/api/auth/...  │
   │ https://supfile.fly.dev/api/auth/google/...  │ ← NOUVELLE URL
   └──────────────────────────────────────────────┘
   ```

---

## 🔧 Partie 2 : GitHub Developer Settings

### 📍 Lien Direct

**Accès direct aux OAuth Apps** : https://github.com/settings/developers/oauth-apps

**Ou accès général** : https://github.com/settings/developers

---

### Étape 1 : Accéder aux Paramètres Développeur

1. **Cliquez sur ce lien** : https://github.com/settings/developers
   - Si vous n'êtes pas connecté, GitHub vous demandera de vous connecter
   - Utilisez le compte GitHub avec lequel vous avez créé l'OAuth App

2. **Vous verrez** une page avec un menu à gauche :
   ```
   ┌─────────────────────────────────────┐
   │ Developer settings                  │
   ├─────────────────────────────────────┤
   │ Personal access tokens              │
   │ Fine-grained tokens                 │
   │ OAuth Apps              ← CLIQUEZ ICI│
   │ GitHub Apps                          │
   │ etc.                                 │
   └─────────────────────────────────────┘
   ```

---

### Étape 2 : Accéder aux OAuth Apps

**Option A : Via le lien direct** (plus rapide)

1. **Cliquez directement sur** : https://github.com/settings/developers/oauth-apps

**Option B : Via le menu**

1. **Dans le menu de gauche**, cliquez sur **"OAuth Apps"**
   - C'est la troisième option dans la liste

---

### Étape 3 : Trouver votre Application OAuth

**Sur la page "OAuth Apps"**, vous verrez une liste de vos applications :

```
┌─────────────────────────────────────────────────────────┐
│ OAuth Apps                                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Nom de votre app]                                      │
│ Client ID: Ov23ligHjSi2qTjUNtCc                        │
│                                                          │
│ [Autre app si vous en avez]                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Ce que vous devez faire** :

1. **Cherchez** l'application avec le **Client ID** : `Ov23ligHjSi2qTjUNtCc`
2. **Cliquez sur le nom** de l'application (pas sur "Edit" ou autres boutons)
   - Le nom pourrait être "SUPFile" ou quelque chose de similaire

---

### Étape 4 : Page de Détails de l'OAuth App

**Une fois que vous avez cliqué**, vous verrez une page avec plusieurs champs :

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
   - C'est généralement le quatrième ou cinquième champ

2. **Cliquez dans le champ "Authorization callback URL"**
   - Le texte actuel sera sélectionné automatiquement
   - Ou sélectionnez tout avec **Ctrl+A** (Windows) ou **Cmd+A** (Mac)

3. **Remplacez tout le texte** par :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```
   - ⚠️ **Copiez-collez** cette URL pour éviter les erreurs
   - ⚠️ **Supprimez** complètement l'ancienne URL

4. **Vérifiez** :
   - ✅ Commence par `https://` (pas `http://`)
   - ✅ Pas d'espace avant ou après
   - ✅ Pas de slash `/` à la fin (sauf après `callback`)
   - ✅ Exactement : `https://supfile.fly.dev/api/auth/github/callback`

5. **Faites défiler vers le bas** de la page

6. **Cliquez sur le bouton "Update application"**
   - Le bouton est généralement en vert
   - En bas de la page, à droite

---

### Étape 5 : Vérification

**Après avoir cliqué sur "Update application"** :

1. **Vous verrez** un message en haut de la page : "Application updated" ou similaire
2. **Vérifiez** que le champ "Authorization callback URL" affiche maintenant :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```
3. **La page devrait se recharger** et afficher les nouvelles informations

---

## 📋 Résumé des Liens Directs

### Google Cloud Console

- **Credentials (direct)** : https://console.cloud.google.com/apis/credentials
- **Console principale** : https://console.cloud.google.com/

### GitHub Developer Settings

- **OAuth Apps (direct)** : https://github.com/settings/developers/oauth-apps
- **Developer Settings (général)** : https://github.com/settings/developers

---

## ✅ Checklist Rapide

### Google OAuth
- [ ] Cliqué sur : https://console.cloud.google.com/apis/credentials
- [ ] Trouvé l'OAuth Client avec ID : `860515202678-rae4pot74t5jmbs12c2012ivki3neron`
- [ ] Cliqué sur le nom de l'OAuth Client
- [ ] Fait défiler jusqu'à "Authorized redirect URIs"
- [ ] Cliqué sur "+ ADD URI"
- [ ] Ajouté : `https://supfile.fly.dev/api/auth/google/callback`
- [ ] Cliqué sur "Save"
- [ ] Vérifié que la nouvelle URL apparaît dans la liste

### GitHub OAuth
- [ ] Cliqué sur : https://github.com/settings/developers/oauth-apps
- [ ] Trouvé l'OAuth App avec Client ID : `Ov23ligHjSi2qTjUNtCc`
- [ ] Cliqué sur le nom de l'OAuth App
- [ ] Trouvé le champ "Authorization callback URL"
- [ ] Remplacé l'URL par : `https://supfile.fly.dev/api/auth/github/callback`
- [ ] Cliqué sur "Update application"
- [ ] Vérifié que la nouvelle URL est affichée

---

## 🆘 Si Vous Ne Trouvez Pas

### Google Cloud Console

**Si vous ne voyez pas la page des Credentials** :

1. **Vérifiez que vous êtes connecté** avec le bon compte Google
2. **Vérifiez que vous avez sélectionné le bon projet** (en haut de la page, à côté du logo Google Cloud)
3. **Essayez ce lien** : https://console.cloud.google.com/apis/credentials?project=[VOTRE-PROJECT-ID]
4. **Ou allez dans** : APIs & Services → Credentials (menu de gauche)

**Si vous ne trouvez pas votre OAuth Client** :

1. **Vérifiez que vous êtes dans le bon projet** Google Cloud
2. **Cherchez** dans la liste tous les "OAuth 2.0 Client ID"
3. **Vérifiez le Client ID** dans chaque ligne jusqu'à trouver `860515202678-rae4pot74t5jmbs12c2012ivki3neron`

### GitHub Developer Settings

**Si vous ne voyez pas la page OAuth Apps** :

1. **Vérifiez que vous êtes connecté** avec le bon compte GitHub
2. **Essayez le lien direct** : https://github.com/settings/developers/oauth-apps
3. **Ou allez dans** : Settings (icône profil en haut à droite) → Developer settings → OAuth Apps

**Si vous ne trouvez pas votre OAuth App** :

1. **Vérifiez que vous êtes sur le bon compte** GitHub
2. **Cherchez** dans la liste toutes les applications OAuth
3. **Vérifiez le Client ID** de chaque application jusqu'à trouver `Ov23ligHjSi2qTjUNtCc`

---

## 🎯 URLs Exactes à Utiliser

### Google OAuth Redirect URI
```
https://supfile.fly.dev/api/auth/google/callback
```

### GitHub OAuth Redirect URI
```
https://supfile.fly.dev/api/auth/github/callback
```

⚠️ **Important** : Copiez-collez exactement ces URLs, sans espace, sans modification !

---

## 🎉 Une Fois Terminé

Après avoir suivi ces étapes :

- ✅ **Google OAuth** acceptera les redirections depuis `https://supfile.fly.dev`
- ✅ **GitHub OAuth** acceptera les redirections depuis `https://supfile.fly.dev`
- ✅ **L'authentification OAuth** fonctionnera sur votre application !

Vous pouvez maintenant tester la connexion OAuth sur votre application ! 🚀
