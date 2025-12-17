import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../providers/files_provider.dart';
import '../../models/file.dart';
import '../../models/folder.dart';

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

  @override
  void initState() {
    super.initState();
    _loadTrash();
  }

  Future<void> _loadTrash() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final filesResponse = await _apiService.listTrashFiles();
      final foldersResponse = await _apiService.listTrashFolders();

      if (filesResponse.statusCode == 200 && foldersResponse.statusCode == 200) {
        setState(() {
          _files = (filesResponse.data['data']['items'] ?? [])
              .map((item) => FileItem.fromJson(item))
              .toList()
              .cast<FileItem>();
          
          _folders = (foldersResponse.data['data']['items'] ?? [])
              .map((item) => FolderItem.fromJson(item))
              .toList()
              .cast<FolderItem>();
          
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
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
              : _files.isEmpty && _folders.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.delete_outline, size: 64, color: Colors.grey),
                          const SizedBox(height: 16),
                          const Text('Corbeille vide'),
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
    );
  }
}
