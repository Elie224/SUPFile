import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../utils/constants.dart';
import '../../widgets/supfile_logo.dart';

/// Données des pages d'introduction (alignées sur le web)
final List<Map<String, dynamic>> _introPages = [
  {
    'icon': Icons.cloud,
    'title': 'Bienvenue sur SUPFile',
    'subtitle': 'Votre espace de stockage cloud professionnel',
    'description':
        'SUPFile est une plateforme moderne et sécurisée pour stocker, organiser et partager vos fichiers. Accessible depuis le web et le mobile.',
    'highlights': [
      'Stockage cloud',
      'Sécurité renforcée',
      'Accès multi-appareils'
    ],
  },
  {
    'icon': Icons.folder,
    'title': 'Organisation intelligente',
    'subtitle': 'Gérez vos fichiers comme un pro',
    'description':
        'Créez des dossiers et sous-dossiers. Déplacez vos fichiers, utilisez la corbeille pour récupérer ceux supprimés par erreur.',
    'highlights': [
      'Dossiers illimités',
      'Déplacement facile',
      'Corbeille avec restauration'
    ],
  },
  {
    'icon': Icons.visibility,
    'title': 'Prévisualisation instantanée',
    'subtitle': 'Visualisez sans télécharger',
    'description':
        'Ouvrez vos fichiers directement : PDF, images, vidéos, audio et textes. Plus besoin de télécharger pour voir le contenu.',
    'highlights': [
      'PDF, images, vidéos',
      'Fichiers audio',
      'Prévisualisation rapide'
    ],
  },
  {
    'icon': Icons.link,
    'title': 'Partage sécurisé',
    'subtitle': 'Collaborez en toute confiance',
    'description':
        'Créez des liens de partage avec date d\'expiration ou mot de passe. Partagez aussi en interne avec d\'autres utilisateurs SUPFile.',
    'highlights': [
      'Liens temporaires',
      'Protection par mot de passe',
      'Partage entre utilisateurs'
    ],
  },
  {
    'icon': Icons.dashboard,
    'title': 'Tableau de bord complet',
    'subtitle': 'Gardez le contrôle total',
    'description':
        'Visualisez votre utilisation, accédez à vos fichiers récents et personnalisez l\'expérience avec le thème clair ou sombre.',
    'highlights': [
      'Statistiques détaillées',
      'Gestion des quotas',
      'Thèmes personnalisables'
    ],
  },
];

class IntroScreen extends StatefulWidget {
  const IntroScreen({super.key});

  @override
  State<IntroScreen> createState() => _IntroScreenState();
}

class _IntroScreenState extends State<IntroScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.isAuthenticated) {
        context.go('/dashboard');
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _goNext() {
    if (_currentPage < _introPages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      context.go('/signup');
    }
  }

  void _goToLogin() {
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
          child: Column(
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SupFileLogo(
                        size: 44, showIcon: true, useGradient: true),
                    TextButton(
                      onPressed: _goToLogin,
                      child: Text(
                        'Connexion',
                        style: TextStyle(
                          color: isDark
                              ? Colors.grey[300]
                              : AppConstants.supinfoPurple,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: _introPages.length,
                  onPageChanged: (index) =>
                      setState(() => _currentPage = index),
                  itemBuilder: (context, index) {
                    final page = _introPages[index];
                    return _buildPage(
                      context,
                      page['icon'] as IconData,
                      page['title'] as String,
                      page['subtitle'] as String,
                      page['description'] as String,
                      (page['highlights'] as List<dynamic>)
                          .map((e) => e.toString())
                          .toList(),
                      isDark,
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        _introPages.length,
                        (i) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: _currentPage == i ? 24 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(4),
                            color: _currentPage == i
                                ? AppConstants.supinfoPurple
                                : (isDark
                                    ? Colors.grey[600]
                                    : Colors.grey[400]),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _goNext,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppConstants.supinfoPurple,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          _currentPage < _introPages.length - 1
                              ? 'Suivant'
                              : 'Commencer',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPage(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle,
    String description,
    List<String> highlights,
    bool isDark,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 24),
          Container(
            width: 92,
            height: 92,
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.white.withAlpha((0.08 * 255).round())
                  : AppConstants.supinfoPurple.withAlpha((0.10 * 255).round()),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: isDark
                    ? Colors.white.withAlpha((0.14 * 255).round())
                    : AppConstants.supinfoPurple
                        .withAlpha((0.18 * 255).round()),
              ),
            ),
            child: Icon(
              icon,
              size: 48,
              color: isDark
                  ? AppConstants.supinfoPurpleLight
                  : AppConstants.supinfoPurple,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.grey[800],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 16,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          Text(
            description,
            style: TextStyle(
              fontSize: 15,
              height: 1.5,
              color: isDark ? Colors.grey[300] : Colors.grey[700],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ...highlights.map(
            (h) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: AppConstants.supinfoPurple,
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    h,
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
