# Guide de dépannage - SUPFile

## Problème : Erreur 500 lors de l'inscription

### Causes possibles et solutions

#### 1. Problème de connexion MongoDB

**Symptômes :** Erreur 500, logs montrent "MongoDB connection error"

**Solution :**
```powershell
# Vérifier que MongoDB est démarré
docker compose ps | Select-String "db"

# Redémarrer MongoDB
docker compose restart db

# Vérifier les logs MongoDB
docker compose logs db --tail 50
```

#### 2. Problème de validation des données

**Symptômes :** Erreur 500, mais MongoDB fonctionne

**Solution :**
- Vérifier que le mot de passe respecte les critères :
  - Minimum 8 caractères
  - Au moins une majuscule
  - Au moins un chiffre
- Vérifier que l'email est valide

#### 3. Problème de conversion ObjectId

**Symptômes :** Erreur lors de la création du dossier racine

**Solution :** Déjà corrigé dans le code. Redémarrer le backend :
```powershell
docker compose restart backend
```

#### 4. Vérifier les logs détaillés

```powershell
# Voir les logs en temps réel
docker compose logs -f backend

# Voir les dernières erreurs
docker compose logs backend --tail 100 | Select-String -Pattern "error|Error|ERROR" -Context 5
```

### Test de l'API d'inscription

Testez avec curl ou Postman :

```powershell
# Test d'inscription
$body = @{
    email = "test@example.com"
    password = "Test1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/signup" -Method Post -Body $body -ContentType "application/json"
```

### Vérifications à faire

1. **Backend démarré ?**
   ```powershell
   curl http://localhost:5000/health
   ```
   Devrait retourner : `{"status":"OK","message":"SUPFile API is running"}`

2. **MongoDB accessible ?**
   ```powershell
   docker compose exec db mongosh --eval "db.adminCommand('ping')"
   ```

3. **Variables d'environnement correctes ?**
   ```powershell
   docker compose exec backend env | Select-String "MONGO_URI|JWT_SECRET"
   ```

### Réinitialisation complète (si nécessaire)

```powershell
# Arrêter tous les services
docker compose down

# Supprimer les volumes (ATTENTION : supprime les données)
docker compose down -v

# Rebuild et redémarrer
docker compose build --no-cache
docker compose up -d
```

### Erreurs courantes

#### "MongoDB connection string not found"
- Vérifier que le fichier `.env` existe à la racine
- Vérifier que `MONGO_URI` ou les variables MongoDB sont définies

#### "JWT_SECRET is required"
- Vérifier que `JWT_SECRET` et `JWT_REFRESH_SECRET` sont définis dans `.env`

#### "Port 5000 already in use"
- Arrêter le processus qui utilise le port 5000
- Ou changer le port dans `docker-compose.yml`







