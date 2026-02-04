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
          SUPFile
          <br />
          (À personnaliser : raison sociale / nom, adresse, e-mail.)
        </p>

        <h2 className="h5 mt-4">Hébergement</h2>
        <p>
          (À personnaliser : fournisseur d’hébergement, adresse.)
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
          Pour plus d’informations sur le traitement des données, consultez la page « Politique de
          confidentialité ».
        </p>

        <h2 className="h5 mt-4">Contact</h2>
        <p>
          (À personnaliser : e-mail de contact/support.)
        </p>
      </main>
      <Footer />
    </div>
  );
}
