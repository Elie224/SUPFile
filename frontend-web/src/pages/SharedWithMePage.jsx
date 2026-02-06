import React, { useEffect, useState } from 'react';
import { shareService } from '../services/api';
import { useNavigate } from 'react-router-dom';

function SharedWithMePage() {
  const [sharedItems, setSharedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    shareService.getInternalShares()
      .then(res => {
        setSharedItems(res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Erreur lors du chargement des partages.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;

  return (
    <div style={{padding: 24}}>
      <h2>Partagés avec moi</h2>
      {sharedItems.length === 0 ? (
        <div>Aucun fichier ou dossier partagé avec vous.</div>
      ) : (
        <table style={{width:'100%', borderCollapse:'collapse', marginTop:16}}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Partagé par</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sharedItems.map((item, idx) => (
              <tr key={item._id || idx} style={{borderBottom:'1px solid #eee'}}>
                <td>{item.file_id?.name || item.folder_id?.name || 'Inconnu'}</td>
                <td>{item.file_id ? 'Fichier' : 'Dossier'}</td>
                <td>{item.created_by_id?.email || item.created_by_id?.username || 'Utilisateur inconnu'}</td>
                <td>
                  {item.file_id && (
                    <button onClick={() => navigate(`/preview/${item.file_id._id || item.file_id}`)}>
                      Ouvrir
                    </button>
                  )}
                  {item.folder_id && (
                    <button onClick={() => navigate(`/folder/${item.folder_id._id || item.folder_id}`)}>
                      Ouvrir dossier
                    </button>
                  )}
                  {item.file_id && (
                    <a href={`/api/files/${item.file_id._id || item.file_id}/download`} target="_blank" rel="noopener noreferrer">
                      Télécharger
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SharedWithMePage;
