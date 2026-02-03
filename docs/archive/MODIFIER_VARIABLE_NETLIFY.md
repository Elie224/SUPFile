# ✏️ Modifier la Variable VITE_API_URL sur Netlify

## ✅ Votre Situation : La Variable Existe Déjà

D'après votre écran, la variable `VITE_API_URL` **existe déjà** avec la valeur :
```
https://supfile-1.onrender.com
```

**Vous devez la MODIFIER**, pas en créer une nouvelle.

---

## 🎯 Solution : Modifier la Variable Existante

### Étape 1 : Trouver la Variable dans la Liste

**Sur votre écran**, vous devriez voir un tableau avec la variable `VITE_API_URL`.

**Actuellement, elle a la valeur** : `https://supfile-1.onrender.com` pour tous les contextes.

### Étape 2 : Cliquer sur l'Icône d'Édition

**Pour chaque ligne** dans le tableau (Production, Deploy Previews, etc.), vous verrez :

1. **Une icône de crayon/clipboard** (icône d'édition) à droite de la valeur
2. **Cliquez sur cette icône** pour modifier la valeur

**OU**

1. **Cliquez sur "Options"** (menu déroulant à droite de `VITE_API_URL`)
2. **Cliquez sur "Edit"** (ou "Modifier")

### Étape 3 : Modifier la Valeur

**Une fois que vous avez cliqué sur "Edit"** :

1. **Vous verrez un formulaire** avec :
   - **Key** : `VITE_API_URL` (ne changez pas)
   - **Value** : `https://supfile-1.onrender.com` (actuellement)

2. **Dans le champ "Value"** :
   - **Sélectionnez tout le texte** (Ctrl+A)
   - **Supprimez** l'ancienne URL
   - **Tapez ou copiez-collez** :
     ```
     https://supfile.fly.dev
     ```
   
   ⚠️ **Important** :
   - Commence par `https://` (pas `http://`)
   - Pas d'espace avant ou après
   - Pas de slash `/` à la fin
   - Exactement : `https://supfile.fly.dev`

3. **Vérifiez** que le champ contient exactement :
   ```
   https://supfile.fly.dev
   ```

4. **Cliquez sur "Save"** (ou "Enregistrer")

### Étape 4 : Vérification

**Après avoir cliqué sur "Save"** :

1. **Vous devriez voir** que toutes les valeurs sont maintenant `https://supfile.fly.dev`
2. **Le tableau devrait afficher** :
   ```
   Production: https://supfile.fly.dev
   Deploy Previews: https://supfile.fly.dev
   Branch deploys: https://supfile.fly.dev
   etc.
   ```

---

## 📋 Instructions pour les Deux Cas

### Cas 1 : La Variable Existe Déjà (Votre Cas Actuel) ✅

1. **Trouvez** `VITE_API_URL` dans le tableau
2. **Cliquez sur l'icône d'édition** (crayon/clipboard) à droite de la valeur
   - OU cliquez sur "Options" → "Edit"
3. **Modifiez la valeur** : remplacez `https://supfile-1.onrender.com` par `https://supfile.fly.dev`
4. **Cliquez sur "Save"**
5. **Redéployez** le site (onglet "Deploys" → "Trigger deploy")

### Cas 2 : La Variable N'Existe Pas (Si vous aviez dû en créer une)

1. **Cliquez sur "Add a variable"** (ou "Ajouter une variable")
2. **Remplissez** :
   - **Key** : `VITE_API_URL`
   - **Value** : `https://supfile.fly.dev`
3. **Sélectionnez les Scopes** : Production, Deploy previews, Branch deploys
4. **Cliquez sur "Save"**
5. **Redéployez** le site

---

## 🎯 Action Immédiate pour Vous

**Puisque la variable existe déjà** :

1. **Dans le tableau**, trouvez la ligne avec `VITE_API_URL`
2. **Cliquez sur l'icône d'édition** (crayon/clipboard) à droite de la valeur `https://supfile-1.onrender.com`
3. **Remplacez** par : `https://supfile.fly.dev`
4. **Cliquez sur "Save"**
5. **Redéployez** : onglet "Deploys" → "Trigger deploy" → "Deploy site"

---

## 🚀 Redéployer le Site

**Après avoir modifié la variable**, vous devez redéployer :

1. **Retournez à la page principale** de votre site
2. **Cliquez sur l'onglet "Deploys"**
3. **Cliquez sur "Trigger deploy"** (en haut à droite)
4. **Cliquez sur "Deploy site"**
5. **Attendez** que le statut passe à "Published" (1-3 minutes)

---

## ✅ Vérification Finale

**Après le redéploiement** :

1. **Vérifiez** que la variable `VITE_API_URL` a bien la valeur `https://supfile.fly.dev`
2. **Ouvrez votre site Netlify** dans le navigateur
3. **Ouvrez la console** (F12 → onglet "Network")
4. **Vérifiez** que les requêtes API vont vers `https://supfile.fly.dev`

---

## 📋 Checklist

- [ ] Variable `VITE_API_URL` trouvée dans le tableau
- [ ] Cliqué sur l'icône d'édition (crayon/clipboard)
- [ ] Ancienne valeur supprimée : `https://supfile-1.onrender.com`
- [ ] Nouvelle valeur ajoutée : `https://supfile.fly.dev`
- [ ] Cliqué sur "Save"
- [ ] Vérifié que toutes les valeurs sont maintenant `https://supfile.fly.dev`
- [ ] Redéployé le site (Deploys → Trigger deploy)
- [ ] Déploiement terminé avec succès

---

## 🎯 URL Exacte à Utiliser

```
https://supfile.fly.dev
```

⚠️ **Important** : Pas de slash `/` à la fin, pas d'espace, exactement comme écrit ci-dessus.

---

C'est tout ! Modifiez la variable existante et redéployez ! 🚀
