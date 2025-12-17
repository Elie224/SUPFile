import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../providers/files_provider.dart';
import '../../services/api_service.dart';
import '../../models/file.dart';
import '../../models/folder.dart';
import '../../utils/constants.dart';
import 'image_gallery_screen.dart';

class FilesScreen extends StatefulWidget {
  final String? folderId;
  
  const FilesScreen({super.key, this.folderId});

  @override
  State<FilesScreen> createState() => _FilesScreenState();
}

class _FilesScreenState extends State<FilesScreen> {
  final ApiService _apiService = ApiService();
  List<FolderItem> _breadcrumbs = [];
  
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
      context.go('/preview/${imageFile.id}');
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
      // Demander la permission de stockage
      if (await Permission.storage.request().isGranted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => const Center(child: CircularProgressIndicator()),
        );

        try {
          final response = await _apiService.downloadFile(file.id);
          
          if (response.statusCode == 200) {
            final directory = await getExternalStorageDirectory();
            if (directory != null) {
              final filePath = '${directory.path}/Download/${file.name}';
              final savedFile = File(filePath);
              await savedFile.create(recursive: true);
              await savedFile.writeAsBytes(response.data);
              
              if (mounted) {
                Navigator.pop(context); // Fermer le dialogue
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Fichier téléchargé: $filePath'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
            }
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
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Permission de stockage refusée'),
            backgroundColor: Colors.red,
          ),
        );
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

  @override
  Widget build(BuildContext context) {
    final filesProvider = Provider.of<FilesProvider>(context);

    return Scaffold(
      appBar: AppBar(
        leading: widget.folderId != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => context.pop(),
              )
            : null,
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
      body: Column(
        children: [
          // Breadcrumbs (Fil d'Ariane)
          if (_breadcrumbs.isNotEmpty || widget.folderId != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Theme.of(context).colorScheme.surfaceVariant,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    InkWell(
                      onTap: () => context.go('/files'),
                      child: Row(
                        children: [
                          const Icon(Icons.home, size: 16),
                          const SizedBox(width: 4),
                          const Text('Racine'),
                        ],
                      ),
                    ),
                    ..._breadcrumbs.map((folder) => Row(
                      children: [
                        const Icon(Icons.chevron_right, size: 16),
                        InkWell(
                          onTap: () => context.go('/files?folder=${folder.id}'),
                          child: Text(folder.name),
                        ),
                      ],
                    )),
                  ],
                ),
              ),
            ),
          // Liste des fichiers
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
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => filesProvider.loadFiles(folderId: widget.folderId),
                  child: ListView.builder(
                    itemCount: filesProvider.allItems.length,
                    // Optimisations de performance
                    cacheExtent: 500, // Cache étendu pour scroll fluide
                    addAutomaticKeepAlives: false, // Ne pas garder les widgets hors écran
                    addRepaintBoundaries: true, // Isoler les repaints
                    itemExtent: 72.0, // Hauteur fixe pour meilleure performance
                    itemBuilder: (context, index) {
                      // Validation de l'index pour éviter out of bounds
                      if (index < 0 || index >= filesProvider.allItems.length) {
                        return const SizedBox.shrink();
                      }
                      
                      final item = filesProvider.allItems[index];
                      
                      // Validation de la structure de l'item
                      if (item is! Map<String, dynamic> || 
                          item['type'] == null || 
                          item['item'] == null) {
                        return const SizedBox.shrink();
                      }
                      
                      // Utiliser RepaintBoundary pour isoler les repaints
                      return RepaintBoundary(
                        key: ValueKey('${item['type']}_${item['item'].id}'),
                        child: item['type'] == 'folder'
                            ? _buildFolderItem(item['item'] as FolderItem)
                            : _buildFileItem(item['item'] as FileItem),
                      );
                    },
                  ),
                ),
            ),
        ],
      ),
    );
  }

  Widget _buildFolderItem(FolderItem folder) {
    // Utiliser RepaintBoundary pour isoler les repaints
    return RepaintBoundary(
      key: ValueKey('folder_${folder.id}'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppConstants.supinfoPurple,
                  AppConstants.supinfoPurpleLight,
                ],
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppConstants.supinfoPurple.withOpacity(0.3),
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
          ),
          title: Text(
            folder.name,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 16,
            ),
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
          onTap: () {
            context.go('/files?folder=${folder.id}');
          },
      trailing: PopupMenuButton(
        itemBuilder: (context) => [
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
                Text('Télécharger (ZIP)'),
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
          if (value == 'share') {
            context.go('/share?folder=${folder.id}');
          } else if (value == 'download') {
            await _downloadFolder(folder.id);
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

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                iconColor,
                iconColor.withOpacity(0.7),
              ],
            ),
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: iconColor.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Icon(icon, color: AppConstants.supinfoWhite, size: 24),
        ),
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
            context.go('/preview/${file.id}');
          }
        },
        trailing: PopupMenuButton(
          icon: Icon(
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
            context.go('/share?file=${file.id}');
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
  }

  void _showCreateFolderDialog(BuildContext context) {
    final nameController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nouveau dossier'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(
            labelText: 'Nom du dossier',
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
              final name = nameController.text.trim();
              if (name.isEmpty) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Le nom du dossier ne peut pas être vide')),
                  );
                }
                return;
              }
              
              // Validation du nom
              if (name.length > 255) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Le nom du dossier est trop long (max 255 caractères)')),
                  );
                }
                return;
              }
              
              if (!context.mounted) return;
              
              final filesProvider = Provider.of<FilesProvider>(context, listen: false);
              final success = await filesProvider.createFolder(name);
              
              if (context.mounted) {
                if (success) {
                  Navigator.pop(context);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(filesProvider.error ?? 'Erreur lors de la création du dossier'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('Créer'),
          ),
        ],
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
              if (nameController.text.isNotEmpty) {
                final filesProvider = Provider.of<FilesProvider>(context, listen: false);
                if (isFolder) {
                  await filesProvider.renameFolder(id, nameController.text);
                } else {
                  await filesProvider.renameFile(id, nameController.text);
                }
                if (context.mounted) {
                  Navigator.pop(context);
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
              if (isFolder) {
                await filesProvider.deleteFolder(id);
              } else {
                await filesProvider.deleteFile(id);
              }
              if (context.mounted) {
                Navigator.pop(context);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }

  Future<void> _downloadFolder(String folderId) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      try {
        final filesProvider = Provider.of<FilesProvider>(context, listen: false);
        final response = await filesProvider.downloadFolder(folderId);
        
        if (response.statusCode == 200) {
          final directory = await getExternalStorageDirectory();
          if (directory != null) {
            final folderName = 'folder_$folderId.zip';
            final filePath = '${directory.path}/Download/$folderName';
            final savedFile = File(filePath);
            await savedFile.create(recursive: true);
            await savedFile.writeAsBytes(response.data);
            
            if (mounted) {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Dossier téléchargé: $filePath'),
                  backgroundColor: Colors.green,
                ),
              );
            }
          }
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

  void _showMoveDialog(BuildContext context, String id, String name, bool isFolder) {
    final filesProvider = Provider.of<FilesProvider>(context, listen: false);
    String? selectedFolderId;
    List<FolderItem> availableFolders = [];
    bool isLoadingFolders = true;
    
    // Charger les dossiers disponibles
    Future<void> loadAvailableFolders() async {
      try {
        final response = await _apiService.getAllFolders();
        if (response.statusCode == 200) {
          final items = response.data['data']['items'] ?? [];
          availableFolders = items
              .where((item) => item['type'] == 'folder' || item['folder_id'] == null)
              .map((item) => FolderItem.fromJson(item))
              .toList()
              .cast<FolderItem>();
        }
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
                    DropdownButtonFormField<String>(
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
                        ...availableFolders
                            .where((folder) => folder.id != id) // Exclure le dossier courant
                            .map((folder) => DropdownMenuItem(
                                  value: folder.id,
                                  child: Row(
                                    children: [
                                      const Icon(Icons.folder, size: 20, color: Colors.blue),
                                      const SizedBox(width: 8),
                                      Expanded(child: Text(folder.name)),
                                    ],
                                  ),
                                )),
                      ],
                      onChanged: (value) {
                        setDialogState(() {
                          selectedFolderId = value;
                        });
                      },
                    ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Annuler'),
              ),
              ElevatedButton(
                onPressed: selectedFolderId == null && isLoadingFolders
                    ? null
                    : () async {
                        if (isFolder) {
                          await filesProvider.moveFolder(id, selectedFolderId);
                        } else {
                          await filesProvider.moveFile(id, selectedFolderId);
                        }
                        if (context.mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Élément déplacé avec succès'),
                              backgroundColor: Colors.green,
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

  Future<void> _pickAndUploadFile(BuildContext context) async {
    try {
      final filesProvider = Provider.of<FilesProvider>(context, listen: false);
      
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.custom,
        allowedExtensions: null, // Permet tous les types de fichiers
      );

      if (result != null && result.files.isNotEmpty) {
        // Afficher un dialogue de progression
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => const Center(child: CircularProgressIndicator()),
        );

        int successCount = 0;
        int failCount = 0;

        for (var file in result.files) {
          if (file.path != null) {
            final filePath = File(file.path!);
            final success = await filesProvider.uploadFile(
              filePath.path,
              folderId: widget.folderId,
              onProgress: (sent, total) {
                // TODO: Afficher la progression pour chaque fichier
              },
            );
            
            if (success) {
              successCount++;
            } else {
              failCount++;
            }
          }
        }

        if (context.mounted) {
          Navigator.pop(context); // Fermer le dialogue de progression
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                '$successCount fichier(s) uploadé(s)${failCount > 0 ? ', $failCount échec(s)' : ''}',
              ),
              backgroundColor: failCount > 0 ? Colors.orange : Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors de l\'upload: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

