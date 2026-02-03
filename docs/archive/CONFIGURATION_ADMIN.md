# Configuration de l'Administrateur

## Définir l'admin principal comme administrateur

### Méthode 1 : Via MongoDB directement

1. Connectez-vous à MongoDB Atlas ou votre instance MongoDB locale
2. Exécutez la commande suivante :

```javascript
db.users.updateOne(
  { email: "<SUPER_ADMIN_EMAIL>" },
  { $set: { is_admin: true } }
)
```

### Méthode 2 : Via le script Node.js

1. Assurez-vous que MongoDB est connecté et que l'utilisateur existe
2. Exécutez le script :

```bash
node backend/scripts/setAdmin.js
```

Le script vérifiera que l'utilisateur existe et le définira comme administrateur.

## Fonctionnalités de la page Administration

Une fois connecté avec un compte administrateur, vous aurez accès à :

### 1. Statistiques générales
- Nombre total d'utilisateurs (actifs/inactifs)
- Nombre total de fichiers
- Nombre total de dossiers
- Stockage total utilisé

### 2. Gestion des utilisateurs
- Liste de tous les utilisateurs avec pagination
- Recherche par email ou nom d'affichage
- Modification des utilisateurs :
  - Nom d'affichage
  - Quota de stockage (en GB)
  - Statut actif/inactif
  - Droits administrateur
- Suppression d'utilisateurs

### 3. Accès
- La page Administration est accessible via le menu de navigation (visible uniquement pour les admins)
- Route : `/admin`
- Protection : Seuls les utilisateurs avec `is_admin: true` peuvent y accéder

## Routes API Admin

Toutes les routes admin nécessitent :
- Authentification JWT valide
- Droits administrateur (`is_admin: true`)

### Routes disponibles :
- `GET /api/admin/stats` - Statistiques générales
- `GET /api/admin/users` - Liste des utilisateurs (avec pagination et recherche)
- `GET /api/admin/users/:id` - Détails d'un utilisateur
- `PUT /api/admin/users/:id` - Modifier un utilisateur
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur

## Sécurité

- Le middleware `adminMiddleware` vérifie que l'utilisateur est admin avant d'accéder aux routes
- Les utilisateurs ne peuvent pas supprimer leur propre compte
- Toutes les routes sont protégées par authentification JWT


