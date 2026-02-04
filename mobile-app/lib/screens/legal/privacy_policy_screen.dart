import 'package:flutter/material.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const updatedAt = '2026-02-04';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Politique de confidentialité'),
      ),
      body: const SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Politique de confidentialité',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 6),
              Text('Dernière mise à jour : ' + updatedAt),
              SizedBox(height: 16),
              Text(
                'Cette politique de confidentialité décrit comment SUPFile collecte, utilise et protège vos données '
                'lorsque vous utilisez l’application mobile, l’application web et l’API.',
              ),
              SizedBox(height: 16),
              Text('1. Données collectées',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                  '• Données de compte : e-mail, nom d’affichage, avatar (si fourni).'),
              Text(
                  '• Données de sécurité : informations liées à l’authentification (sessions, 2FA si activée).'),
              Text(
                  '• Données de contenu : fichiers et dossiers stockés, ainsi que leurs métadonnées.'),
              Text(
                  '• Données techniques : journaux techniques (erreurs, événements de sécurité, IP) pour protection et diagnostic.'),
              SizedBox(height: 16),
              Text('2. Finalités',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text('• Fournir le service de stockage et de partage.'),
              Text(
                  '• Sécuriser les comptes (prévention fraude, détection abus, limitation de débit).'),
              Text(
                  '• Améliorer la fiabilité (diagnostic d’erreurs, performance).'),
              SizedBox(height: 16),
              Text('3. Base légale (résumé)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                  '• Exécution du contrat : création de compte, stockage, partage.'),
              Text(
                  '• Intérêt légitime : sécurité, prévention des abus, maintenance.'),
              Text(
                  '• Consentement : uniquement si une fonctionnalité l’exige explicitement (le cas échéant).'),
              SizedBox(height: 16),
              Text('4. Partage des données',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                'Vos données ne sont pas vendues. Elles peuvent être traitées par des prestataires techniques nécessaires '
                'au fonctionnement (hébergement, stockage, e-mails), dans la limite de ce qui est requis.',
              ),
              SizedBox(height: 16),
              Text('5. Conservation',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                  '• Données de compte : tant que le compte est actif, puis selon les obligations légales.'),
              Text(
                  '• Fichiers : tant qu’ils sont stockés, puis selon les règles de corbeille/suppression définitive.'),
              Text(
                  '• Journaux de sécurité : durée limitée et proportionnée aux besoins de sécurité et de conformité.'),
              SizedBox(height: 16),
              Text('6. Sécurité',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                'Des mesures de sécurité sont mises en place (contrôles d’accès, jetons d’authentification, limitation de débit, etc.). '
                'Aucune mesure n’offre une sécurité absolue : utilisez un mot de passe robuste et activez la 2FA si disponible.',
              ),
              SizedBox(height: 16),
              Text('7. Vos droits',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                'Selon votre législation, vous pouvez disposer de droits (accès, rectification, suppression, opposition, limitation, portabilité). '
                'Vous pouvez gérer une partie de ces informations depuis la page Paramètres.',
              ),
              SizedBox(height: 16),
              Text('8. Contact',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                'Pour toute question relative à la confidentialité, vous pouvez contacter l’administrateur du service. '
                '(À personnaliser : ajoutez une adresse e-mail de contact ou un formulaire.)',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
