import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    try {
      // Le cache est géré dans ApiService
      final response = await _apiService.getDashboard();
      if (response.statusCode == 200 && mounted) {
        setState(() {
          _stats = response.data['data'];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(2)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tableau de bord'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            tooltip: 'Paramètres',
            onPressed: () => context.go('/settings'),
          ),
        ],
      ),
      drawer: Drawer(
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppConstants.supinfoPurple,
                AppConstants.supinfoPurpleLight,
              ],
            ),
          ),
          child: ListView(
            children: [
              DrawerHeader(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppConstants.supinfoPurple,
                      AppConstants.supinfoPurpleLight,
                    ],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppConstants.supinfoWhite,
                          width: 3,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 35,
                        backgroundImage: authProvider.user?.avatarUrl != null
                            ? NetworkImage(authProvider.user!.avatarUrl!)
                            : null,
                        backgroundColor: AppConstants.supinfoWhite.withOpacity(0.2),
                        child: authProvider.user?.avatarUrl == null
                            ? const Icon(
                                Icons.person,
                                size: 35,
                                color: AppConstants.supinfoWhite,
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      authProvider.user?.displayName ?? authProvider.user?.email ?? 'Utilisateur',
                      style: const TextStyle(
                        color: AppConstants.supinfoWhite,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (authProvider.user?.email != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        authProvider.user!.email!,
                        style: TextStyle(
                          color: AppConstants.supinfoWhite.withOpacity(0.9),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            Container(
              color: Colors.white.withOpacity(0.05),
              child: ListTile(
                leading: const Icon(Icons.dashboard, color: AppConstants.supinfoWhite),
                title: const Text(
                  'Tableau de bord',
                  style: TextStyle(color: AppConstants.supinfoWhite),
                ),
                onTap: () {
                  Navigator.pop(context);
                  context.go('/dashboard');
                },
              ),
            ),
            ListTile(
              leading: const Icon(Icons.folder, color: AppConstants.supinfoWhite),
              title: const Text(
                'Fichiers',
                style: TextStyle(color: AppConstants.supinfoWhite),
              ),
              onTap: () {
                Navigator.pop(context);
                context.go('/files');
              },
            ),
            ListTile(
              leading: const Icon(Icons.search, color: AppConstants.supinfoWhite),
              title: const Text(
                'Recherche',
                style: TextStyle(color: AppConstants.supinfoWhite),
              ),
              onTap: () {
                Navigator.pop(context);
                context.go('/search');
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: AppConstants.supinfoWhite),
              title: const Text(
                'Corbeille',
                style: TextStyle(color: AppConstants.supinfoWhite),
              ),
              onTap: () {
                Navigator.pop(context);
                context.go('/trash');
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings, color: AppConstants.supinfoWhite),
              title: const Text(
                'Paramètres',
                style: TextStyle(color: AppConstants.supinfoWhite),
              ),
              onTap: () {
                Navigator.pop(context);
                context.go('/settings');
              },
            ),
            Divider(color: AppConstants.supinfoWhite.withOpacity(0.3)),
            ListTile(
              leading: const Icon(Icons.logout, color: AppConstants.errorColor),
              title: const Text(
                'Déconnexion',
                style: TextStyle(color: AppConstants.errorColor),
              ),
              onTap: () async {
                await authProvider.logout();
                if (context.mounted) {
                  context.go('/login');
                }
              },
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _stats == null
              ? const Center(child: Text('Erreur de chargement'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Quota - Carte moderne avec gradient
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              AppConstants.supinfoPurple,
                              AppConstants.supinfoPurpleLight,
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: AppConstants.supinfoPurple.withOpacity(0.3),
                              blurRadius: 15,
                              offset: const Offset(0, 5),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: AppConstants.supinfoWhite.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(
                                      Icons.storage,
                                      color: AppConstants.supinfoWhite,
                                      size: 28,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Espace de stockage',
                                          style: TextStyle(
                                            color: AppConstants.supinfoWhite,
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${_stats!['quota']['percentage']}% utilisé',
                                          style: TextStyle(
                                            color: AppConstants.supinfoWhite.withOpacity(0.9),
                                            fontSize: 14,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: LinearProgressIndicator(
                                  value: _stats!['quota']['percentage'] / 100,
                                  minHeight: 12,
                                  backgroundColor: AppConstants.supinfoWhite.withOpacity(0.2),
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    _stats!['quota']['percentage'] > 80
                                        ? AppConstants.errorColor
                                        : AppConstants.successColor,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildStatItem(
                                    'Utilisé',
                                    _formatBytes(_stats!['quota']['used']),
                                    AppConstants.supinfoWhite,
                                  ),
                                  Container(
                                    width: 1,
                                    height: 30,
                                    color: AppConstants.supinfoWhite.withOpacity(0.3),
                                  ),
                                  _buildStatItem(
                                    'Disponible',
                                    _formatBytes(_stats!['quota']['available']),
                                    AppConstants.supinfoWhite,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Répartition - Carte moderne
                      Card(
                        elevation: 3,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppConstants.supinfoPurple.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(
                                      Icons.pie_chart,
                                      color: AppConstants.supinfoPurple,
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  const Text(
                                    'Répartition par type',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              _buildBreakdownItem('Images', _stats!['breakdown']['images'], AppConstants.successColor),
                              _buildBreakdownItem('Vidéos', _stats!['breakdown']['videos'], AppConstants.infoColor),
                              _buildBreakdownItem('Documents', _stats!['breakdown']['documents'], AppConstants.warningColor),
                              _buildBreakdownItem('Audio', _stats!['breakdown']['audio'], AppConstants.supinfoPurple),
                              _buildBreakdownItem('Autres', _stats!['breakdown']['other'], Colors.grey),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Fichiers récents - Carte moderne
                      Card(
                        elevation: 3,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppConstants.supinfoPurple.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(
                                      Icons.access_time,
                                      color: AppConstants.supinfoPurple,
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  const Text(
                                    'Fichiers récents',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              if (_stats!['recent_files'] != null &&
                                  (_stats!['recent_files'] as List).isNotEmpty)
                                ...(_stats!['recent_files'] as List).map((file) {
                                  final mimeType = file['mime_type'] ?? '';
                                  IconData icon;
                                  Color iconColor;
                                  
                                  if (mimeType.startsWith('image/')) {
                                    icon = Icons.image;
                                    iconColor = Colors.green;
                                  } else if (mimeType.startsWith('video/')) {
                                    icon = Icons.video_library;
                                    iconColor = Colors.purple;
                                  } else if (mimeType.startsWith('audio/')) {
                                    icon = Icons.audiotrack;
                                    iconColor = Colors.orange;
                                  } else if (mimeType == 'application/pdf') {
                                    icon = Icons.picture_as_pdf;
                                    iconColor = Colors.red;
                                  } else if (mimeType.startsWith('text/')) {
                                    icon = Icons.text_snippet;
                                    iconColor = Colors.blue;
                                  } else {
                                    icon = Icons.insert_drive_file;
                                    iconColor = Colors.grey;
                                  }
                                  
                                  return ListTile(
                                    leading: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: iconColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Icon(icon, color: iconColor, size: 20),
                                    ),
                                      title: Text(file['name'] ?? ''),
                                      subtitle: Text(_formatBytes(file['size'] ?? 0)),
                                      trailing: Text(
                                        DateTime.parse(file['updated_at'])
                                            .toString()
                                            .substring(0, 10),
                                      ),
                                  );
                                })
                              else
                                const Text('Aucun fichier récent'),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildStatItem(String label, String value, Color textColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: textColor.withOpacity(0.8),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: textColor,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildBreakdownItem(String label, int bytes, Color color) {
    final total = _stats!['breakdown']['total'] ?? 1;
    final percentage = total > 0 ? (bytes / total * 100) : 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              Text(
                _formatBytes(bytes),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: percentage / 100,
              minHeight: 8,
              backgroundColor: Colors.grey[200],
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${percentage.toStringAsFixed(1)}%',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}


