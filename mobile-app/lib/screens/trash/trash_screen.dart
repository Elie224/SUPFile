import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../services/sync_service.dart';
import '../../services/offline_storage_service.dart';
import '../../providers/files_provider.dart';
import '../../models/file.dart';
import '../../models/folder.dart';
import '../../utils/constants.dart';

class TrashScreen extends StatefulWidget {
  const TrashScreen({super.key});

  @override
  State<TrashScreen> createState() => _TrashScreenState();
}

class _TrashScreenState extends State<TrashScreen> {
  final ApiService _apiService = ApiService();
  List<FileItem> _files = [];
  List<FolderItem> _folders = [];
  bool _isLoading = true;
  String? _error;
  bool _fromCache = false;

  @override
  void initState() {
    super.initState();
    _loadTrash();
  }

  Future<void> _loadTrash() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _fromCache = false;
    });

    final syncService = SyncService();
    if (!syncService.isOnline) {
      try {
        await OfflineStorageService.init();
        final cachedFiles = OfflineStorageService.getUserMeta('trashFiles');
        final cachedFolders = OfflineStorageService.getUserMeta('trashFolders');
        if (mounted) {
          final filesList = cachedFiles is List
              ? (cachedFiles)
                  .map((e) => FileItem.fromJson(Map<String, dynamic>.from(e as Map)))
                  .toList()
              : <FileItem>[];
          final foldersList = cachedFolders is List
              ? (cachedFolders)
                  .map((e) => FolderItem.fromJson(Map<String, dynamic>.from(e as Map)))
                  .toList()
              : <FolderItem>[];
          setState(() {
            _files = filesList;
            _folders = foldersList;
            _isLoading = false;
            _fromCache = true;
          });
        }
        return;
      } catch (_) {}
      if (mounted) {
        setState(() {
          _error = 'Hors ligne. Connectez-vous pour afficher la corbeille.';
          _isLoading = false;
        });
      }
      return;
    }

    try {
      final filesResponse = await _apiService.listTrashFiles();
      final foldersResponse = await _apiService.listTrashFolders();

      if (filesResponse.statusCode == 200 && foldersResponse.statusCode == 200) {
        final filesItems = (filesResponse.data['data']['items'] ?? []) as List<dynamic>;
        final foldersItems = (foldersResponse.data['data']['items'] ?? []) as List<dynamic>;
        await OfflineStorageService.setUserMeta('trashFiles', filesItems);
        await OfflineStorageService.setUserMeta('trashFolders', foldersItems);
        if (mounted) {
          setState(() {
            _files = filesItems
                .map((item) => FileItem.fromJson(Map<String, dynamic>.from(item as Map)))
                .toList();
            _folders = foldersItems
                .map((item) => FolderItem.fromJson(Map<String, dynamic>.from(item as Map)))
                .toList();
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      try {
        final cachedFiles = OfflineStorageService.getUserMeta('trashFiles');
        final cachedFolders = OfflineStorageService.getUserMeta('trashFolders');
        if (cachedFiles is List && cachedFolders is List && mounted) {
          setState(() {
            _files = (cachedFiles)
                .map((e) => FileItem.fromJson(Map<String, dynamic>.from(e as Map)))
                .toList();
            _folders = (cachedFolders)
                .map((e) => FolderItem.fromJson(Map<String, dynamic>.from(e as Map)))
                .toList();
            _fromCache = true;
          });
        }
      } catch (_) {}
      if (mounted) {
        setState(() {
          _error = _fromCache ? null : e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _restoreFile(String fileId) async {
    try {
      await _apiService.restoreFile(fileId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Fichier restauré'),
            backgroundColor: Colors.green,
          ),
        );
        _loadTrash();
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

  Future<void> _restoreFolder(String folderId) async {
    try {
      await _apiService.restoreFolder(folderId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Dossier restauré'),
            backgroundColor: Colors.green,
          ),
        );
        _loadTrash();
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

  Future<void> _permanentlyDeleteFile(String fileId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer définitivement'),
        content: const Text('Cette action est irréversible. Voulez-vous continuer ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final filesProvider = Provider.of<FilesProvider>(context, listen: false);
        await filesProvider.deleteFile(fileId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Fichier supprimé définitivement'),
              backgroundColor: Colors.orange,
            ),
          );
          _loadTrash();
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

  Future<void> _permanentlyDeleteFolder(String folderId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer définitivement'),
        content: const Text('Cette action est irréversible. Voulez-vous continuer ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final filesProvider = Provider.of<FilesProvider>(context, listen: false);
        await filesProvider.deleteFolder(folderId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Dossier supprimé définitivement'),
              backgroundColor: Colors.orange,
            ),
          );
          _loadTrash();
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

  /// Vide complètement la corbeille en supprimant définitivement tous les fichiers et dossiers
  Future<void> _emptyTrash() async {
    if (_files.isEmpty && _folders.isEmpty) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Vider la corbeille'),
        content: Text(
          'Vous êtes sur le point de supprimer définitivement ${_files.length + _folders.length} élément(s).\n\n'
          'Cette action est irréversible. Voulez-vous continuer ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Vider la corbeille'),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    // Afficher un indicateur de progression
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const AlertDialog(
        content: Row(
          children: [
            CircularProgressIndicator(),
            SizedBox(width: 16),
            Text('Suppression en cours...'),
          ],
        ),
      ),
    );

    try {
      final filesProvider = Provider.of<FilesProvider>(context, listen: false);
      int successCount = 0;
      int failCount = 0;

      // Supprimer définitivement tous les fichiers
      for (final file in _files) {
        try {
          await filesProvider.deleteFile(file.id);
          successCount++;
        } catch (e) {
          failCount++;
        }
      }

      // Supprimer définitivement tous les dossiers
      for (final folder in _folders) {
        try {
          await filesProvider.deleteFolder(folder.id);
          successCount++;
        } catch (e) {
          failCount++;
        }
      }

      if (mounted) {
        Navigator.pop(context); // Fermer le dialogue de progression
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              failCount > 0
                  ? '$successCount élément(s) supprimé(s), $failCount échec(s)'
                  : 'Corbeille vidée avec succès',
            ),
            backgroundColor: failCount > 0 ? Colors.orange : Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
        
        _loadTrash();
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Fermer le dialogue de progression
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors du vidage de la corbeille: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Corbeille'),
        actions: [
          if (_files.isNotEmpty || _folders.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep, color: Colors.red),
              onPressed: _emptyTrash,
              tooltip: 'Vider la corbeille',
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTrash,
            tooltip: 'Actualiser',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadTrash,
                        child: const Text('Réessayer'),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    if (_fromCache)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.all(8),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppConstants.warningColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.cloud_download, color: AppConstants.warningColor, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Données en cache (hors ligne)',
                                style: TextStyle(fontSize: 12, color: Colors.grey.shade800),
                              ),
                            ),
                          ],
                        ),
                      ),
                    Expanded(
                      child: _files.isEmpty && _folders.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.delete_outline, size: 64, color: Colors.grey),
                          const SizedBox(height: 16),
                          const Text(
                            'Corbeille vide',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'La corbeille est vide. Les fichiers supprimés apparaîtront ici.',
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 14,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadTrash,
                      child: ListView.builder(
                        itemCount: _folders.length + _files.length,
                        itemBuilder: (context, index) {
                          if (index < _folders.length) {
                            final folder = _folders[index];
                            return ListTile(
                              leading: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.blue.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.folder, color: Colors.blue, size: 24),
                              ),
                              title: Text(folder.name),
                              subtitle: const Text('Dossier'),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.restore, color: Colors.green),
                                    onPressed: () => _restoreFolder(folder.id),
                                    tooltip: 'Restaurer',
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_forever, color: Colors.red),
                                    onPressed: () => _permanentlyDeleteFolder(folder.id),
                                    tooltip: 'Supprimer définitivement',
                                  ),
                                ],
                              ),
                            );
                          } else {
                            final file = _files[index - _folders.length];
                            IconData icon;
                            Color iconColor;
                            
                            if (file.isImage) {
                              icon = Icons.image;
                              iconColor = Colors.green;
                            } else if (file.isVideo) {
                              icon = Icons.video_library;
                              iconColor = Colors.purple;
                            } else if (file.isAudio) {
                              icon = Icons.audiotrack;
                              iconColor = Colors.orange;
                            } else if (file.isPdf) {
                              icon = Icons.picture_as_pdf;
                              iconColor = Colors.red;
                            } else if (file.isText) {
                              icon = Icons.text_snippet;
                              iconColor = Colors.blue;
                            } else {
                              icon = Icons.insert_drive_file;
                              iconColor = Colors.grey;
                            }

                            return ListTile(
                              leading: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: iconColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(icon, color: iconColor, size: 24),
                              ),
                              title: Text(file.name),
                              subtitle: Text('${file.formattedSize} • ${file.mimeType ?? 'Fichier'}'),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.restore, color: Colors.green),
                                    onPressed: () => _restoreFile(file.id),
                                    tooltip: 'Restaurer',
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_forever, color: Colors.red),
                                    onPressed: () => _permanentlyDeleteFile(file.id),
                                    tooltip: 'Supprimer définitivement',
                                  ),
                                ],
                              ),
                            );
                          }
                        },
                      ),
                    ),
                  ),
                ],
              ),
    );
  }
}
