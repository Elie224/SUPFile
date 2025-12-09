# Schéma de Base de Données - SUPFile

## Vue d'ensemble

La base de données PostgreSQL stocke toutes les métadonnées de l'application :
- Utilisateurs et authentification
- Arborescence des dossiers
- Métadonnées des fichiers
- Informations de partage

Les fichiers eux-mêmes sont stockés dans un volume Docker, pas en BDD.

---

## Tables détaillées

### 1. `users`

Stockage des utilisateurs et leurs informations.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  
  -- OAuth2
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  
  -- Profil
  display_name VARCHAR(255),
  avatar_url TEXT,
  
  -- Stockage
  quota_limit BIGINT DEFAULT 32212254720,  -- 30 GB
  quota_used BIGINT DEFAULT 0,
  
  -- Préférences
  preferences JSONB DEFAULT '{"theme": "light", ...}',
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);
```

**Indices** :
- `email` (UNIQUE) - Recherche par email
- `oauth_provider, oauth_id` - Lookup OAuth

**Exemples de requêtes** :
```sql
-- Création utilisateur
INSERT INTO users (email, password_hash, created_at, updated_at)
VALUES ('user@example.com', '$2b$10$...', NOW(), NOW());

-- Récupérer utilisateur
SELECT * FROM users WHERE email = 'user@example.com';

-- Mettre à jour quota
UPDATE users SET quota_used = quota_used + 1000 WHERE id = 1;

-- Utilisateurs proches de leur limite
SELECT * FROM users WHERE quota_used > (quota_limit * 0.9);
```

---

### 2. `folders`

Arborescence des dossiers (support imbrication infinie).

```sql
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Auto-référence pour imbrication
  parent_id INT REFERENCES folders(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indices** :
- `owner_id` - Tous les dossiers d'un utilisateur
- `parent_id` - Dossiers enfants
- `(owner_id, parent_id)` - Dossiers racine d'un user

**Exemples de requêtes** :
```sql
-- Créer dossier racine
INSERT INTO folders (name, owner_id, parent_id)
VALUES ('Documents', 1, NULL);

-- Créer sous-dossier
INSERT INTO folders (name, owner_id, parent_id)
VALUES ('2024', 1, 42);

-- Récupérer tous les enfants d'un dossier
SELECT * FROM folders WHERE parent_id = 42 ORDER BY name;

-- Récupérer le chemin complet d'un dossier (breadcrumb)
WITH RECURSIVE path AS (
  SELECT id, name, parent_id, 1 as level FROM folders WHERE id = 42
  UNION ALL
  SELECT f.id, f.name, f.parent_id, path.level + 1
  FROM folders f JOIN path ON f.id = path.parent_id
)
SELECT * FROM path ORDER BY level DESC;

-- Supprimer un dossier et son contenu (cascade)
DELETE FROM folders WHERE id = 42;
```

---

### 3. `files`

Métadonnées des fichiers stockés.

```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  
  name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size BIGINT NOT NULL,
  
  folder_id INT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Chemin physique dans le volume Docker
  file_path TEXT NOT NULL UNIQUE,
  
  -- Soft delete (corbeille)
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indices** :
- `folder_id` - Fichiers par dossier
- `owner_id` - Fichiers par utilisateur
- `file_path` (UNIQUE) - Éviter duplicatas
- `is_deleted` - Requêtes sur la corbeille

**Exemples de requêtes** :
```sql
-- Uploader un fichier
INSERT INTO files (name, mime_type, size, folder_id, owner_id, file_path)
VALUES ('photo.jpg', 'image/jpeg', 2048000, 42, 1, '/uploads/user_1/uuid-123.jpg');

-- Lister fichiers actifs d'un dossier
SELECT * FROM files 
WHERE folder_id = 42 AND is_deleted = FALSE
ORDER BY created_at DESC;

-- Trouver tous les fichiers d'un utilisateur
SELECT * FROM files WHERE owner_id = 1 AND is_deleted = FALSE;

-- Récupérer taille totale utilisée
SELECT SUM(size) as total_used FROM files WHERE owner_id = 1 AND is_deleted = FALSE;

-- Fichiers en attente d'être purgés (soft delete > 30 jours)
SELECT * FROM files 
WHERE is_deleted = TRUE 
AND deleted_at < NOW() - INTERVAL '30 days';

-- Soft delete (mettre en corbeille)
UPDATE files SET is_deleted = TRUE, deleted_at = NOW() WHERE id = 123;

-- Restaurer depuis corbeille
UPDATE files SET is_deleted = FALSE, deleted_at = NULL WHERE id = 123;

-- Purger la corbeille
DELETE FROM files WHERE is_deleted = TRUE AND deleted_at < NOW() - INTERVAL '30 days';
```

---

### 4. `shares`

Partages publics et internes.

```sql
CREATE TABLE shares (
  id SERIAL PRIMARY KEY,
  
  file_id INT REFERENCES files(id) ON DELETE CASCADE,
  folder_id INT REFERENCES folders(id) ON DELETE CASCADE,
  
  created_by_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  share_type VARCHAR(20) NOT NULL,  -- 'public' ou 'internal'
  
  -- Public link token
  public_token VARCHAR(255) UNIQUE,
  
  -- Sécurité optionnelle
  requires_password BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  
  -- Expiration
  expires_at TIMESTAMP,
  
  -- Pour partages internes
  shared_with_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  access_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indices** :
- `public_token` (UNIQUE) - Accès par token
- `file_id, folder_id` - Partages par ressource
- `created_by_id` - Partages d'un utilisateur
- `shared_with_user_id` - Partages reçus
- `expires_at` - Requêtes sur expiration

**Exemples de requêtes** :
```sql
-- Créer lien public
INSERT INTO shares (file_id, created_by_id, share_type, public_token, access_count)
VALUES (123, 1, 'public', 'abc123xyz...', 0);

-- Créer lien public protégé par mot de passe
INSERT INTO shares (file_id, created_by_id, share_type, public_token, 
                   requires_password, password_hash, expires_at)
VALUES (123, 1, 'public', 'xyz789...', TRUE, '$2b$10$...', '2025-12-31 23:59:59');

-- Récupérer un lien public
SELECT * FROM shares WHERE public_token = 'abc123xyz...' AND is_active = TRUE;

-- Partage interne
INSERT INTO shares (folder_id, created_by_id, share_type, shared_with_user_id)
VALUES (42, 1, 'internal', 2);

-- Tous les partages d'un utilisateur
SELECT * FROM shares WHERE created_by_id = 1 ORDER BY created_at DESC;

-- Tous les dossiers partagés avec moi
SELECT f.*, s.created_by_id FROM folders f
JOIN shares s ON s.folder_id = f.id
WHERE s.share_type = 'internal' AND s.shared_with_user_id = 1;

-- Incrémenter le compteur d'accès
UPDATE shares SET access_count = access_count + 1 WHERE public_token = 'abc123xyz...';

-- Liens expirés
SELECT * FROM shares WHERE expires_at < NOW() AND is_active = TRUE;

-- Désactiver un lien
UPDATE shares SET is_active = FALSE WHERE id = 456;
```

---

### 5. `sessions` (optionnel)

Stockage des refresh tokens pour révocation.

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Device tracking (optionnel)
  user_agent TEXT,
  ip_address VARCHAR(45),
  device_name VARCHAR(255),
  
  -- Status
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);
```

**Indices** :
- `user_id` - Sessions d'un utilisateur
- `refresh_token` (UNIQUE) - Validation token

**Utilité** :
- Revoquer une session avant expiration du token
- Voir les appareils connectés d'un utilisateur
- Killer une session depuis un autre appareil

**Exemples** :
```sql
-- Créer session après login
INSERT INTO sessions (user_id, refresh_token, ip_address, expires_at)
VALUES (1, 'eyJ...', '192.168.1.1', NOW() + INTERVAL '7 days');

-- Revoquer une session
UPDATE sessions SET is_revoked = TRUE WHERE refresh_token = 'eyJ...';

-- Voir les appareils connectés
SELECT * FROM sessions WHERE user_id = 1 AND is_revoked = FALSE;

-- Nettoyer les sessions expirées
DELETE FROM sessions WHERE expires_at < NOW();
```

---

### 6. `audit_logs` (optionnel - Sécurité)

Journalisation des actions sensibles.

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  
  resource_type VARCHAR(50),
  resource_id INT,
  
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Actions tracées** :
- `login` - Connexion
- `logout` - Déconnexion
- `password_change` - Changement de mot de passe
- `file_upload` - Upload de fichier
- `file_delete` - Suppression de fichier
- `file_share` - Partage créé
- `oauth_login` - Connexion OAuth

**Exemples** :
```sql
-- Logger une connexion
INSERT INTO audit_logs (user_id, action, ip_address, user_agent, created_at)
VALUES (1, 'login', '192.168.1.1', 'Mozilla/5.0...', NOW());

-- Voir l'historique d'un utilisateur
SELECT * FROM audit_logs WHERE user_id = 1 ORDER BY created_at DESC LIMIT 50;

-- Voir toutes les suppression de fichiers
SELECT * FROM audit_logs WHERE action = 'file_delete' ORDER BY created_at DESC;

-- Potentielles tentatives de piratage (plusieurs logins échoués)
SELECT user_id, COUNT(*) FROM audit_logs 
WHERE action = 'login_failed' AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id HAVING COUNT(*) > 5;
```

---

## Vues SQL (optionnel mais utile)

### `user_storage_summary`

Espace utilisé par utilisateur en un coup d'œil.

```sql
CREATE VIEW user_storage_summary AS
SELECT 
  u.id,
  u.email,
  u.quota_limit,
  u.quota_used,
  ROUND(u.quota_used::numeric / u.quota_limit * 100, 2) as usage_percentage,
  (u.quota_limit - u.quota_used) as quota_available
FROM users u;

-- Utilisation
SELECT * FROM user_storage_summary WHERE usage_percentage > 90;
```

### `active_files`

Seulement les fichiers non supprimés avec métadonnées du dossier.

```sql
CREATE VIEW active_files AS
SELECT 
  f.*,
  fo.name as folder_name,
  u.email as owner_email
FROM files f
JOIN folders fo ON f.folder_id = fo.id
JOIN users u ON f.owner_id = u.id
WHERE f.is_deleted = FALSE;
```

---

## Optimisations

### Indices critiques (déjà présents)

```sql
-- Recherche utilisateur rapide
CREATE INDEX idx_users_email ON users(email);

-- Navigation dossiers rapide
CREATE INDEX idx_folders_owner ON folders(owner_id);
CREATE INDEX idx_folders_owner_parent ON folders(owner_id, parent_id);

-- Fichiers par dossier
CREATE INDEX idx_files_folder ON files(folder_id);

-- Partages publics
CREATE INDEX idx_shares_public_token ON shares(public_token);
```

### Partitioning (pour volumes très importants)

Pour des millions de fichiers, partitionner par `owner_id` :

```sql
CREATE TABLE files_part PARTITION BY LIST (owner_id);
CREATE TABLE files_part_1 PARTITION OF files_part FOR VALUES IN (1,2,3,...);
CREATE TABLE files_part_2 PARTITION OF files_part FOR VALUES IN (100,101,...);
-- etc.
```

---

## Tâches de maintenance

### Backup régulier

```bash
# Backup quotidien
docker exec supfile-db pg_dump -U supfile_user supfile | gzip > backup_$(date +%Y%m%d).sql.gz

# Restaurer depuis backup
gunzip < backup_20251209.sql.gz | docker exec -i supfile-db psql -U supfile_user supfile
```

### Purger la corbeille

```sql
-- Supprimer les fichiers dans la corbeille depuis plus de 30 jours
DELETE FROM files 
WHERE is_deleted = TRUE 
AND deleted_at < NOW() - INTERVAL '30 days';
```

### Vérifier intégrité

```sql
-- Fichiers orphelins (dossier supprimé mais fichier existe)
SELECT f.* FROM files f 
LEFT JOIN folders fo ON f.folder_id = fo.id
WHERE fo.id IS NULL AND f.is_deleted = FALSE;

-- Quotas incorrects
SELECT u.id, u.email, u.quota_used,
       (SELECT SUM(size) FROM files WHERE owner_id = u.id AND is_deleted = FALSE) as actual_used
FROM users u
WHERE u.quota_used != (SELECT SUM(size) FROM files WHERE owner_id = u.id AND is_deleted = FALSE);
```

---

## Bonnes pratiques

✅ **À faire** :
- Utiliser transactions pour opérations multiples
- Créer indices sur colonnes fréquemment filtrées
- Archiver audit_logs anciens mensuellement
- Backups automatiques quotidiens
- Vérifier quotas avant upload

❌ **À éviter** :
- Requêtes sans indices
- Charger tous les fichiers d'un utilisateur à la fois
- Stockage de fichiers en BDD
- Secrets en plaintext en BDD
- Cascades sans limite

---

Document créé : Décembre 2025
