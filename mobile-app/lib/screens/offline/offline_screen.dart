import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/sync_service.dart';
import '../../utils/constants.dart';
import '../../widgets/supfile_logo.dart';

/// Page dédiée au mode hors ligne (équivalent web /offline).
/// Explique le fonctionnement et propose de revenir à l'accueil ou aux fichiers.
class OfflineScreen extends StatelessWidget {
  const OfflineScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final syncService = Provider.of<SyncService>(context);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [
                    AppConstants.supinfoPurpleDark,
                    AppConstants.supinfoPurple,
                    const Color(0xFF121212),
                  ]
                : [
                    AppConstants.supinfoPurple.withAlpha((0.08 * 255).round()),
                    AppConstants.supinfoGrey,
                    AppConstants.supinfoWhite,
                  ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SupFileLogo(size: 80, showIcon: true, useGradient: true),
                  const SizedBox(height: 24),
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppConstants.warningColor.withAlpha((0.2 * 255).round()),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.cloud_off,
                      size: 48,
                      color: AppConstants.warningColor,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Mode hors ligne',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.grey[800],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Vous n\'êtes pas connecté à Internet. L\'application SUPFile reste utilisable pour la navigation et les données déjà chargées. Les modifications seront synchronisées à la reconnexion.',
                    style: TextStyle(
                      fontSize: 15,
                      height: 1.5,
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  if (syncService.pendingCount > 0)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Text(
                        '${syncService.pendingCount} opération(s) en attente de synchronisation',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? Colors.grey[500] : Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  const SizedBox(height: 16),
                  if (authProvider.isAuthenticated) ...[
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: () => context.go('/dashboard'),
                        icon: const Icon(Icons.dashboard, size: 22),
                        label: const Text('Tableau de bord'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppConstants.supinfoPurple,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: OutlinedButton.icon(
                        onPressed: () => context.go('/files'),
                        icon: const Icon(Icons.folder, size: 22),
                        label: const Text('Mes fichiers'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppConstants.supinfoPurple,
                          side: const BorderSide(color: AppConstants.supinfoPurple),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ] else ...[
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: () => context.go('/login'),
                        icon: const Icon(Icons.login, size: 22),
                        label: const Text('Connexion'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppConstants.supinfoPurple,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
