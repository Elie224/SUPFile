import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_player/video_player.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../utils/secure_logger.dart';
import '../../models/file.dart';
import '../../providers/files_provider.dart';

class PreviewScreen extends StatefulWidget {
  final String fileId;
  
  const PreviewScreen({super.key, required this.fileId});

  @override
  State<PreviewScreen> createState() => _PreviewScreenState();
}

class _PreviewScreenState extends State<PreviewScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  String? _error;
  FileItem? _file;
  String? _folderId;
  List<FileItem> _filesInFolder = [];
  int _currentFileIndex = -1;
  VideoPlayerController? _videoController;
  AudioPlayer? _audioPlayer;
  bool _isPlaying = false;

  @override
  void initState() {
    super.initState();
    _loadFile();
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _audioPlayer?.dispose();
    super.dispose();
  }

  Future<void> _loadFile() async {
    try {
      final filesProvider = Provider.of<FilesProvider>(context, listen: false);
      
      // Charger tous les fichiers du dossier courant
      final response = await _apiService.listFiles();
      if (response.statusCode == 200) {
        final items = response.data['data']['items'] ?? [];
        _filesInFolder = [];
        
        // Extraire les fichiers du dossier
        for (var item in items) {
          if (item['type'] == 'file' || item['folder_id'] != null) {
            final file = FileItem.fromJson(item);
            _filesInFolder.add(file);
            
            // Trouver le fichier courant et son index
            if (file.id == widget.fileId) {
              _file = file;
              _currentFileIndex = _filesInFolder.length - 1;
              _folderId = file.folderId;
            }
          }
        }
        
        // Si le fichier n'a pas été trouvé dans la liste, le charger directement
        if (_file == null) {
          for (var item in items) {
            if ((item['id']?.toString() ?? item['_id']?.toString()) == widget.fileId) {
              _file = FileItem.fromJson(item);
              _folderId = _file!.folderId;
              break;
            }
          }
          
          if (_file == null) {
            setState(() {
              _error = 'Fichier non trouvé';
              _isLoading = false;
            });
            return;
          }
        }
        
        setState(() {
          _isLoading = false;
        });
        _loadPreview();
      } else {
        setState(() {
          _error = 'Erreur lors du chargement';
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

  Future<void> _loadPreview() async {
    if (_file == null) return;

    try {
      if (_file!.isVideo) {
        // Construire l'URL de streaming
        final streamUrl = '${AppConstants.apiBaseUrl}/api/files/${_file!.id}/stream';
        _videoController = VideoPlayerController.networkUrl(Uri.parse(streamUrl));
        await _videoController!.initialize();
        setState(() {});
      } else if (_file!.isAudio) {
        _audioPlayer = AudioPlayer();
        // Construire l'URL de streaming
        final streamUrl = '${AppConstants.apiBaseUrl}/api/files/${_file!.id}/stream';
        await _audioPlayer!.play(UrlSource(streamUrl));
        setState(() {
          _isPlaying = true;
        });
      }
    } catch (e) {
      SecureLogger.error('Error loading preview', error: e);
      if (mounted) {
        setState(() {
          _error = 'Erreur lors du chargement: $e';
        });
      }
    }
  }

  /// Affiche les détails techniques (taille, date de modification, type MIME)
  void _showTechnicalDetails() {
    if (_file == null) return;
    final f = _file!;
    showModalBottomSheet(
      context: context,
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Détails techniques',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            _detailRow('Nom', f.name),
            _detailRow('Taille', f.formattedSize),
            _detailRow('Type MIME', f.mimeType ?? 'Non spécifié'),
            _detailRow(
              'Date de modification',
              f.updatedAt.toIso8601String().substring(0, 19).replaceFirst('T', ' '),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Expanded(
            child: Text(value, textAlign: TextAlign.end, style: const TextStyle(fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }

  /// Télécharge et sauvegarde le fichier sur l'appareil
  Future<void> _downloadFile() async {
    if (_file == null) return;
    
    try {
      // Demander les permissions de stockage
      if (Platform.isAndroid) {
        final status = await Permission.storage.request();
        if (!status.isGranted) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Permission de stockage refusée')),
            );
          }
          return;
        }
      }
      
      // Télécharger le fichier
      final response = await _apiService.downloadFile(_file!.id);
      if (response.statusCode == 200 && response.data is List<int>) {
        // Obtenir le répertoire de téléchargements
        Directory? directory;
        if (Platform.isAndroid) {
          directory = await getExternalStorageDirectory();
          directory = Directory('${directory?.path}/Download');
        } else if (Platform.isIOS) {
          directory = await getApplicationDocumentsDirectory();
        }
        
        if (directory == null) {
          throw Exception('Impossible d\'accéder au répertoire de téléchargement');
        }
        
        // Créer le répertoire s'il n'existe pas
        if (!await directory.exists()) {
          await directory.create(recursive: true);
        }
        
        // Sauvegarder le fichier
        final filePath = '${directory.path}/${_file!.name}';
        final file = File(filePath);
        await file.writeAsBytes(response.data);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Fichier sauvegardé: ${_file!.name}'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors du téléchargement: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
  
  /// Navigue vers le fichier précédent dans le dossier
  void _navigateToPrevious() {
    if (_currentFileIndex > 0 && _filesInFolder.isNotEmpty) {
      final previousFile = _filesInFolder[_currentFileIndex - 1];
      context.go('/preview/${previousFile.id}');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Premier fichier atteint')),
      );
    }
  }
  
  /// Navigue vers le fichier suivant dans le dossier
  void _navigateToNext() {
    if (_currentFileIndex >= 0 && _currentFileIndex < _filesInFolder.length - 1) {
      final nextFile = _filesInFolder[_currentFileIndex + 1];
      context.go('/preview/${nextFile.id}');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Dernier fichier atteint')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
          title: const Text('Chargement...'),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _file == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
          title: const Text('Erreur'),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(_error ?? 'Fichier non trouvé'),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: Text(_file!.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: _showTechnicalDetails,
            tooltip: 'Détails techniques',
          ),
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: _downloadFile,
            tooltip: 'Télécharger',
          ),
        ],
      ),
      body: _buildPreview(),
    );
  }

  Widget _buildPreview() {
    if (_file!.isImage) {
      return _buildImagePreview();
    } else if (_file!.isVideo) {
      return _buildVideoPreview();
    } else if (_file!.isAudio) {
      return _buildAudioPreview();
    } else if (_file!.isPdf) {
      return _buildPdfPreview();
    } else if (_file!.isText) {
      return _buildTextPreview();
    } else {
      return _buildUnsupportedPreview();
    }
  }

  Widget _buildImagePreview() {
    final imageUrl = '${AppConstants.apiBaseUrl}/api/files/${_file!.id}/preview';
    return Center(
      child: InteractiveViewer(
        child: CachedNetworkImage(
          imageUrl: imageUrl,
          placeholder: (context, url) => const CircularProgressIndicator(),
          errorWidget: (context, url, error) => Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text('Erreur: $error'),
            ],
          ),
          fit: BoxFit.contain,
        ),
      ),
    );
  }

  Widget _buildVideoPreview() {
    return Center(
      child: _videoController != null && _videoController!.value.isInitialized
          ? Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AspectRatio(
                  aspectRatio: _videoController!.value.aspectRatio,
                  child: VideoPlayer(_videoController!),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      icon: Icon(_videoController!.value.isPlaying ? Icons.pause : Icons.play_arrow),
                      onPressed: () {
                        setState(() {
                          if (_videoController!.value.isPlaying) {
                            _videoController!.pause();
                          } else {
                            _videoController!.play();
                          }
                        });
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.stop),
                      onPressed: () {
                        setState(() {
                          _videoController!.pause();
                          _videoController!.seekTo(Duration.zero);
                        });
                      },
                    ),
                  ],
                ),
              ],
            )
          : const CircularProgressIndicator(),
    );
  }

  Widget _buildAudioPreview() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.music_note, size: 100),
          const SizedBox(height: 32),
          Text(_file!.name, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('${_file!.formattedSize} • ${_file!.mimeType ?? 'Audio'}'),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.skip_previous, size: 32),
                onPressed: _currentFileIndex > 0 ? _navigateToPrevious : null,
              ),
              ElevatedButton.icon(
                onPressed: () async {
                  if (_audioPlayer != null) {
                    if (_isPlaying) {
                      await _audioPlayer!.pause();
                    } else {
                      await _audioPlayer!.resume();
                    }
                    setState(() {
                      _isPlaying = !_isPlaying;
                    });
                  } else {
                    await _loadPreview();
                  }
                },
                icon: Icon(_isPlaying ? Icons.pause : Icons.play_arrow, size: 32),
                label: Text(_isPlaying ? 'Pause' : 'Lecture'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.skip_next, size: 32),
                onPressed: (_currentFileIndex >= 0 && _currentFileIndex < _filesInFolder.length - 1)
                    ? _navigateToNext
                    : null,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPdfPreview() {
    final pdfUrl = '${AppConstants.apiBaseUrl}/api/files/${_file!.id}/stream';
    return SfPdfViewer.network(pdfUrl);
  }

  Widget _buildTextPreview() {
    return FutureBuilder(
      future: _apiService.previewFile(_file!.id),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 64, color: Colors.red),
                const SizedBox(height: 16),
                Text('Erreur: ${snapshot.error}'),
              ],
            ),
          );
        }
        final textContent = snapshot.data?.data['content'] ?? 
                           snapshot.data?.data.toString() ?? 
                           'Contenu non disponible';
        return Padding(
          padding: const EdgeInsets.all(16.0),
          child: SingleChildScrollView(
            child: SelectableText(
              textContent,
              style: const TextStyle(fontFamily: 'monospace'),
            ),
          ),
        );
      },
    );
  }

  Widget _buildUnsupportedPreview() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.insert_drive_file, size: 100),
          const SizedBox(height: 16),
          Text(_file!.name),
          const SizedBox(height: 8),
          Text('Type: ${_file!.mimeType ?? 'Inconnu'}'),
          const SizedBox(height: 8),
          Text('Taille: ${_file!.formattedSize}'),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: _downloadFile,
            icon: const Icon(Icons.download),
            label: const Text('Télécharger'),
          ),
        ],
      ),
    );
  }
}
