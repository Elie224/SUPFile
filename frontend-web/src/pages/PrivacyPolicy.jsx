import React from 'react';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  const updatedAt = '2026-02-04';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="container" style={{ flex: 1, maxWidth: '900px', padding: '24px 16px' }}>
        <h1 className="h3 mb-3">Politique de confidentialité</h1>
        <p className="text-muted" style={{ fontSize: '14px' }}>Dernière mise à jour : {updatedAt}</p>

        <p>
          Cette politique de confidentialité décrit comment SUPFile collecte, utilise et protège vos données
          lorsque vous utilisez l’application web, l’application mobile et l’API.
        </p>

        <p>
          Conformément au RGPD (Règlement (UE) 2016/679) et à la loi « Informatique et Libertés », SUPFile
          s’engage à traiter vos données personnelles de manière licite, loyale et transparente.
        </p>

        <h2 className="h5 mt-4">1. Données collectées</h2>
        <ul>
          <li><strong>Données de compte</strong> : e-mail, nom d’affichage, avatar (si fourni).</li>
          <li><strong>Données de sécurité</strong> : informations liées à l’authentification (sessions, 2FA si activée).</li>
          <li><strong>Données de contenu</strong> : fichiers et dossiers que vous stockez, ainsi que leurs métadonnées.</li>
          <li><strong>Données techniques</strong> : journaux techniques (erreurs, événements de sécurité, IP) pour la protection et le diagnostic.</li>
        </ul>

        <h2 className="h5 mt-4">2. Finalités</h2>
        <ul>
          <li>Fournir le service de stockage et de partage.</li>
          <li>Sécuriser les comptes (prévention de la fraude, détection d’abus, limitation de débit).</li>
          <li>Améliorer la fiabilité (diagnostic d’erreurs, performance).</li>
        </ul>

        <h2 className="h5 mt-4">3. Base légale (résumé)</h2>
        <ul>
          <li><strong>Exécution du contrat</strong> : création de compte, stockage, partage.</li>
          <li><strong>Intérêt légitime</strong> : sécurité, prévention des abus, maintenance.</li>
          <li><strong>Consentement</strong> : uniquement si une fonctionnalité l’exige explicitement (le cas échéant).</li>
        </ul>

        <h2 className="h5 mt-4">4. Partage des données</h2>
        <p>
          Vos données ne sont pas vendues. Elles peuvent être traitées par des prestataires techniques nécessaires
          au fonctionnement (hébergement, stockage, e-mails), dans la limite de ce qui est requis.
        </p>

        <p>
          Les prestataires d’hébergement incluent notamment Fly.io (backend/API) et Netlify (frontend web).
        </p>

        <h2 className="h5 mt-4">5. Conservation</h2>
        <ul>
          <li>Données de compte : tant que le compte est actif, puis selon les obligations légales.</li>
          <li>Fichiers : tant qu’ils sont stockés par l’utilisateur, puis suppression selon les règles de corbeille/suppression définitive.</li>
          <li>Journaux de sécurité : durée limitée et proportionnée aux besoins de sécurité et de conformité.</li>
        </ul>

        <h2 className="h5 mt-4">6. Sécurité</h2>
        <p>
          Nous mettons en place des mesures de sécurité (contrôles d’accès, jetons d’authentification,
          limitation de débit, etc.). Aucune mesure n’offre une sécurité absolue : veillez à utiliser un mot de passe
          robuste et à activer la 2FA si disponible.
        </p>

        <h2 className="h5 mt-4">7. Vos droits</h2>
        <p>
          Selon votre législation, vous pouvez disposer de droits (accès, rectification, suppression, opposition,
          limitation, portabilité). Vous pouvez gérer une partie de ces informations depuis la page Paramètres.
        </p>

        <p>
          Si vous estimez, après nous avoir sollicités via les moyens disponibles dans l’application, que vos droits
          ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL :
          {' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">https://www.cnil.fr</a>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
