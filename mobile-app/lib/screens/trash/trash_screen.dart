import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/sync_service.dart';
import '../../services/offline_storage_service.dart';
import '../../models/file.dart';
import '../../models/folder.dart';
import '../../providers/auth_provider.dart';
import '../../utils/constants.dart';
import '../../utils/performance_cache.dart';
import '../../widgets/app_back_button.dart';
import 'package:provider/provider.dart';
import '../../providers/files_provider.dart';

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
      } else {
        if (mounted) {
          final message = (filesResponse.data is Map && (filesResponse.data as Map)['error'] is Map)
              ? ((filesResponse.data as Map)['error']['message']?.toString() ?? 'Erreur de chargement')
              : 'Erreur de chargement';
          setState(() {
            _error = message;
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
      final FilesProvider? filesProvider = mounted ? context.read<FilesProvider>() : null;

      // Optimistic UI: retirer immédiatement de la liste.
      if (mounted) {
        setState(() {
          _files.removeWhere((f) => f.id == fileId);
        });
      }

      await _apiService.restoreFile(fileId);
      // Les stats/quota peuvent être mises en cache côté app.
      await PerformanceCache.remove('dashboard');
      if (mounted) {
        // ignore: unawaited_futures
        context.read<AuthProvider>().refreshUser();
      }

      // Récupérer la destination restaurée (dossier d'origine) et rafraîchir ce dossier.
      try {
        final res = await _apiService.getFile(fileId);
        if (res.statusCode == 200 && res.data is Map) {
          final data = (res.data as Map)['data'];
          if (data is Map) {
            final restored = FileItem.fromJson(Map<String, dynamic>.from(data));
            final destFolderId = restored.folderId;

            // Invalider les caches de listing (sinon listFiles peut rester en cache 5 minutes).
            await PerformanceCache.removeByPrefix('files_${destFolderId ?? 'root'}_');
            await PerformanceCache.removeByPrefix('files_root_');

            // Rafraîchir immédiatement seulement si le dossier de destination est celui affiché.
            if (filesProvider != null && filesProvider.currentFolderId == destFolderId) {
              // ignore: unawaited_futures
              filesProvider.loadFiles(folderId: destFolderId, force: true);
            }
            if (filesProvider != null && destFolderId == null && filesProvider.currentFolderId == null) {
              // ignore: unawaited_futures
              filesProvider.loadFiles(folderId: null, force: true);
            }
          }
        }
      } catch (_) {
        // fallback: au minimum rafraîchir la liste courante
        filesProvider?.loadFiles(folderId: filesProvider.currentFolderId, force: true);
      }

      // Mettre à jour le cache corbeille pour éviter que l'élément réapparaisse au refresh.
      try {
        await OfflineStorageService.setUserMeta(
          'trashFiles',
          _files.map((f) => f.toJson()).toList(),
        );
      } catch (_) {}

      // Rafraîchir l'explorateur de fichiers (si présent) pour que le restauré apparaisse rapidement.
      try {
        // Fire-and-forget pour ne pas bloquer l'UI de la corbeille.
        filesProvider?.loadFiles(folderId: filesProvider.currentFolderId, force: true);
      } catch (_) {}

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Fichier restauré'),
            backgroundColor: Colors.green,
          ),
        );
        // Recharger en arrière-plan pour resynchroniser (si nécessaire).
        _loadTrash();
      }
    } catch (e) {
      // En cas d'échec, recharger la corbeille depuis l'API/cache.
      if (mounted) {
        _loadTrash();
      }
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
      final FilesProvider? filesProvider = mounted ? context.read<FilesProvider>() : null;

      // Optimistic UI: retirer immédiatement de la liste.
      if (mounted) {
        setState(() {
          _folders.removeWhere((f) => f.id == folderId);
        });
      }

      await _apiService.restoreFolder(folderId);
      await PerformanceCache.remove('dashboard');
      if (mounted) {
        // ignore: unawaited_futures
        context.read<AuthProvider>().refreshUser();
      }

      // Récupérer la destination restaurée (parent d'origine) et rafraîchir ce dossier.
      try {
        final res = await _apiService.getFolder(folderId);
        if (res.statusCode == 200 && res.data is Map) {
          final data = (res.data as Map)['data'];
          if (data is Map) {
            final restored = FolderItem.fromJson(Map<String, dynamic>.from(data));
            final destParentId = restored.parentId;

            await PerformanceCache.removeByPrefix('files_${destParentId ?? 'root'}_');
            await PerformanceCache.removeByPrefix('files_root_');

            if (filesProvider != null && filesProvider.currentFolderId == destParentId) {
              // ignore: unawaited_futures
              filesProvider.loadFiles(folderId: destParentId, force: true);
            }
            if (filesProvider != null && destParentId == null && filesProvider.currentFolderId == null) {
              // ignore: unawaited_futures
              filesProvider.loadFiles(folderId: null, force: true);
            }
          }
        }
      } catch (_) {
        filesProvider?.loadFiles(folderId: filesProvider.currentFolderId, force: true);
      }

      // Mettre à jour le cache corbeille.
      try {
        await OfflineStorageService.setUserMeta(
          'trashFolders',
          _folders.map((f) => f.toJson()).toList(),
        );
      } catch (_) {}

      // Rafraîchir l'explorateur.
      try {
        filesProvider?.loadFiles(folderId: filesProvider.currentFolderId, force: true);
      } catch (_) {}

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
        _loadTrash();
      }
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
        await _apiService.deleteFile(fileId);
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
        await _apiService.deleteFolder(folderId);
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

    if (!mounted) return;

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
      int successCount = 0;
      int failCount = 0;

      // Supprimer définitivement tous les fichiers
      for (final file in _files) {
        try {
          await _apiService.deleteFile(file.id);
          successCount++;
        } catch (e) {
          failCount++;
        }
      }

      // Supprimer définitivement tous les dossiers
      for (final folder in _folders) {
        try {
          await _apiService.deleteFolder(folder.id);
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
        leading: const AppBackButton(fallbackLocation: '/dashboard'),
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
                          color: AppConstants.warningColor.withAlpha((0.15 * 255).round()),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.cloud_download, color: AppConstants.warningColor, size: 20),
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
                                  color: Colors.blue.withAlpha((0.1 * 255).round()),
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
                                  color: iconColor.withAlpha((0.1 * 255).round()),
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
