import React from 'react';
import Footer from '../components/Footer';

export default function LegalNotice() {
  const updatedAt = '2026-02-04';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="container" style={{ flex: 1, maxWidth: '900px', padding: '24px 16px' }}>
        <h1 className="h3 mb-3">Mentions légales</h1>
        <p className="text-muted" style={{ fontSize: '14px' }}>Dernière mise à jour : {updatedAt}</p>

        <h2 className="h5 mt-4">Éditeur du site</h2>
        <p>
          <strong>SUPFile</strong> – plateforme de stockage et de partage de fichiers.
        </p>

        <h2 className="h5 mt-4">Hébergement</h2>
        <p>
          <strong>Backend / API</strong> : Fly.io
          <br />
          <strong>Frontend (application web)</strong> : Netlify
          <br />
          Le service peut s’appuyer sur des prestataires tiers pour l’hébergement et l’envoi d’e-mails.
        </p>

        <h2 className="h5 mt-4">Propriété intellectuelle</h2>
        <p>
          Les éléments de l’application (marque, interface, textes) sont protégés. Toute reproduction non
          autorisée est interdite.
        </p>

        <h2 className="h5 mt-4">Données personnelles</h2>
        <p>
          Le traitement des données personnelles est réalisé conformément au RGPD et à la loi « Informatique et Libertés ».
          Pour plus d’informations, consultez la page « Politique de confidentialité ».
          Vous pouvez également déposer une réclamation auprès de la CNIL :
          {' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">https://www.cnil.fr</a>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
