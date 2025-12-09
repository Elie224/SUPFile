# SUPFile - Configuration de démarrage rapide

Bienvenue dans le projet SUPFile !

## 🚀 Démarrage rapide (1 minute)

### Option 1 : Avec Docker (RECOMMANDÉ)

```bash
# 1. Copier la configuration d'environnement
cp .env.example .env

# 2. Lancer tous les services
docker compose up -d

# 3. Attendre que tout démarre (~30 secondes)
docker compose logs -f

# 4. Accéder à l'application
# Frontend Web  : http://localhost:3000
# API Backend   : http://localhost:5000/health
# Mobile (Expo) : http://localhost:19000
```

### Option 2 : En local (development)

**Backend :**
```bash
cd backend
npm install
npm run dev
# Serveur sur http://localhost:5000
```

**Frontend Web (nouveau terminal) :**
```bash
cd frontend-web
npm install
npm run dev
# Sur http://localhost:3000
```

**Mobile (nouveau terminal) :**
```bash
cd mobile-app
npm install
npm start
# Expo sur http://localhost:19000
```

---

## 📖 Documentation importante

👉 **LIRE EN PRIORITÉ :**
- `README.md` - Vue d'ensemble complète
- `docs/ARCHITECTURE.md` - Architecture détaillée
- `.env.example` - Tous les paramètres de config

---

## ⚙️ Configuration requise

### Fichier `.env` (À créer)

```bash
cp .env.example .env
# Puis éditer .env et changer les secrets !
```

**Variables critiques :**
- `POSTGRES_PASSWORD` - Mot de passe BDD (changez-le !)
- `JWT_SECRET` - Clé JWT (changez-le !)
- `JWT_REFRESH_SECRET` - Refresh token (changez-le !)

---

## ✅ Vérifications

### Après `docker compose up` :

```bash
# 1. Vérifier les services
docker compose ps

# 2. Tester l'API
curl http://localhost:5000/health

# 3. Tester la BDD
docker exec supfile-db psql -U supfile_user -d supfile -c "SELECT version();"

# 4. Vérifier logs
docker compose logs -f
```

---

## 📁 Structure des dossiers clés

```
backend/
  ├─ app.js              ← Point d'entrée serveur
  ├─ config.js           ← Configuration (env vars)
  ├─ routes/             ← Routes API à implémenter
  ├─ controllers/        ← Logique métier
  ├─ models/             ← Modèles BDD
  ├─ middlewares/        ← Auth, validation
  ├─ utils/              ← Helper functions
  ├─ migrations/         ← Schéma SQL
  └─ uploads/            ← Fichiers stockés (volume Docker)

frontend-web/
  └─ src/
     ├─ components/      ← Composants réutilisables
     ├─ pages/           ← Pages principales
     └─ services/        ← Appels API

mobile-app/
  └─ src/
     ├─ screens/         ← Écrans d'app
     ├─ components/      ← Composants
     └─ services/        ← Appels API
```

---

## 🔧 Commandes utiles

```bash
# Docker
docker compose up -d              # Démarrer tout
docker compose down               # Arrêter tout
docker compose logs -f            # Afficher les logs
docker compose ps                 # Voir les services
docker compose down -v            # Tout arrêter + supprimer données

# Backend (local dev)
npm run dev                       # Mode développement (nodemon)
npm start                        # Mode production
npm test                         # Tests

# Frontend Web (local dev)
npm run dev                      # Dev server
npm run build                    # Build prod
npm run preview                  # Aperçu build

# Mobile (local dev)
npm start                        # Expo CLI
npm run android                  # Build Android
npm run ios                      # Build iOS
```

---

## 🗄️ Base de données

### Initialiser le schéma (première fois)

Le schéma est créé automatiquement par le backend au démarrage (cf. `backend/migrations/`).

Ou manuellement :
```bash
docker exec supfile-db psql -U supfile_user -d supfile < backend/migrations/001_initial_schema.sql
```

### Accéder à la BDD

```bash
# Via psql
docker exec -it supfile-db psql -U supfile_user -d supfile

# Commandes utiles :
\dt                    # Lister les tables
SELECT * FROM users;   # Voir les utilisateurs
\q                     # Quitter
```

---

## 🔐 Sécurité

### IMPORTANT - Ne jamais commiter :

❌ `.env` (variables d'environnement)  
❌ Clés API (OAuth)  
❌ Mots de passe BDD  
❌ Tokens secrets  

✅ `.env.example` (template SANS valeurs)

### Vérification rapide

```bash
# Vérifier qu'aucun secret n'est en git
git diff HEAD backend/config.js
git diff HEAD .env
```

---

## 📝 Workflow Git

```bash
# Voir l'historique
git log --oneline

# Créer une branche feature
git checkout -b feature/mon-fonctionnalite

# Committer
git add .
git commit -m "feat: description courte"

# Merger
git checkout main
git merge feature/mon-fonctionnalite
```

---

## 🐛 Troubleshooting

### "Port 5000 déjà utilisé"
```bash
# Voir quel processus utilise le port
lsof -i :5000
# Ou sur Windows :
netstat -ano | findstr :5000
```

### "BDD ne démarre pas"
```bash
docker logs supfile-db
docker compose down -v  # Reset
docker compose up -d    # Relancer
```

### "Frontend ne charge pas"
```bash
docker compose logs frontend
# Vérifier VITE_API_URL dans .env
```

---

## 📚 Prochaines étapes

1. ✅ Lancer avec `docker compose up -d`
2. ✅ Vérifier que les services démarrent
3. ✅ Lire `docs/ARCHITECTURE.md`
4. ✅ Implémenter les routes d'authentification
5. ✅ Créer les contrôleurs (upload, fichiers)
6. ✅ Développer l'UI web
7. ✅ Porter sur mobile

---

## 📧 Questions?

Consulter la documentation complète dans `docs/`
