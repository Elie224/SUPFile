-- ============================================================
-- SUPFILE DATABASE SCHEMA
-- PostgreSQL 16+
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- Stockage des utilisateurs et leurs informations
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  
  -- OAuth2 fields
  oauth_provider VARCHAR(50),          -- 'google', 'github', 'microsoft', etc.
  oauth_id VARCHAR(255),               -- ID from OAuth provider
  
  -- User profile
  display_name VARCHAR(255),
  avatar_url TEXT,
  
  -- Storage quota (30 GB per user)
  quota_limit BIGINT DEFAULT 32212254720,    -- 30 GB in bytes
  quota_used BIGINT DEFAULT 0,               -- Current usage
  
  -- User preferences (stored as JSONB)
  preferences JSONB DEFAULT '{
    "theme": "light",
    "language": "en",
    "notifications_enabled": true
  }',
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- Indices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);

-- ============================================================
-- TABLE: folders
-- Arborescence des dossiers des utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS folders (
  id SERIAL PRIMARY KEY,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tree structure (auto-référence pour imbrication)
  parent_id INT REFERENCES folders(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX idx_folders_owner ON folders(owner_id);
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_folders_owner_parent ON folders(owner_id, parent_id);

-- ============================================================
-- TABLE: files
-- Métadonnées des fichiers stockés
-- ============================================================
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size BIGINT NOT NULL,
  
  -- Location
  folder_id INT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Physical storage path
  file_path TEXT NOT NULL UNIQUE,        -- /uploads/user_123/file_uuid.ext
  
  -- Metadata
  is_deleted BOOLEAN DEFAULT FALSE,      -- Soft delete for trash
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX idx_files_folder ON files(folder_id);
CREATE INDEX idx_files_owner ON files(owner_id);
CREATE INDEX idx_files_path ON files(file_path);
CREATE INDEX idx_files_deleted ON files(is_deleted);

-- ============================================================
-- TABLE: shares
-- Partages publics et internes
-- ============================================================
CREATE TABLE IF NOT EXISTS shares (
  id SERIAL PRIMARY KEY,
  
  -- What is being shared
  file_id INT REFERENCES files(id) ON DELETE CASCADE,
  folder_id INT REFERENCES folders(id) ON DELETE CASCADE,
  
  -- Who shared it
  created_by_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Share type and access
  share_type VARCHAR(20) NOT NULL,       -- 'public' ou 'internal'
  
  -- Public link token
  public_token VARCHAR(255) UNIQUE,      -- Random token for public access
  
  -- Security
  requires_password BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),            -- bcrypt hash if protected
  
  -- Expiration
  expires_at TIMESTAMP,                  -- NULL = never expires
  
  -- Internal share (shared with specific user)
  shared_with_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  access_count INT DEFAULT 0,            -- Track downloads
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX idx_shares_public_token ON shares(public_token);
CREATE INDEX idx_shares_file ON shares(file_id);
CREATE INDEX idx_shares_folder ON shares(folder_id);
CREATE INDEX idx_shares_created_by ON shares(created_by_id);
CREATE INDEX idx_shares_shared_with ON shares(shared_with_user_id);
CREATE INDEX idx_shares_expires ON shares(expires_at);

-- ============================================================
-- TABLE: sessions (OPTIONAL)
-- Pour logout forcé ou révocation de tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Device info (optionnel)
  user_agent TEXT,
  ip_address VARCHAR(45),
  device_name VARCHAR(255),
  
  -- Status
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- Indices
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token);

-- ============================================================
-- TABLE: audit_logs (OPTIONAL - pour sécurité)
-- Audit trail des actions sensibles
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,          -- 'upload', 'delete', 'share', 'login', etc.
  
  -- Ressource
  resource_type VARCHAR(50),            -- 'file', 'folder', 'share'
  resource_id INT,
  
  -- Details
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on users
CREATE TRIGGER trigger_users_updated
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger on folders
CREATE TRIGGER trigger_folders_updated
BEFORE UPDATE ON folders
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger on files
CREATE TRIGGER trigger_files_updated
BEFORE UPDATE ON files
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger on shares
CREATE TRIGGER trigger_shares_updated
BEFORE UPDATE ON shares
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- INITIAL DATA (optionnel)
-- ============================================================

-- Aucune donnée initiale - les utilisateurs s'inscrivent

-- ============================================================
-- VIEWS (optionnel - pour faciliter les queries)
-- ============================================================

-- Vue : Espace utilisé par utilisateur
CREATE OR REPLACE VIEW user_storage_summary AS
SELECT 
  u.id,
  u.email,
  u.quota_limit,
  u.quota_used,
  ROUND(u.quota_used::numeric / u.quota_limit * 100, 2) as usage_percentage,
  (u.quota_limit - u.quota_used) as quota_available
FROM users u;

-- Vue : Fichiers actifs (pas supprimés)
CREATE OR REPLACE VIEW active_files AS
SELECT 
  f.*,
  fo.name as folder_name,
  u.email as owner_email
FROM files f
JOIN folders fo ON f.folder_id = fo.id
JOIN users u ON f.owner_id = u.id
WHERE f.is_deleted = FALSE;

-- ============================================================
-- COMMENTS (optionnel mais recommandé)
-- ============================================================

COMMENT ON TABLE users IS 'Utilisateurs inscrits et leurs profils';
COMMENT ON TABLE folders IS 'Arborescence des dossiers - support imbrication infinie';
COMMENT ON TABLE files IS 'Métadonnées des fichiers - pointeurs vers volume Docker';
COMMENT ON TABLE shares IS 'Partages publics et internes';
COMMENT ON COLUMN users.quota_limit IS '30 GB par défaut (32212254720 bytes)';
COMMENT ON COLUMN files.file_path IS 'Chemin relatif: /uploads/user_id/uuid.ext';
COMMENT ON COLUMN shares.public_token IS 'Token aléatoire pour accès public - URL: /s/{token}';
