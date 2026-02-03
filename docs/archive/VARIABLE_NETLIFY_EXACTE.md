# 📝 Variable à Ajouter sur Netlify

## 🎯 Variable Exacte à Ajouter

### Nom de la Variable (Key)
```
VITE_API_URL
```

### Valeur de la Variable (Value)
```
https://supfile.fly.dev
```

---

## 📋 Instructions Complètes

### Étape 1 : Accéder à Environment Variables

1. **Allez sur** : https://app.netlify.com/
2. **Cliquez sur votre site** (probablement `flourishing-banoffee-c0b1ad`)
3. **Cliquez sur "Site settings"** (onglet en haut)
4. **Cliquez sur "Environment variables"** (menu de gauche)

### Étape 2 : Ajouter la Variable

1. **Cliquez sur "Add a variable"** (ou "Ajouter une variable")
   - Bouton généralement en haut à droite ou en bas du tableau

2. **Remplissez le formulaire** :
   - **Key** (Nom) : `VITE_API_URL`
   - **Value** (Valeur) : `https://supfile.fly.dev`
   
   ⚠️ **Important** :
   - Pas d'espace avant ou après
   - Commence par `https://` (pas `http://`)
   - Pas de slash `/` à la fin
   - Exactement : `https://supfile.fly.dev`

3. **Sélectionnez les "Scopes"** (Environnements) :
   - ✅ Cochez **"Production"** (obligatoire)
   - ✅ Cochez **"Deploy previews"** (recommandé)
   - ✅ Cochez **"Branch deploys"** (recommandé)

4. **Cliquez sur "Save"** (ou "Enregistrer")

---

## ✅ Vérification

**Après avoir cliqué sur "Save"**, vous devriez voir :

```
┌─────────────────────────────────────────┐
│ Key              │ Value                │
├─────────────────────────────────────────┤
│ VITE_API_URL     │ https://supfile.fly...│
└─────────────────────────────────────────┘
```

La variable `VITE_API_URL` devrait maintenant apparaître dans le tableau avec la valeur `https://supfile.fly.dev`.

---

## 🚀 Redéployer le Site

**Après avoir ajouté la variable**, vous devez redéployer le site :

1. **Retournez à la page principale** de votre site
2. **Cliquez sur l'onglet "Deploys"**
3. **Cliquez sur "Trigger deploy"** (en haut à droite)
4. **Cliquez sur "Deploy site"**
5. **Attendez** que le déploiement se termine (statut "Published")

---

## 📋 Résumé Rapide

**Variable à ajouter** :
- **Key** : `VITE_API_URL`
- **Value** : `https://supfile.fly.dev`
- **Scopes** : Production, Deploy previews, Branch deploys

**Puis** : Redéployer le site

---

C'est tout ! Ajoutez cette variable et redéployez ! 🚀
