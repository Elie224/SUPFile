import React from 'react';
import Footer from '../components/Footer';

export default function TermsOfUse() {
  const updatedAt = '2026-02-04';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="container" style={{ flex: 1, maxWidth: '900px', padding: '24px 16px' }}>
        <h1 className="h3 mb-3">Conditions d’utilisation</h1>
        <p className="text-muted" style={{ fontSize: '14px' }}>Dernière mise à jour : {updatedAt}</p>

        <h2 className="h5 mt-4">1. Objet</h2>
        <p>
          SUPFile est un service de stockage et de partage de fichiers. En utilisant le service, vous acceptez ces
          conditions.
        </p>

        <h2 className="h5 mt-4">2. Compte et sécurité</h2>
        <ul>
          <li>Vous êtes responsable de la confidentialité de vos identifiants.</li>
          <li>Vous devez fournir des informations exactes et à jour.</li>
          <li>En cas de suspicion d’accès non autorisé, modifiez votre mot de passe et sécurisez votre compte (ex : activer la 2FA si disponible).</li>
        </ul>

        <h2 className="h5 mt-4">3. Usage acceptable</h2>
        <ul>
          <li>Ne pas utiliser le service à des fins illégales.</li>
          <li>Ne pas tenter de contourner la sécurité, d’extraire des données d’autrui, ou de perturber le service.</li>
          <li>Respecter les droits d’auteur et les droits des tiers sur les contenus stockés/partagés.</li>
        </ul>

        <h2 className="h5 mt-4">4. Contenus et partage</h2>
        <ul>
          <li>Vous conservez la responsabilité des contenus que vous téléversez.</li>
          <li>Les liens de partage peuvent donner accès à des contenus : partagez-les de manière prudente.</li>
        </ul>

        <h2 className="h5 mt-4">5. Disponibilité</h2>
        <p>
          Le service est fourni « en l’état ». Des interruptions peuvent survenir (maintenance, incidents,
          limitations de l’hébergeur). Nous faisons au mieux pour rétablir le service.
        </p>

        <h2 className="h5 mt-4">6. Suspension / suppression</h2>
        <p>
          En cas d’abus, de violation des règles ou pour des raisons de sécurité, l’accès peut être restreint.
          Vous pouvez demander la suppression de votre compte selon les modalités prévues.
        </p>

        <h2 className="h5 mt-4">7. Modifications</h2>
        <p>
          Ces conditions peuvent évoluer. La date de mise à jour est indiquée en haut de page.
        </p>
      </main>
      <Footer />
    </div>
  );
}
