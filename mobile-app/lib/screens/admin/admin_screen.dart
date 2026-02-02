import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _stats;
  List<dynamic> _users = [];
  Map<String, dynamic>? _pagination;
  bool _loadingStats = true;
  bool _loadingUsers = true;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  int _page = 1;
  static const int _limit = 20;

  @override
  void initState() {
    super.initState();
    _loadStats();
    _loadUsers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadStats() async {
    setState(() => _loadingStats = true);
    try {
      final response = await _apiService.getAdminStats();
      if (response.statusCode == 200 && response.data['data'] != null && mounted) {
        setState(() {
          _stats = response.data['data'] as Map<String, dynamic>;
          _loadingStats = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loadingStats = false);
    }
  }

  Future<void> _loadUsers({int page = 1}) async {
    setState(() => _loadingUsers = true);
    try {
      final response = await _apiService.getAdminUsers(
        page: page,
        limit: _limit,
        search: _searchQuery.isEmpty ? null : _searchQuery,
      );
      if (response.statusCode == 200 && response.data['data'] != null && mounted) {
        final data = response.data['data'] as Map<String, dynamic>;
        setState(() {
          _users = List<dynamic>.from(data['users'] ?? []);
          _pagination = data['pagination'] as Map<String, dynamic>?;
          _page = page;
          _loadingUsers = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loadingUsers = false);
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

  void _showEditUserDialog(Map<String, dynamic> user) {
    final displayNameController = TextEditingController(
      text: user['display_name']?.toString() ?? '',
    );
    final quotaGb = (user['quota_limit'] is int
            ? (user['quota_limit'] as int) / (1024 * 1024 * 1024)
            : 30.0)
        .toStringAsFixed(2);
    final quotaController = TextEditingController(text: quotaGb);
    bool isActive = user['is_active'] != false;
    bool isAdmin = user['is_admin'] == true;
    final userId = user['id']?.toString() ?? '';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text('Modifier l\'utilisateur'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: displayNameController,
                    decoration: const InputDecoration(
                      labelText: 'Nom d\'affichage',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: quotaController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Quota (GB)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SwitchListTile(
                    title: const Text('Compte actif'),
                    value: isActive,
                    onChanged: (v) => setDialogState(() => isActive = v),
                  ),
                  SwitchListTile(
                    title: const Text('Administrateur'),
                    value: isAdmin,
                    onChanged: (v) => setDialogState(() => isAdmin = v),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Annuler'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final quotaLimitBytes = (double.tryParse(quotaController.text) ?? 30) *
                      1024 *
                      1024 *
                      1024;
                  try {
                    await _apiService.updateAdminUser(
                      userId,
                      displayName: displayNameController.text.trim().isEmpty
                          ? null
                          : displayNameController.text.trim(),
                      quotaLimit: quotaLimitBytes.round(),
                      isActive: isActive,
                      isAdmin: isAdmin,
                    );
                    if (ctx.mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Utilisateur mis à jour'),
                          backgroundColor: Colors.green,
                        ),
                      );
                      _loadUsers(page: _page);
                      _loadStats();
                    }
                  } catch (e) {
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Erreur: $e'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  }
                },
                child: const Text('Enregistrer'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _confirmDeleteUser(String userId, String email) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer l\'utilisateur'),
        content: Text(
          'Êtes-vous sûr de vouloir supprimer l\'utilisateur $email ? Cette action est irréversible.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _apiService.deleteAdminUser(userId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Utilisateur supprimé'),
              backgroundColor: Colors.green,
            ),
          );
          _loadUsers(page: _page);
          _loadStats();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erreur: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    if (user == null || !user.isAdmin) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/dashboard');
      });
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Administration'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await _loadStats();
          await _loadUsers(page: 1);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_loadingStats)
              const Center(child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ))
            else if (_stats != null) ...[
              Text(
                'Statistiques',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.4,
                children: [
                  _statCard(
                    'Utilisateurs',
                    '${_stats!['users']?['total'] ?? 0}',
                    '${_stats!['users']?['active'] ?? 0} actifs',
                    Colors.blue,
                  ),
                  _statCard(
                    'Fichiers',
                    '${_stats!['files']?['total'] ?? 0}',
                    null,
                    Colors.green,
                  ),
                  _statCard(
                    'Dossiers',
                    '${_stats!['folders']?['total'] ?? 0}',
                    null,
                    Colors.orange,
                  ),
                  _statCard(
                    'Stockage',
                    _formatBytes((_stats!['storage']?['total_used'] as int?) ?? 0),
                    null,
                    Colors.purple,
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
            Text(
              'Utilisateurs',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Rechercher par email ou nom...',
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                          _loadUsers(page: 1);
                        },
                      )
                    : null,
              ),
              onSubmitted: (value) {
                setState(() => _searchQuery = value);
                _loadUsers(page: 1);
              },
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _loadingUsers
                        ? null
                        : () {
                            setState(() => _searchQuery = _searchController.text);
                            _loadUsers(page: 1);
                          },
                    icon: const Icon(Icons.search, size: 20),
                    label: const Text('Rechercher'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_loadingUsers)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_users.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: Text('Aucun utilisateur trouvé')),
              )
            else
              ..._users.map<Widget>((u) {
                final userMap = Map<String, dynamic>.from(u as Map<dynamic, dynamic>);
                final id = userMap['id']?.toString() ?? '';
                final email = userMap['email']?.toString() ?? '';
                final displayName = userMap['display_name']?.toString() ?? '-';
                final isActive = userMap['is_active'] != false;
                final isAdmin = userMap['is_admin'] == true;

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(
                      displayName.isNotEmpty ? displayName : email,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: isActive ? null : Colors.grey,
                      ),
                    ),
                    subtitle: Text(
                      email,
                      style: TextStyle(
                        fontSize: 12,
                        color: isActive ? null : Colors.grey,
                      ),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isAdmin)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppConstants.supinfoPurple.withAlpha((0.2 * 255).round()),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text('Admin', style: TextStyle(fontSize: 11)),
                          ),
                        const SizedBox(width: 8),
                        PopupMenuButton<String>(
                          onSelected: (value) {
                            if (value == 'edit') _showEditUserDialog(userMap);
                            if (value == 'delete') _confirmDeleteUser(id, email);
                          },
                          itemBuilder: (context) => [
                            const PopupMenuItem(
                              value: 'edit',
                              child: Row(
                                children: [
                                  Icon(Icons.edit, size: 20),
                                  SizedBox(width: 12),
                                  Text('Modifier'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: 'delete',
                              child: Row(
                                children: [
                                  Icon(Icons.delete, size: 20, color: Colors.red),
                                  SizedBox(width: 12),
                                  Text('Supprimer', style: TextStyle(color: Colors.red)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    onTap: () => _showEditUserDialog(userMap),
                  ),
                );
              }),
            if (_pagination != null &&
                (_pagination!['pages'] as int? ?? 1) > 1) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    onPressed: _page <= 1
                        ? null
                        : () => _loadUsers(page: _page - 1),
                    icon: const Icon(Icons.chevron_left),
                  ),
                  Text(
                    'Page $_page / ${_pagination!['pages']}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  IconButton(
                    onPressed: _page >= (_pagination!['pages'] as int)
                        ? null
                        : () => _loadUsers(page: _page + 1),
                    icon: const Icon(Icons.chevron_right),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _statCard(String title, String value, String? subtitle, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
