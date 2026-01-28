# 🌐 Instructions Détaillées - Mise à Jour Netlify

## 📍 Lien Direct

**Accès direct à Netlify** : https://app.netlify.com/

---

## 🎯 Étape 1 : Accéder à Netlify

1. **Cliquez sur ce lien** : https://app.netlify.com/
2. **Connectez-vous** avec votre compte Netlify (si ce n'est pas déjà fait)
3. **Vous verrez** votre tableau de bord avec la liste de vos sites

---

## 🔍 Étape 2 : Trouver votre Site

**Sur le tableau de bord Netlify**, vous verrez une liste de vos sites.

**Ce que vous devez chercher** :

1. **Cherchez votre site SUPFile**
   - Le nom pourrait être : `flourishing-banoffee-c0b1ad` (ou un nom similaire)
   - Ou cherchez par le nom de domaine personnalisé si vous en avez un

2. **Cliquez sur le nom** de votre site (pas sur l'icône, mais sur le texte)

---

## ⚙️ Étape 3 : Accéder aux Paramètres du Site

**Une fois que vous avez cliqué sur votre site**, vous verrez plusieurs onglets en haut :

```
┌─────────────────────────────────────┐
│ Overview  Deploys  Site settings    │
│              ↑                       │
│         CLIQUEZ ICI                  │
└─────────────────────────────────────┘
```

1. **Cliquez sur l'onglet "Site settings"** (ou "Paramètres du site" si votre interface est en français)
   - C'est généralement le troisième onglet

---

## 🔧 Étape 4 : Accéder aux Variables d'Environnement

**Dans la page "Site settings"**, vous verrez un menu à gauche avec plusieurs options :

```
┌─────────────────────────────────────┐
│ Site settings                        │
├─────────────────────────────────────┤
│ General                              │
│ Domain management                    │
│ Build & deploy                       │
│ Environment variables  ← CLIQUEZ ICI│
│ Identity                             │
│ ...                                  │
└─────────────────────────────────────┘
```

1. **Dans le menu de gauche**, cliquez sur **"Environment variables"**
   - C'est généralement la quatrième option

---

## ✏️ Étape 5 : Modifier la Variable VITE_API_URL

**Dans la page "Environment variables"**, vous verrez un tableau avec vos variables d'environnement.

### Si la Variable Existe Déjà

1. **Cherchez** la variable `VITE_API_URL` dans le tableau
   - Elle devrait avoir une valeur comme : `https://supfile-1.onrender.com` ou une autre URL

2. **Cliquez sur l'icône "Edit"** (icône de crayon) à droite de la ligne
   - Ou cliquez sur les trois points "..." puis "Edit"

3. **Un formulaire s'ouvre** :
   - **Key** : `VITE_API_URL` (ne changez pas)
   - **Value** : Remplacez la valeur actuelle par :
     ```
     https://supfile.fly.dev
     ```
   - ⚠️ **Important** : Vérifiez qu'il n'y a pas d'espace avant ou après
   - ⚠️ **Important** : Vérifiez que c'est bien `https://` (pas `http://`)
   - ⚠️ **Important** : Pas de slash `/` à la fin (juste `https://supfile.fly.dev`)

4. **Vérifiez les "Scopes"** :
   - Cochez au moins "Production" (et "Deploy previews" / "Branch deploys" si vous voulez)

5. **Cliquez sur "Save"** (ou "Enregistrer")

### Si la Variable N'Existe Pas

1. **Cliquez sur le bouton "Add a variable"** (ou "Ajouter une variable")
   - Ce bouton est généralement en haut à droite ou en bas du tableau

2. **Remplissez le formulaire** :
   - **Key** : `VITE_API_URL`
   - **Value** : `https://supfile.fly.dev`
   - ⚠️ **Important** : Vérifiez qu'il n'y a pas d'espace avant ou après
   - ⚠️ **Important** : Vérifiez que c'est bien `https://` (pas `http://`)
   - ⚠️ **Important** : Pas de slash `/` à la fin

3. **Sélectionnez les "Scopes"** :
   - Cochez au moins "Production" (et les autres si vous voulez)

4. **Cliquez sur "Save"** (ou "Enregistrer")

---

## 🚀 Étape 6 : Redéployer le Site

**Après avoir modifié la variable**, vous devez redéployer le site pour que les changements prennent effet.

### Méthode 1 : Via l'Onglet Deploys (Recommandé)

1. **Retournez à la page principale** de votre site
   - Cliquez sur le nom du site en haut ou sur l'onglet "Overview"

2. **Cliquez sur l'onglet "Deploys"** (ou "Déploiements")

3. **En haut à droite**, cherchez le bouton **"Trigger deploy"** (ou "Déclencher un déploiement")

4. **Cliquez sur "Trigger deploy"**

5. **Un menu déroulant apparaît**, cliquez sur **"Deploy site"** (ou "Déployer le site")

6. **Un nouveau déploiement commence** immédiatement

7. **Attendez** que le statut passe à "Published" (cela peut prendre 1-3 minutes)

### Méthode 2 : Via Git (Si votre site est connecté à Git)

Si votre site Netlify est connecté à un dépôt Git, vous pouvez aussi :

1. **Faire un commit** dans votre dépôt Git (même un commit vide)
2. **Pousser** vers GitHub/GitLab
3. **Netlify redéploiera automatiquement**

---

## ✅ Étape 7 : Vérification

**Après le déploiement** :

1. **Vérifiez** que le déploiement s'est terminé avec succès (statut "Published")

2. **Ouvrez votre site Netlify** dans le navigateur

3. **Ouvrez la console du navigateur** (F12 → onglet "Console")

4. **Rechargez la page** ou effectuez une action

5. **Dans l'onglet "Network"** (F12 → Network), cherchez les requêtes vers l'API

6. **Vérifiez** que les requêtes vont vers `https://supfile.fly.dev` (pas vers l'ancienne URL)

---

## 📋 Checklist Complète

- [ ] Connecté à Netlify : https://app.netlify.com/
- [ ] Site trouvé et ouvert
- [ ] Onglet "Site settings" ouvert
- [ ] Menu "Environment variables" ouvert
- [ ] Variable `VITE_API_URL` trouvée ou créée
- [ ] Valeur mise à jour avec `https://supfile.fly.dev`
- [ ] Changements sauvegardés
- [ ] Onglet "Deploys" ouvert
- [ ] Bouton "Trigger deploy" cliqué
- [ ] "Deploy site" sélectionné
- [ ] Déploiement terminé avec succès (statut "Published")
- [ ] Site testé dans le navigateur
- [ ] Requêtes API vérifiées (F12 → Network)

---

## 🎯 URL Exacte à Utiliser

```
https://supfile.fly.dev
```

⚠️ **Important** : 
- Pas de slash `/` à la fin
- Commence par `https://` (pas `http://`)
- Pas d'espace avant ou après

---

## 🆘 Si Vous Avez un Problème

### La Variable N'Apparaît Pas Après le Déploiement

- Vérifiez que vous avez bien cliqué sur "Save" après avoir modifié la variable
- Vérifiez que le déploiement s'est terminé avec succès
- Attendez 1-2 minutes (les changements peuvent prendre un peu de temps)

### Le Site Ne Se Connecte Pas au Backend

- Vérifiez que `VITE_API_URL` est bien défini avec la valeur `https://supfile.fly.dev`
- Vérifiez que vous avez redéployé le site après avoir modifié la variable
- Ouvrez la console du navigateur (F12) pour voir les erreurs exactes
- Vérifiez que les requêtes dans l'onglet "Network" vont vers `https://supfile.fly.dev`

### Le Déploiement Échoue

- Vérifiez les logs du déploiement dans Netlify
- Vérifiez qu'il n'y a pas d'erreur de build
- Essayez de redéployer à nouveau

---

## ✅ Une Fois Terminé

Après avoir suivi ces étapes :

- ✅ **Variable `VITE_API_URL`** mise à jour avec `https://supfile.fly.dev`
- ✅ **Site redéployé** avec la nouvelle configuration
- ✅ **Frontend Netlify** se connectera maintenant au backend Fly.io
- ✅ **Toutes les requêtes API** iront vers `https://supfile.fly.dev`

**Prochaine étape** : Tester l'application complète (Web et Mobile) ! 🚀

---

C'est tout ! Suivez ces étapes pour finaliser la configuration Netlify ! 🎉
