import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { API_URL } from '../config';
import { useToast } from '../components/Toast';

export default function Admin() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ display_name: '', quota_limit: '', is_active: true, is_admin: false });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est admin
    if (!user || !user.is_admin) {
      navigate('/dashboard');
      return;
    }
    loadStats();
    loadUsers();
  }, [user, navigate]);

  useEffect(() => {
    if (searchQuery) {
      const timeout = setTimeout(() => {
        loadUsers(1);
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      loadUsers(1);
    }
  }, [searchQuery]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadUsers = async (page = pagination.page) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const data = await response.json();
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      console.error('Failed to load users:', err);
      showMessage('error', 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      display_name: user.display_name || '',
      quota_limit: (user.quota_limit / (1024 * 1024 * 1024)).toFixed(2), // Convertir en GB
      is_active: user.is_active,
      is_admin: user.is_admin || false
    });
  };

  const handleUpdateUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const quotaLimitBytes = Math.round(parseFloat(editForm.quota_limit) * 1024 * 1024 * 1024);

      const response = await fetch(`${API_URL}/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          display_name: editForm.display_name,
          quota_limit: quotaLimitBytes,
          is_active: editForm.is_active,
          is_admin: editForm.is_admin
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erreur lors de la mise à jour');
      }

      showMessage('success', 'Utilisateur mis à jour avec succès');
      setSelectedUser(null);
      loadUsers();
      loadStats();
    } catch (err) {
      showMessage('error', err.message);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
  };

  const handleDeleteUser = async (blockEmail) => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ blockEmail: !!blockEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur lors de la suppression');
      }

      showMessage('success', data.data?.message || 'Utilisateur supprimé.');
      setUserToDelete(null);
      loadUsers();
      loadStats();
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <div className="page-container" style={{ padding: 'clamp(12px, 3vw, 24px)', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ 
        fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
        marginBottom: 'clamp(16px, 3vw, 24px)',
        fontWeight: '700',
        color: 'var(--text-color)'
      }}>⚙️ Administration</h1>

      {message.text && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '24px',
          backgroundColor: 'var(--bg-secondary)',
          color: message.type === 'error' ? '#fca5a5' : '#bbf7d0',
          borderRadius: '8px',
          border: `1px solid ${message.type === 'error' ? '#b91c1c' : '#15803d'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Statistiques */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'clamp(12px, 2vw, 20px)',
          marginBottom: 'clamp(20px, 3vw, 32px)'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: 'var(--bg-color)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Utilisateurs totaux</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#2196F3' }}>{stats.users.total}</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {stats.users.active} actifs, {stats.users.inactive} inactifs
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: 'var(--bg-color)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Fichiers</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#4CAF50' }}>{stats.files.total}</div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: 'var(--bg-color)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Dossiers</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#FF9800' }}>{stats.folders.total}</div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: 'var(--bg-color)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Stockage utilisé</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#9C27B0' }}>{formatBytes(stats.storage.total_used)}</div>
          </div>
        </div>
      )}

      {/* Liste des utilisateurs */}
      <div style={{
        backgroundColor: 'var(--bg-color)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid var(--border-color)',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>Gestion des utilisateurs</h2>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '250px',
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-color)'
            }}
          />
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun utilisateur trouvé</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-color)' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-color)' }}>Nom</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-color)' }}>Stockage</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-color)' }}>Statut</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-color)' }}>Admin</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-color)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr 
                      key={u.id}
                      style={{
                        borderBottom: index < users.length - 1 ? '1px solid var(--border-color)' : 'none',
                        backgroundColor: 'var(--bg-color)'
                      }}
                    >
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-color)' }}>{u.email}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>{u.display_name || '-'}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {formatBytes(u.quota_used)} / {formatBytes(u.quota_limit)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: u.is_active ? '#e8f5e9' : '#ffebee',
                          color: u.is_active ? '#2e7d32' : '#c62828'
                        }}>
                          {u.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {u.is_admin && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#e3f2fd',
                            color: '#1976D2'
                          }}>
                            Admin
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEditUser(u)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteClick(u)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                <button
                  onClick={() => loadUsers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: pagination.page === 1 ? '#f5f5f5' : '#2196F3',
                    color: pagination.page === 1 ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Précédent
                </button>
                <span style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>
                  Page {pagination.page} sur {pagination.pages}
                </span>
                <button
                  onClick={() => loadUsers(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: pagination.page === pagination.pages ? '#f5f5f5' : '#2196F3',
                    color: pagination.page === pagination.pages ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal d'édition */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-color)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: '600', color: 'var(--text-color)' }}>
              Modifier {selectedUser.email}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)' }}>Nom d'affichage</label>
              <input
                type="text"
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                style={{
                  padding: '10px',
                  width: '100%',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)' }}>Quota limite (GB)</label>
              <input
                type="number"
                step="0.1"
                value={editForm.quota_limit}
                onChange={(e) => setEditForm({ ...editForm, quota_limit: e.target.value })}
                style={{
                  padding: '10px',
                  width: '100%',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                />
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Compte actif</span>
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editForm.is_admin}
                  onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.checked })}
                />
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Administrateur</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateUser}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression définitive */}
      {userToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-color)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '480px',
            width: '100%',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: 'var(--text-color)' }}>
              Supprimer cet utilisateur ?
            </h3>
            <p style={{ marginBottom: '20px', color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '14px' }}>
              L&apos;utilisateur <strong style={{ color: 'var(--text-color)' }}>{userToDelete.email}</strong> sera supprimé de toute l&apos;application (compte, fichiers, dossiers, sessions).
            </p>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Choisissez une option :
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <button
                onClick={() => handleDeleteUser(false)}
                disabled={deleteLoading}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  textAlign: 'left',
                  fontSize: '14px'
                }}
              >
                <span style={{ display: 'block', marginBottom: '4px' }}>Supprimer sans bloquer</span>
                <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.9 }}>L&apos;utilisateur pourra recréer un compte avec cette adresse</span>
              </button>
              <button
                onClick={() => handleDeleteUser(true)}
                disabled={deleteLoading}
                style={{
                  padding: '12px 16px',
                  backgroundColor: deleteLoading ? '#666' : 'rgba(239, 68, 68, 0.15)',
                  color: deleteLoading ? '#999' : '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  textAlign: 'left',
                  fontSize: '14px'
                }}
              >
                <span style={{ display: 'block', marginBottom: '4px' }}>Supprimer et bloquer l&apos;email</span>
                <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.9 }}>Cette adresse ne pourra plus créer de compte</span>
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleteLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


