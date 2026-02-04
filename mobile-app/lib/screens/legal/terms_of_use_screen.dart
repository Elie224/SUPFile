import 'package:flutter/material.dart';
import '../../widgets/app_back_button.dart';

class TermsOfUseScreen extends StatelessWidget {
  const TermsOfUseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const updatedAt = '2026-02-04';

    return Scaffold(
      appBar: AppBar(
        leading: const AppBackButton(fallbackLocation: '/'),
        title: const Text('Conditions d’utilisation'),
      ),
      body: const SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Conditions d’utilisation',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 6),
              Text('Dernière mise à jour : $updatedAt'),
              SizedBox(height: 16),
              Text('1. Objet',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                'SUPFile est un service de stockage et de partage de fichiers. En utilisant le service, vous acceptez ces conditions.',
              ),
              SizedBox(height: 16),
              Text('2. Compte et sécurité',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                  '• Vous êtes responsable de la confidentialité de vos identifiants.'),
              Text('• Vous devez fournir des informations exactes et à jour.'),
              Text(
                  '• En cas de suspicion d’accès non autorisé, modifiez votre mot de passe et contactez l’administrateur.'),
              SizedBox(height: 16),
              Text('3. Usage acceptable',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text('• Ne pas utiliser le service à des fins illégales.'),
              Text(
                  '• Ne pas tenter de contourner la sécurité, d’extraire des données d’autrui, ou de perturber le service.'),
              Text(
                  '• Respecter les droits d’auteur et les droits des tiers sur les contenus stockés/partagés.'),
              SizedBox(height: 16),
              Text('4. Contenus et partage',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                  '• Vous conservez la responsabilité des contenus que vous téléversez.'),
              Text(
                  '• Les liens de partage peuvent donner accès à des contenus : partagez-les de manière prudente.'),
              SizedBox(height: 16),
              Text('5. Disponibilité',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                'Le service est fourni « en l’état ». Des interruptions peuvent survenir (maintenance, incidents, limitations hébergeur). '
                'Nous faisons au mieux pour rétablir le service.',
              ),
              SizedBox(height: 16),
              Text('6. Suspension / suppression',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                'En cas d’abus, de violation des règles ou pour des raisons de sécurité, l’accès peut être restreint. '
                'Vous pouvez demander la suppression de votre compte selon les modalités prévues.',
              ),
              SizedBox(height: 16),
              Text('7. Modifications',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                  'Ces conditions peuvent évoluer. La date de mise à jour est indiquée en haut de page.'),
              SizedBox(height: 16),
              Text('8. Contact',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                'Pour toute question, contactez l’administrateur du service. '
                '(À personnaliser : ajoutez une adresse e-mail de contact.)',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
