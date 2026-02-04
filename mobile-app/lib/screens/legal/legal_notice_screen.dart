import 'package:flutter/material.dart';

class LegalNoticeScreen extends StatelessWidget {
  const LegalNoticeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const updatedAt = '2026-02-04';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mentions légales'),
      ),
      body: const SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Mentions légales',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 6),
              Text('Dernière mise à jour : ' + updatedAt),
              SizedBox(height: 16),
              Text('Éditeur du service',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                'SUPFile\n'
                '(À personnaliser : raison sociale / nom, adresse, e-mail.)',
              ),
              SizedBox(height: 16),
              Text('Hébergement',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                '(À personnaliser : fournisseur d’hébergement, adresse.)\n'
                'Le service peut s’appuyer sur des prestataires tiers pour l’hébergement et l’envoi d’e-mails.',
              ),
              SizedBox(height: 16),
              Text('Propriété intellectuelle',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                'Les éléments de l’application (marque, interface, textes) sont protégés. '
                'Toute reproduction non autorisée est interdite.',
              ),
              SizedBox(height: 16),
              Text('Données personnelles',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(
                'Pour plus d’informations sur le traitement des données, consultez la page « Politique de confidentialité ».',
              ),
              SizedBox(height: 16),
              Text('Contact',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text('(À personnaliser : e-mail de contact/support.)'),
            ],
          ),
        ),
      ),
    );
  }
}
