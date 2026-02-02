import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/share.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';

class ManageSharesScreen extends StatefulWidget {
  const ManageSharesScreen({super.key});

  @override
  State<ManageSharesScreen> createState() => _ManageSharesScreenState();
}

class _ManageSharesScreenState extends State<ManageSharesScreen> {
  final ApiService _apiService = ApiService();
  bool _loadingPublic = false;
  bool _loadingInternal = false;
  String? _errorPublic;
  String? _errorInternal;
  List<ShareItem> _publicShares = [];
  List<ShareItem> _internalShares = [];

  @override
  void initState() {
    super.initState();
    _loadPublicShares();
    _loadInternalShares();
  }

  Future<void> _loadPublicShares() async {
    setState(() {
      _loadingPublic = true;
      _errorPublic = null;
    });
    try {
      final response = await _apiService.listShares();
      final data = response.data?['data'] as List<dynamic>? ?? [];
      setState(() {
        _publicShares = data.map((e) => ShareItem.fromJson(e)).toList();
        _loadingPublic = false;
      });
    } catch (e) {
      setState(() {
        _errorPublic = e.toString();
        _loadingPublic = false;
      });
    }
  }

  Future<void> _loadInternalShares() async {
    setState(() {
      _loadingInternal = true;
      _errorInternal = null;
    });
    try {
      final response = await _apiService.listShares(type: 'internal');
      final data = response.data?['data'] as List<dynamic>? ?? [];
      setState(() {
        _internalShares = data.map((e) => ShareItem.fromJson(e)).toList();
        _loadingInternal = false;
      });
    } catch (e) {
      setState(() {
        _errorInternal = e.toString();
        _loadingInternal = false;
      });
    }
  }

  Future<void> _deactivateShare(ShareItem share) async {
    try {
      await _apiService.deactivateShare(share.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Partage désactivé'),
          backgroundColor: Colors.green,
        ),
      );
      await _loadPublicShares();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _copyLink(String url) async {
    await Clipboard.setData(ClipboardData(text: url));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Lien copié dans le presse-papiers'),
        backgroundColor: Colors.green,
      ),
    );
  }

  Future<void> _openLink(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  String _resourceLabel(ShareItem share) {
    if (share.isFileShare) return 'Fichier';
    if (share.isFolderShare) return 'Dossier';
    return 'Ressource';
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Aucune';
    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year} ${date.hour.toString().padLeft(2, '0')}:'
        '${date.minute.toString().padLeft(2, '0')}';
  }

  Widget _buildShareList({
    required bool isPublic,
    required bool isLoading,
    required String? error,
    required List<ShareItem> shares,
  }) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (error != null) {
      return Center(child: Text('Erreur: $error'));
    }
    if (shares.isEmpty) {
      return const Center(child: Text('Aucun partage trouvé.'));
    }
    return RefreshIndicator(
      onRefresh: isPublic ? _loadPublicShares : _loadInternalShares,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: shares.length,
        itemBuilder: (context, index) {
          final share = shares[index];
          final shareUrl = share.publicToken != null
              ? '${AppConstants.apiBaseUrl}/share/${share.publicToken}'
              : null;
          return Card(
            margin: const EdgeInsets.symmetric(vertical: 6),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Icon(share.isFileShare ? Icons.insert_drive_file : Icons.folder),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${_resourceLabel(share)} · ${share.shareType}',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      if (share.isActive)
                        const Chip(label: Text('Actif'))
                      else
                        const Chip(label: Text('Inactif')),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('ID: ${share.id}'),
                  const SizedBox(height: 4),
                  Text('Expire le: ${_formatDate(share.expiresAt)}'),
                  const SizedBox(height: 4),
                  Text('Accès: ${share.accessCount}'),
                  if (shareUrl != null) ...[
                    const SizedBox(height: 8),
                    SelectableText(
                      shareUrl,
                      style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _copyLink(shareUrl),
                            icon: const Icon(Icons.copy),
                            label: const Text('Copier'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _openLink(shareUrl),
                            icon: const Icon(Icons.open_in_new),
                            label: const Text('Ouvrir'),
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (isPublic) ...[
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: share.isActive ? () => _deactivateShare(share) : null,
                      icon: const Icon(Icons.pause_circle_filled),
                      label: const Text('Désactiver le partage'),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Mes partages'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Publics'),
              Tab(text: 'Partagés avec moi'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildShareList(
              isPublic: true,
              isLoading: _loadingPublic,
              error: _errorPublic,
              shares: _publicShares,
            ),
            _buildShareList(
              isPublic: false,
              isLoading: _loadingInternal,
              error: _errorInternal,
              shares: _internalShares,
            ),
          ],
        ),
      ),
    );
  }
}
