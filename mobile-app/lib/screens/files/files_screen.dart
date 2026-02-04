import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import '../../providers/files_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/file.dart';
import '../../models/folder.dart';
import '../../utils/constants.dart';
import '../../utils/input_validator.dart';
import '../../services/sync_service.dart';
import '../../utils/performance_cache.dart';
import '../../widgets/offline_banner.dart';
import '../../widgets/sync_indicator.dart';
import '../../widgets/app_back_button.dart';
import '../../utils/storage_paths.dart';
import '../../utils/web_download.dart';

class FilesScreen extends StatefulWidget {
  final String? folderId;
  
  const FilesScreen({super.key, this.folderId});

  @override
  State<FilesScreen> createState() => _FilesScreenState();
}

class _FilesScreenState extends State<FilesScreen> {
  final ApiService _apiService = ApiService();
  List<FolderItem> _breadcrumbs = [];
  String? _sortBy; // 'name', 'size', 'modified'
  bool _sortAscending = true;

  bool get _dragDropEnabled {
    if (kIsWeb) return true;
    return Platform.isWindows || Platform.isLinux || Platform.isMacOS;
  }

  String _safeZipName(String folderName) {
    final trimmed = folderName.trim().isEmpty ? 'dossier' : folderName.trim();
    // Android is permissive, but sanitize common forbidden characters.
    final sanitized = trimmed.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
    return sanitized.endsWith('.zip') ? sanitized : '$sanitized.zip';
  }
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<FilesProvider>(context, listen: false)
          .loadFiles(folderId: widget.folderId);
      _loadBreadcrumbs();
    });
  }
  
  Future<void> _loadBreadcrumbs() async {
    if (widget.folderId == null) {
      setState(() {
        _breadcrumbs = [];
      });
      return;
    }

    try {
      // Charger le dossier courant et remonter la hiérarchie
      final response = await _apiService.getFolder(widget.folderId!);
      if (response.statusCode == 200) {
        final folderData = response.data['data'];
        List<FolderItem> breadcrumbs = [];
        
        // Construire le chemin en remontant les parents
        FolderItem? currentFolder = FolderItem.fromJson(folderData);
        while (currentFolder != null && currentFolder.parentId != null) {
          try {
            final parentResponse = await _apiService.getFolder(currentFolder.parentId!);
            if (parentResponse.statusCode == 200) {
              final parentData = parentResponse.data['data'];
              final parentFolder = FolderItem.fromJson(parentData);
              breadcrumbs.insert(0, parentFolder);
              currentFolder = parentFolder;
            } else {
              break;
            }
          } catch (e) {
            break;
          }
        }
        
        setState(() {
          _breadcrumbs = breadcrumbs;
        });
      }
    } catch (e) {
      // En cas d'erreur, garder les breadcrumbs vides
      setState(() {
        _breadcrumbs = [];
      });
    }
  }

  void _openImageGallery(FileItem imageFile) {
    final filesProvider = Provider.of<FilesProvider>(context, listen: false);
    
    // Récupérer toutes les images du dossier courant
    final images = filesProvider.allItems
        .where((item) => item['type'] == 'file')
        .map((item) => item['item'] as FileItem)
        .where((file) => file.isImage)
        .toList();
    
    if (images.isEmpty) {
      // Aucune autre image, ouvrir juste la prévisualisation
      context.push('/preview/${imageFile.id}');
      return;
    }
    
    // Trouver l'index de l'image actuelle
    final index = images.indexWhere((img) => img.id == imageFile.id);
    final initialIndex = index >= 0 ? index : 0;
    
    // Ouvrir la galerie avec toutes les images
    context.push(
      '/gallery?index=$initialIndex',
      extra: images.map((img) => img.toJson()).toList(),
    );
  }

  Future<void> _downloadFile(FileItem file) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      try {
        final response = await _apiService.downloadFile(file.id);

        if (response.statusCode == 200) {
          String? filePath;
          if (kIsWeb) {
            final bytes = (response.data as List<int>);
            await WebDownload.saveBytesAsFile(
              bytes: bytes,
              fileName: file.name,
              mimeType: file.mimeType ?? 'application/octet-stream',
            );
          } else {
            final directory = await StoragePaths.getWritableDirectory();
            filePath = '${directory.path}${Platform.pathSeparator}${file.name}';
            final savedFile = File(filePath);
            await savedFile.create(recursive: true);
            await savedFile.writeAsBytes(response.data);
          }

          if (mounted) {
            Navigator.pop(context); // Fermer le dialogue
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(kIsWeb ? 'Téléchargement démarré' : 'Fichier sauvegardé: ${filePath ?? ''}'),
                backgroundColor: Colors.green,
              ),
            );
          }
        } else {
          throw Exception('Erreur téléchargement (code: ${response.statusCode ?? '??'})');
        }
      } catch (e) {
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erreur: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
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

  Future<void> _downloadFolderZip(FolderItem folder) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => const Center(child: CircularProgressIndicator()),
      );

      try {
        final response = await _apiService.downloadFolderZip(folder.id);

        if (response.statusCode == 200 && response.data != null) {
          final zipName = _safeZipName(folder.name);
          String? filePath;
          if (kIsWeb) {
            await WebDownload.saveBytesAsFile(
              bytes: response.data!,
              fileName: zipName,
              mimeType: 'application/zip',
            );
          } else {
            final directory = await StoragePaths.getWritableDirectory();
            filePath = '${directory.path}${Platform.pathSeparator}$zipName';
            final savedFile = File(filePath);
            await savedFile.create(recursive: true);
            await savedFile.writeAsBytes(response.data!);
          }

          if (!mounted) return;
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(kIsWeb ? 'Téléchargement ZIP démarré' : 'ZIP sauvegardé: ${filePath ?? ''}'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          throw Exception('Erreur téléchargement ZIP (code: ${response.statusCode ?? '??'})');
        }
      } catch (e) {
        if (!mounted) return;
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur ZIP: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
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

  @override
  Widget build(BuildContext context) {
    final filesProvider = Provider.of<FilesProvider>(context);

    return Scaffold(
      appBar: AppBar(
        leading: const AppBackButton(fallbackLocation: '/dashboard'),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Fichiers'),
            if (_breadcrumbs.isNotEmpty || widget.folderId != null)
              Text(
                widget.folderId != null ? 'Dossier' : 'Racine',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Corbeille',
            onPressed: () => context.push('/trash'),
          ),
          // Bouton de tri
            PopupMenuButton<String>(
            icon: const Icon(Icons.sort),
            tooltip: 'Trier',
            onSelected: (value) {
              setState(() {
                if (value == 'clear') {
                  _sortBy = null;
                  _sortAscending = true;
                } else if (_sortBy == value) {
                  _sortAscending = !_sortAscending;
                } else {
                  _sortBy = value;
                  _sortAscending = true;
                }
              });
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'name',
                child: Row(
                  children: [
                    if (_sortBy == 'name')
                      Icon(_sortAscending ? Icons.arrow_upward : Icons.arrow_downward, size: 16),
                    const SizedBox(width: 8),
                    const Text('Nom'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'size',
                child: Row(
                  children: [
                    if (_sortBy == 'size')
                      Icon(_sortAscending ? Icons.arrow_upward : Icons.arrow_downward, size: 16),
                    const SizedBox(width: 8),
                    const Text('Taille'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'modified',
                child: Row(
                  children: [
                    if (_sortBy == 'modified')
                      Icon(_sortAscending ? Icons.arrow_upward : Icons.arrow_downward, size: 16),
                    const SizedBox(width: 8),
                    const Text('Date de modification'),
                  ],
                ),
              ),
              if (_sortBy != null) ...[
                const PopupMenuDivider(),
                const PopupMenuItem(
                  value: 'clear',
                  child: Text('Annuler le tri'),
                ),
              ],
            ],
          ),
          IconButton(
            icon: const Icon(Icons.create_new_folder),
            tooltip: 'Nouveau dossier',
            onPressed: () => _showCreateFolderDialog(context),
          ),
          IconButton(
            icon: const Icon(Icons.cloud_upload),
            tooltip: 'Téléverser un fichier',
            onPressed: () => _pickAndUploadFile(context),
          ),
        ],
      ),
      body: Consumer<SyncService>(
        builder: (context, sync, _) {
          return Column(
            children: [
              sync.isOnline ? const SizedBox.shrink() : const OfflineBanner(),
              if (_breadcrumbs.isNotEmpty || widget.folderId != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    border: Border(
                      bottom: BorderSide(
                        color: Colors.grey.shade300,
                        width: 1,
                      ),
                    ),
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        (_dragDropEnabled
                                ? DragTarget<_DragPayload>(
                                    onWillAcceptWithDetails: (details) => true,
                                    onAcceptWithDetails: (details) async {
                                      final data = details.data;
                                      final filesProvider = Provider.of<FilesProvider>(context, listen: false);
                                      if (data.isFolder) {
                                        await filesProvider.moveFolder(data.id, null);
                                      } else {
                                        await filesProvider.moveFile(data.id, null);
                                      }
                                      if (!context.mounted) return;
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text('"${data.name}" déplacé vers la racine'),
                                          backgroundColor: Colors.green,
                                          duration: const Duration(seconds: 2),
                                        ),
                                      );
                                    },
                                    builder: (context, candidateData, rejectedData) {
                                      final isHovering = candidateData.isNotEmpty;
                                      return DecoratedBox(
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(8),
                                          border: isHovering
                                              ? Border.all(color: AppConstants.supinfoPurple, width: 2)
                                              : null,
                                        ),
                                        child: InkWell(
                                          onTap: () => context.go('/files'),
                                          borderRadius: BorderRadius.circular(8),
                                          child: const Padding(
                                            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.home_outlined,
                                                    size: 18, color: AppConstants.supinfoPurple),
                                                SizedBox(width: 6),
                                                Text(
                                                  'Racine',
                                                  style: TextStyle(
                                                    fontWeight: FontWeight.w600,
                                                    color: AppConstants.supinfoPurple,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                                  )
                                : InkWell(
                                    onTap: () => context.go('/files'),
                                    borderRadius: BorderRadius.circular(8),
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.home_outlined,
                                              size: 18, color: AppConstants.supinfoPurple),
                                          SizedBox(width: 6),
                                          Text(
                                            'Racine',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w600,
                                              color: AppConstants.supinfoPurple,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  )),
                        ..._breadcrumbs.asMap().entries.map((entry) {
                          final index = entry.key;
                          final folder = entry.value;
                          final isLast = index == _breadcrumbs.length - 1;

                          return Row(
                            children: [
                              Icon(
                                Icons.chevron_right,
                                size: 18,
                                color: Colors.grey.shade600,
                              ),
                              const SizedBox(width: 4),
                              InkWell(
                                onTap: () => context.push('/files?folder=${folder.id}'),
                                borderRadius: BorderRadius.circular(8),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      if (isLast)
                                        Icon(Icons.folder, size: 18, color: Colors.amber.shade700)
                                      else
                                        Icon(Icons.folder_outlined, size: 18, color: Colors.grey.shade600),
                                      const SizedBox(width: 6),
                                      Text(
                                        folder.name,
                                        style: TextStyle(
                                          fontWeight: isLast ? FontWeight.w600 : FontWeight.normal,
                                          color: isLast ? Colors.black87 : Colors.grey.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          );
                        }),
                      ],
                    ),
                  ),
                ),
              Expanded(
                child: filesProvider.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : filesProvider.allItems.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.folder_open, size: 64, color: Colors.grey),
                                const SizedBox(height: 16),
                                Text(
                                  'Dossier vide',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Ce dossier est vide pour le moment',
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
                            onRefresh: () => filesProvider.loadFiles(folderId: widget.folderId),
                            child: _buildSortedList(filesProvider),
                          ),
              ),
              sync.pendingCount > 0
                  ? const Padding(
                      padding: EdgeInsets.only(bottom: 8),
                      child: SyncIndicator(),
                    )
                  : const SizedBox.shrink(),
            ],
          );
        },
      ),
    );
  }

  /// Construire la liste triée des items
  Widget _buildSortedList(FilesProvider filesProvider) {
    List<dynamic> items = List.from(filesProvider.allItems);
    
    // Trier les items selon _sortBy et _sortAscending
    if (_sortBy != null && items.isNotEmpty) {
      items.sort((a, b) {
        dynamic aItem = a['item'];
        dynamic bItem = b['item'];
        
        dynamic aValue, bValue;
        
        if (_sortBy == 'name') {
          aValue = aItem.name.toLowerCase();
          bValue = bItem.name.toLowerCase();
        } else if (_sortBy == 'size') {
          aValue = aItem is FileItem ? aItem.size : 0;
          bValue = bItem is FileItem ? bItem.size : 0;
        } else if (_sortBy == 'modified') {
          final aDate = aItem.updatedAt ?? aItem.createdAt;
          final bDate = bItem.updatedAt ?? bItem.createdAt;
          aValue = aDate != null ? DateTime.parse(aDate).millisecondsSinceEpoch : 0;
          bValue = bDate != null ? DateTime.parse(bDate).millisecondsSinceEpoch : 0;
        } else {
          return 0;
        }
        
        if (aValue == bValue) return 0;
        return _sortAscending 
            ? (aValue < bValue ? -1 : 1)
            : (aValue > bValue ? -1 : 1);
      });
    }
    
    return ListView.builder(
      itemCount: items.length,
      cacheExtent: 500,
      addAutomaticKeepAlives: false,
      addRepaintBoundaries: true,
      itemExtent: 72.0,
      itemBuilder: (context, index) {
        if (index < 0 || index >= items.length) {
          return const SizedBox.shrink();
        }

        final item = items[index];
        if (item is! Map<String, dynamic> ||
            item['type'] == null ||
            item['item'] == null) {
          return const SizedBox.shrink();
        }

        return RepaintBoundary(
          key: ValueKey("${item['type']}_${item['item'].id}"),
          child: item['type'] == 'folder'
              ? _buildFolderItem(item['item'] as FolderItem)
              : _buildFileItem(item['item'] as FileItem),
        );
      },
    );
  }

  Widget _buildFolderItem(FolderItem folder) {
    final dragPayload = _DragPayload(id: folder.id, name: folder.name, isFolder: true);

    Widget leading = Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            AppConstants.supinfoPurple,
            AppConstants.supinfoPurpleLight,
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppConstants.supinfoPurple.withAlpha((0.3 * 255).round()),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: const Icon(
        Icons.folder,
        color: AppConstants.supinfoWhite,
        size: 24,
      ),
    );

    if (_dragDropEnabled) {
      leading = Draggable<_DragPayload>(
        data: dragPayload,
        feedback: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha((0.2 * 255).round()),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.folder, color: AppConstants.supinfoPurple),
                const SizedBox(width: 8),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 240),
                  child: Text(
                    folder.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ),
        childWhenDragging: Opacity(opacity: 0.45, child: leading),
        child: leading,
      );
    }

    final tile = RepaintBoundary(
      key: ValueKey('folder_${folder.id}'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha((0.05 * 255).round()),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: leading,
          title: Row(
            children: [
              Expanded(
                child: Text(
                  folder.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (folder.sharedWithMe)
                Container(
                  margin: const EdgeInsets.only(left: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Partagé avec moi',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.blue.shade800,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
            ],
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              children: [
                Icon(Icons.folder_outlined, size: 14, color: Colors.grey[600]),
                const SizedBox(width: 4),
                const Text(
                  'Dossier',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
          onTap: () => context.push('/files?folder=${folder.id}'),
          trailing: PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: AppConstants.supinfoPurple),
            itemBuilder: (context) => const [
              PopupMenuItem(
                value: 'share',
                child: Row(
                  children: [
                    Icon(Icons.share, size: 20),
                    SizedBox(width: 8),
                    Text('Partager'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'download_zip',
                child: Row(
                  children: [
                    Icon(Icons.download, size: 20),
                    SizedBox(width: 8),
                    Text('Télécharger (ZIP)'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'move',
                child: Row(
                  children: [
                    Icon(Icons.drive_file_move, size: 20),
                    SizedBox(width: 8),
                    Text('Déplacer'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'rename',
                child: Row(
                  children: [
                    Icon(Icons.edit, size: 20),
                    SizedBox(width: 8),
                    Text('Renommer'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, size: 20, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Supprimer', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
            onSelected: (value) async {
              if (value == 'share') {
                if (!mounted) return;
                context.push('/share?folder=${folder.id}');
              } else if (value == 'download_zip') {
                await _downloadFolderZip(folder);
              } else if (value == 'move') {
                _showMoveDialog(context, folder.id, folder.name, true);
              } else if (value == 'rename') {
                _showRenameDialog(context, folder.id, folder.name, true);
              } else if (value == 'delete') {
                _showDeleteDialog(context, folder.id, folder.name, true);
              }
            },
          ),
        ),
      ),
    );

    if (!_dragDropEnabled) return tile;

    return DragTarget<_DragPayload>(
      onWillAcceptWithDetails: (details) {
        final data = details.data;
        if (data.id == folder.id) return false;
        return true;
      },
      onAcceptWithDetails: (details) async {
        final data = details.data;
        final filesProvider = Provider.of<FilesProvider>(context, listen: false);
        if (data.isFolder) {
          await filesProvider.moveFolder(data.id, folder.id);
        } else {
          await filesProvider.moveFile(data.id, folder.id);
        }
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('"${data.name}" déplacé vers "${folder.name}"'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      },
      builder: (context, candidateData, rejectedData) {
        final isHovering = candidateData.isNotEmpty;
        if (!isHovering) return tile;
        return DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppConstants.supinfoPurple, width: 2),
          ),
          child: tile,
        );
      },
    );
  }

  Widget _buildFileItem(FileItem file) {
    // Utiliser RepaintBoundary pour isoler les repaints
    return RepaintBoundary(
      key: ValueKey('file_${file.id}'),
      child: _buildFileItemContent(file),
    );
  }
  
  Widget _buildFileItemContent(FileItem file) {
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

    final dragPayload = _DragPayload(id: file.id, name: file.name, isFolder: false);

    Widget leading = Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            iconColor,
            iconColor.withAlpha((0.7 * 255).round()),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: iconColor.withAlpha((0.3 * 255).round()),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Icon(icon, color: AppConstants.supinfoWhite, size: 24),
    );

    if (_dragDropEnabled) {
      leading = Draggable<_DragPayload>(
        data: dragPayload,
        feedback: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha((0.2 * 255).round()),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: iconColor),
                const SizedBox(width: 8),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 240),
                  child: Text(
                    file.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ),
        childWhenDragging: Opacity(opacity: 0.45, child: leading),
        child: leading,
      );
    }

    final tile = Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withAlpha((0.05 * 255).round()),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: leading,
        title: Text(
          file.name,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Row(
            children: [
              Icon(Icons.info_outline, size: 14, color: Colors.grey[600]),
              const SizedBox(width: 4),
              Text(
                '${file.formattedSize} • ${file.mimeType ?? 'Fichier'}',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
        onTap: () {
          // Si c'est une image, ouvrir la galerie si d'autres images sont présentes
          if (file.isImage) {
            _openImageGallery(file);
          } else {
            context.push('/preview/${file.id}');
          }
        },
        trailing: PopupMenuButton(
          icon: const Icon(
            Icons.more_vert,
            color: AppConstants.supinfoPurple,
          ),
          itemBuilder: (context) => [
            if (file.isImage)
            const PopupMenuItem(
              value: 'gallery',
              child: Row(
                children: [
                  Icon(Icons.photo_library, size: 20),
                  SizedBox(width: 8),
                  Text('Ouvrir en galerie'),
                ],
              ),
            ),
          const PopupMenuItem(
            value: 'share',
            child: Row(
              children: [
                Icon(Icons.share, size: 20),
                SizedBox(width: 8),
                Text('Partager'),
              ],
            ),
          ),
          const PopupMenuItem(
            value: 'download',
            child: Row(
              children: [
                Icon(Icons.download, size: 20),
                SizedBox(width: 8),
                Text('Télécharger'),
              ],
            ),
          ),
          const PopupMenuItem(
            value: 'move',
            child: Row(
              children: [
                Icon(Icons.drive_file_move, size: 20),
                SizedBox(width: 8),
                Text('Déplacer'),
              ],
            ),
          ),
          const PopupMenuItem(
            value: 'rename',
            child: Row(
              children: [
                Icon(Icons.edit, size: 20),
                SizedBox(width: 8),
                Text('Renommer'),
              ],
            ),
          ),
          const PopupMenuItem(
            value: 'delete',
            child: Row(
              children: [
                Icon(Icons.delete, size: 20, color: Colors.red),
                SizedBox(width: 8),
                Text('Supprimer', style: TextStyle(color: Colors.red)),
              ],
            ),
          ),
        ],
        onSelected: (value) async {
          if (value == 'gallery') {
            _openImageGallery(file);
          } else if (value == 'share') {
            context.push('/share?file=${file.id}');
          } else if (value == 'download') {
            await _downloadFile(file);
          } else if (value == 'move') {
            _showMoveDialog(context, file.id, file.name, false);
          } else if (value == 'rename') {
            _showRenameDialog(context, file.id, file.name, false);
          } else if (value == 'delete') {
            _showDeleteDialog(context, file.id, file.name, false);
          }
        },
        ),
      ),
    );

    return tile;
  }

  void _showCreateFolderDialog(BuildContext context) {
    final nameController = TextEditingController();
    bool isCreating = false;
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Nouveau dossier'),
          content: TextField(
            controller: nameController,
            enabled: !isCreating,
            decoration: const InputDecoration(
              labelText: 'Nom du dossier',
              border: OutlineInputBorder(),
              helperText: 'Caractères interdits: / \\ ? * : | " < >',
            ),
          ),
          actions: [
            TextButton(
              onPressed: isCreating ? null : () => Navigator.pop(context),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: isCreating ? null : () async {
                final name = InputValidator.sanitizeInput(nameController.text.trim());
                
                // Validation du nom
                if (name.isEmpty) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Le nom du dossier ne peut pas être vide')),
                    );
                  }
                  return;
                }
                
                if (!InputValidator.isValidFolderName(name)) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Nom invalide. Caractères interdits: / \\ ? * : | " < >'),
                        duration: Duration(seconds: 3),
                      ),
                    );
                  }
                  return;
                }
                
                // Vérifier les doublons
                final filesProvider = Provider.of<FilesProvider>(context, listen: false);
                final duplicate = filesProvider.allItems.any((item) {
                  if (item['type'] == 'folder') {
                    final folder = item['item'] as FolderItem;
                    return folder.name.toLowerCase() == name.toLowerCase();
                  }
                  return false;
                });
                
                if (duplicate) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Un dossier avec ce nom existe déjà'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                  }
                  return;
                }
                
                if (!context.mounted) return;
                
                setDialogState(() {
                  isCreating = true;
                });
                
                final success = await filesProvider.createFolder(name);
                
                if (context.mounted) {
                  if (success) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Dossier créé avec succès'),
                        backgroundColor: Colors.green,
                        duration: Duration(seconds: 2),
                      ),
                    );
                  } else {
                    setDialogState(() {
                      isCreating = false;
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(filesProvider.error ?? 'Erreur lors de la création du dossier'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              },
              child: isCreating
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Créer'),
            ),
          ],
        ),
      ),
    );
  }

  void _showRenameDialog(BuildContext context, String id, String currentName, bool isFolder) {
    final nameController = TextEditingController(text: currentName);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isFolder ? 'Renommer le dossier' : 'Renommer le fichier'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(
            labelText: 'Nouveau nom',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              final newName = nameController.text.trim();
              if (newName.isEmpty) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Le nom ne peut pas être vide'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                }
                return;
              }
              
              // Validation du nom
              if (!InputValidator.isValidFolderName(newName)) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Nom invalide. Caractères interdits: / \\ ? * : | " < >'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                }
                return;
              }
              
              final filesProvider = Provider.of<FilesProvider>(context, listen: false);
              final success = isFolder
                  ? await filesProvider.renameFolder(id, newName)
                  : await filesProvider.renameFile(id, newName);
              
              if (context.mounted) {
                Navigator.pop(context);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${isFolder ? "Dossier" : "Fichier"} renommé en "$newName"'),
                      backgroundColor: Colors.green,
                      duration: const Duration(seconds: 2),
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(filesProvider.error ?? 'Erreur lors du renommage'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('Renommer'),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context, String id, String name, bool isFolder) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer'),
        content: Text('Voulez-vous vraiment supprimer "$name" ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              final filesProvider = Provider.of<FilesProvider>(context, listen: false);
              final success = isFolder
                  ? await filesProvider.deleteFolder(id)
                  : await filesProvider.deleteFile(id);

              if (success) {
                // Les stats/quota dépendent du dashboard + /users/me.
                await PerformanceCache.remove('dashboard');
                if (context.mounted) {
                  await context.read<AuthProvider>().refreshUser();
                }
              }
              
              if (context.mounted) {
                Navigator.pop(context);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('"$name" a été supprimé et envoyé dans la corbeille'),
                      backgroundColor: Colors.green,
                      duration: const Duration(seconds: 2),
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(filesProvider.error ?? 'Erreur lors de la suppression'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }

  void _showMoveDialog(BuildContext context, String id, String name, bool isFolder) {
    final filesProvider = Provider.of<FilesProvider>(context, listen: false);
    String? selectedFolderId;
    List<FolderItem> availableFolders = [];
    bool isLoadingFolders = true;

    List<FolderItem> sortFoldersAsTree(List<FolderItem> folders) {
      final byParent = <String?, List<FolderItem>>{};
      for (final f in folders) {
        byParent.putIfAbsent(f.parentId, () => <FolderItem>[]).add(f);
      }

      for (final entry in byParent.entries) {
        entry.value.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
      }

      final result = <FolderItem>[];
      void dfs(String? parentId) {
        final children = byParent[parentId] ?? const <FolderItem>[];
        for (final child in children) {
          result.add(child);
          dfs(child.id);
        }
      }

      dfs(null);
      return result;
    }

    Map<String, int> computeDepths(List<FolderItem> folders) {
      final byId = <String, FolderItem>{for (final f in folders) f.id: f};
      final cache = <String, int>{};

      int depthOf(String id) {
        final cached = cache[id];
        if (cached != null) return cached;
        final f = byId[id];
        if (f == null) return 0;
        final pid = f.parentId;
        if (pid == null || pid.isEmpty || !byId.containsKey(pid)) {
          cache[id] = 0;
          return 0;
        }
        final d = 1 + depthOf(pid);
        cache[id] = d;
        return d;
      }

      for (final f in folders) {
        depthOf(f.id);
      }
      return cache;
    }

    Set<String> descendantsOf(String rootId, List<FolderItem> folders) {
      final childrenByParent = <String, List<String>>{};
      for (final f in folders) {
        final pid = f.parentId;
        if (pid == null || pid.isEmpty) continue;
        childrenByParent.putIfAbsent(pid, () => <String>[]).add(f.id);
      }

      final visited = <String>{rootId};
      final stack = <String>[rootId];
      while (stack.isNotEmpty) {
        final current = stack.removeLast();
        final kids = childrenByParent[current] ?? const <String>[];
        for (final k in kids) {
          if (visited.add(k)) {
            stack.add(k);
          }
        }
      }
      return visited;
    }
    
    // Charger les dossiers disponibles
    Future<void> loadAvailableFolders() async {
      try {
        List<Map<String, dynamic>> extractFolderMapsFromResponse(dynamic responseData) {
          if (responseData is! Map) return const <Map<String, dynamic>>[];
          final data = responseData['data'];

          // Backend endpoints used here return either:
          // - { data: [ ... ] } (flat list)
          // - { data: { items: [ ... ] } } (paginated)
          if (data is List) {
            return data
                .whereType<Map>()
                .map((m) => Map<String, dynamic>.from(m))
                .toList();
          }

          if (data is Map) {
            final items = data['items'];
            if (items is List) {
              return items
                  .whereType<Map>()
                  .map((m) => Map<String, dynamic>.from(m))
                  .toList();
            }
          }

          return const <Map<String, dynamic>>[];
        }

        // 1) Essayer l'endpoint optimisé /folders/all.
        final response = await _apiService.getAllFolders();
        if (response.statusCode == 200) {
          final items = extractFolderMapsFromResponse(response.data);
          availableFolders = items.map(FolderItem.fromJson).toList();
        }

        // 2) Fallback: si /folders/all ne renvoie rien, parcourir l'arborescence via /folders?parent_id.
        if (availableFolders.isEmpty) {
          final seen = <String>{};
          final queue = <String?>[null];
          final collected = <FolderItem>[];
          int safety = 0;
          while (queue.isNotEmpty && safety < 2000) {
            safety++;
            final parentId = queue.removeAt(0);
            final res = await _apiService.listFolders(parentId: parentId);
            if (res.statusCode != 200 || res.data is! Map) continue;
            final items = extractFolderMapsFromResponse(res.data);
            for (final it in items) {
              final folder = FolderItem.fromJson(it);
              if (seen.add(folder.id)) {
                collected.add(folder);
                queue.add(folder.id);
              }
            }
          }
          availableFolders = collected;
        }

        // Toujours filtrer les dossiers supprimés et trier.
        availableFolders = availableFolders.where((f) => f.id.isNotEmpty && f.name.isNotEmpty && !f.isDeleted).toList();
      } catch (e) {
        // En cas d'erreur, utiliser les dossiers déjà chargés
        availableFolders = filesProvider.folders;
      }
    }
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          if (isLoadingFolders) {
            loadAvailableFolders().then((_) {
              setDialogState(() {
                isLoadingFolders = false;
              });
            });
          }
          
          return AlertDialog(
            title: Text('Déplacer ${isFolder ? 'le dossier' : 'le fichier'}'),
            content: SizedBox(
              width: double.maxFinite,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Sélectionnez le dossier de destination pour "$name"'),
                  const SizedBox(height: 16),
                  if (isLoadingFolders)
                    const Center(child: CircularProgressIndicator())
                  else
                    Builder(builder: (context) {
                      final sorted = sortFoldersAsTree(availableFolders);
                      final depths = computeDepths(availableFolders);
                      final excluded = isFolder ? descendantsOf(id, availableFolders) : <String>{};

                      final options = sorted.where((folder) => !excluded.contains(folder.id)).toList();
                      return DropdownButtonFormField<String?>(
                        initialValue: selectedFolderId,
                        decoration: const InputDecoration(
                          labelText: 'Dossier de destination',
                          border: OutlineInputBorder(),
                        ),
                        items: [
                          const DropdownMenuItem(
                            value: null,
                            child: Row(
                              children: [
                                Icon(Icons.home, size: 20),
                                SizedBox(width: 8),
                                Text('Racine'),
                              ],
                            ),
                          ),
                          ...options.map((folder) {
                            final depth = depths[folder.id] ?? 0;
                            final indent = List.filled(depth, '   ').join();
                            return DropdownMenuItem(
                              value: folder.id,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.folder, size: 20, color: Colors.blue),
                                  const SizedBox(width: 8),
                                  Flexible(
                                    fit: FlexFit.loose,
                                    child: Text(
                                      '$indent${folder.name}',
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                        onChanged: (value) {
                          setDialogState(() {
                            selectedFolderId = value;
                          });
                        },
                      );
                    }),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Annuler'),
              ),
              ElevatedButton(
                onPressed: isLoadingFolders
                    ? null
                    : () async {
                        try {
                          if (isFolder) {
                            await filesProvider.moveFolder(id, selectedFolderId);
                          } else {
                            await filesProvider.moveFile(id, selectedFolderId);
                          }

                          if (!context.mounted) return;
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('"$name" déplacé'),
                              backgroundColor: Colors.green,
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        } catch (e) {
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Erreur déplacement: $e'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      },
                child: const Text('Déplacer'),
              ),
            ],
          );
        },
      ),
    );
  }

  /// Sélectionne et upload un ou plusieurs fichiers avec indicateur de progression
  Future<void> _pickAndUploadFile(BuildContext context) async {
    try {
      final filesProvider = Provider.of<FilesProvider>(context, listen: false);
      
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.any,
        // Web: prefer stream to avoid loading big videos in memory.
        withReadStream: kIsWeb,
      );

      if (!context.mounted) return;

      if (result != null && result.files.isNotEmpty) {
        final totalFiles = result.files.length;
        int currentFileIndex = 0;
        int successCount = 0;
        int failCount = 0;
        String? currentFileName;
        double currentProgress = 0.0;

        void Function(void Function())? setDialogStateRef;
        DateTime lastUiUpdate = DateTime.fromMillisecondsSinceEpoch(0);

        // Créer un dialogue de progression avec StatefulBuilder
        BuildContext? dialogContext;
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) {
            dialogContext = ctx;
            return StatefulBuilder(
              builder: (context, setDialogState) {
                setDialogStateRef = setDialogState;
                return AlertDialog(
                  title: const Text('Upload en cours'),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (currentFileName != null) ...[
                        Text(
                          'Fichier: $currentFileName',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                      ],
                      Text(
                        '${currentFileIndex + 1} / $totalFiles fichier(s)',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 16),
                      LinearProgressIndicator(
                        value: currentFileIndex < totalFiles
                            ? (currentFileIndex + currentProgress) / totalFiles
                            : 1.0,
                        backgroundColor: Colors.grey[300],
                        valueColor: AlwaysStoppedAnimation<Color>(
                          currentFileIndex < totalFiles
                              ? AppConstants.supinfoPurple
                              : Colors.green,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${((currentFileIndex + currentProgress) / totalFiles * 100).toStringAsFixed(0)}%',
                        style: TextStyle(
                          color: Colors.grey[700],
                          fontSize: 12,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );

        // Uploader chaque fichier avec progression
        for (final pickedFile in result.files) {
          if (!context.mounted) break;

          currentFileName = pickedFile.name;
          currentProgress = 0.0;
          setDialogStateRef?.call(() {});

          bool success = false;
          if (kIsWeb) {
            final stream = pickedFile.readStream;
            if (stream == null) {
              success = false;
            } else {
              success = await filesProvider.uploadFileStream(
                () => stream,
                pickedFile.size,
                pickedFile.name,
                folderId: widget.folderId,
                onProgress: (sent, total) {
                  if (!context.mounted || dialogContext == null) return;
                  currentProgress = total > 0 ? sent / total : 0.0;

                  final now = DateTime.now();
                  if (now.difference(lastUiUpdate) >= const Duration(milliseconds: 120)) {
                    lastUiUpdate = now;
                    setDialogStateRef?.call(() {});
                  }
                },
              );
            }
          } else {
            final path = pickedFile.path;
            if (path != null) {
              success = await filesProvider.uploadFile(
                path,
                folderId: widget.folderId,
                onProgress: (sent, total) {
                  if (!context.mounted || dialogContext == null) return;
                  currentProgress = total > 0 ? sent / total : 0.0;

                  final now = DateTime.now();
                  if (now.difference(lastUiUpdate) >= const Duration(milliseconds: 120)) {
                    lastUiUpdate = now;
                    setDialogStateRef?.call(() {});
                  }
                },
              );
            }
          }

          if (success) {
            successCount++;
          } else {
            failCount++;
          }

          currentFileIndex++;
          currentProgress = 1.0;
          setDialogStateRef?.call(() {});
        }

        // Invalider stats/quota une seule fois si au moins un upload a réussi.
        if (successCount > 0) {
          await PerformanceCache.remove('dashboard');
          if (context.mounted) {
            await context.read<AuthProvider>().refreshUser();
          }
        }

        if (context.mounted) {
          if (dialogContext != null) {
            Navigator.of(dialogContext!).pop();
          }
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                '$successCount fichier(s) uploadé(s)${failCount > 0 ? ', $failCount échec(s)' : ''}',
              ),
              backgroundColor: failCount > 0 ? Colors.orange : Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        // Fermer le dialogue s'il est encore ouvert (best-effort)
        if (Navigator.of(context).canPop()) {
          Navigator.pop(context);
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors de l\'upload: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }
}

class _DragPayload {
  final String id;
  final String name;
  final bool isFolder;

  const _DragPayload({
    required this.id,
    required this.name,
    required this.isFolder,
  });
}

