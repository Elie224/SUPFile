# 📘 Guide d'Amélioration des Pages avec Bootstrap

## ✅ Pages déjà améliorées
- ✅ **Login** - Design Bootstrap complet
- ✅ **Signup** - Design Bootstrap complet

## 🎯 Pages à améliorer

### 1. Dashboard
**Localisation**: `src/pages/Dashboard.jsx`

**Améliorations à appliquer**:
- Remplacer les divs de statistiques par des `.card` Bootstrap
- Utiliser `.row` et `.col` pour le layout responsive
- Ajouter des icônes Bootstrap Icons
- Améliorer les barres de progression avec Bootstrap progress bars

**Exemple de conversion**:
```jsx
// Avant
<div style={{ padding: '20px', backgroundColor: '#ffffff', ... }}>
  <h2>Storage Space</h2>
  ...
</div>

// Après
<div className="card shadow-md mb-4">
  <div className="card-body">
    <h2 className="h4 mb-3">
      <i className="bi bi-hdd-stack me-2"></i>
      Storage Space
    </h2>
    ...
  </div>
</div>
```

### 2. Files
**Localisation**: `src/pages/Files.jsx`

**Améliorations à appliquer**:
- Utiliser `.table` Bootstrap pour la liste des fichiers
- Améliorer les boutons avec `.btn` Bootstrap
- Utiliser `.modal` Bootstrap pour les modals (share, delete, etc.)
- Ajouter des icônes pour les types de fichiers
- Améliorer le drag & drop avec des styles Bootstrap

**Exemple**:
```jsx
// Boutons
<button className="btn btn-primary btn-sm">
  <i className="bi bi-upload me-2"></i>
  Upload
</button>

// Table
<table className="table table-hover">
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

### 3. Settings
**Localisation**: `src/pages/Settings.jsx`

**Améliorations à appliquer**:
- Utiliser `.form-control` pour tous les inputs
- Utiliser `.form-label` pour les labels
- Utiliser `.card` pour organiser les sections
- Améliorer les switchs/toggles avec Bootstrap

### 4. Admin
**Localisation**: `src/pages/Admin.jsx`

**Améliorations à appliquer**:
- Utiliser `.table` Bootstrap responsive
- Utiliser `.modal` Bootstrap pour l'édition d'utilisateurs
- Améliorer les cartes de statistiques
- Utiliser `.alert` Bootstrap pour les messages

### 5. Search, Trash, Preview, Share
**Améliorations à appliquer**:
- Appliquer les mêmes principes que pour Files
- Utiliser `.card` pour les résultats
- Améliorer les formulaires avec Bootstrap

## 🔧 Classes Bootstrap à utiliser

### Layout
```jsx
<div className="container-fluid p-4">
  <div className="row">
    <div className="col-12 col-md-6 col-lg-4 mb-3">
      {/* Contenu */}
    </div>
  </div>
</div>
```

### Cartes
```jsx
<div className="card shadow-md mb-4">
  <div className="card-header">
    <h5 className="mb-0">Titre</h5>
  </div>
  <div className="card-body">
    Contenu
  </div>
</div>
```

### Boutons
```jsx
<button className="btn btn-primary">
  <i className="bi bi-check me-2"></i>
  Action
</button>
<button className="btn btn-secondary btn-sm">
  Annuler
</button>
```

### Formulaires
```jsx
<div className="mb-3">
  <label htmlFor="input" className="form-label">
    Label
  </label>
  <input 
    type="text" 
    id="input" 
    className="form-control"
    placeholder="Placeholder"
  />
</div>
```

### Alertes
```jsx
<div className="alert alert-success">
  <i className="bi bi-check-circle me-2"></i>
  Succès !
</div>

<div className="alert alert-danger">
  <i className="bi bi-exclamation-triangle me-2"></i>
  Erreur !
</div>
```

### Tables
```jsx
<table className="table table-hover">
  <thead>
    <tr>
      <th>Colonne 1</th>
      <th>Colonne 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Donnée 1</td>
      <td>Donnée 2</td>
    </tr>
  </tbody>
</table>
```

### Progress Bars
```jsx
<div className="progress" style={{ height: '28px' }}>
  <div 
    className="progress-bar" 
    role="progressbar" 
    style={{ width: '75%' }}
  >
    75%
  </div>
</div>
```

## 📱 Responsive avec Bootstrap

### Grille responsive
```jsx
{/* Mobile: 1 colonne, Tablet: 2 colonnes, Desktop: 4 colonnes */}
<div className="row">
  <div className="col-12 col-md-6 col-lg-3 mb-3">
    Carte 1
  </div>
  <div className="col-12 col-md-6 col-lg-3 mb-3">
    Carte 2
  </div>
</div>
```

### Navigation responsive
```jsx
<nav className="navbar navbar-expand-lg navbar-light">
  <button className="navbar-toggler" type="button">
    <span className="navbar-toggler-icon"></span>
  </button>
  <div className="collapse navbar-collapse">
    {/* Menu items */}
  </div>
</nav>
```

## 🎨 Icônes Bootstrap Icons

### Icônes courantes
- `bi-house` - Accueil
- `bi-folder` - Dossier
- `bi-file-earmark` - Fichier
- `bi-search` - Recherche
- `bi-gear` - Paramètres
- `bi-trash` - Corbeille
- `bi-upload` - Upload
- `bi-download` - Download
- `bi-share` - Partager
- `bi-person` - Utilisateur
- `bi-lock` - Verrouillé
- `bi-check-circle` - Succès
- `bi-exclamation-triangle` - Avertissement
- `bi-x-circle` - Erreur

### Utilisation
```jsx
<i className="bi bi-folder me-2"></i>
<i className="bi bi-upload"></i>
```

## 📝 Checklist d'amélioration

Pour chaque page :
- [ ] Remplacer les divs de conteneur par `.container-fluid` ou `.container`
- [ ] Convertir les cartes en `.card` Bootstrap
- [ ] Remplacer les boutons par `.btn` Bootstrap
- [ ] Utiliser `.form-control` pour les inputs
- [ ] Ajouter des icônes Bootstrap Icons
- [ ] Utiliser `.alert` pour les messages
- [ ] Améliorer les tables avec `.table` Bootstrap
- [ ] Vérifier le responsive (mobile, tablette, desktop)
- [ ] Tester les interactions (hover, focus, etc.)

## 💡 Bonnes Pratiques

1. **Mix styles inline et Bootstrap** : Les styles inline existants fonctionnent toujours
2. **Progression graduelle** : Vous pouvez améliorer une page à la fois
3. **Consistance** : Utiliser les mêmes classes Bootstrap partout
4. **Accessibilité** : Bootstrap inclut déjà les attributs ARIA nécessaires
5. **Performance** : Bootstrap est déjà chargé, pas de surcharge

## 🚀 Exemple complet : Dashboard Card

```jsx
<div className="card shadow-md mb-4 fade-in">
  <div className="card-header bg-primary text-white">
    <h5 className="mb-0">
      <i className="bi bi-hdd-stack me-2"></i>
      {t('storageSpace')}
    </h5>
  </div>
  <div className="card-body">
    <div className="d-flex justify-content-between mb-3">
      <span className="text-muted">
        <strong>{t('used')}:</strong> {formatBytes(stats.quota.used)}
      </span>
      <span className="text-muted">
        <strong>{t('available')}:</strong> {formatBytes(stats.quota.available)}
      </span>
    </div>
    <div className="progress" style={{ height: '28px' }}>
      <div 
        className="progress-bar bg-success" 
        role="progressbar" 
        style={{ width: `${stats.quota.percentage}%` }}
      >
        {stats.quota.percentage}%
      </div>
    </div>
    <small className="text-muted d-block text-center mt-2">
      {stats.quota.percentage}% {t('usedOf')} {formatBytes(stats.quota.limit)}
    </small>
  </div>
</div>
```

---

**Note** : Les pages existantes continuent de fonctionner. Les améliorations Bootstrap peuvent être appliquées progressivement.
