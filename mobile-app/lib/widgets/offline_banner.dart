import 'package:flutter/material.dart';
import '../utils/constants.dart';

/// Bannière affichée en haut de l'écran lorsque l'application est hors ligne.
class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return const Material(
      color: AppConstants.warningColor,
      elevation: 2,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              Icon(Icons.cloud_off, color: Colors.white, size: 22),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Vous êtes hors ligne. Les modifications seront synchronisées à la reconnexion.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
