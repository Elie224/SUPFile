import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../utils/secure_logger.dart';
import '../../utils/secure_storage.dart';
import '../../models/file.dart';
import '../../widgets/app_back_button.dart';
import '../../widgets/responsive_center.dart';

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

  Map<String, String> _authHeaders = const {};
  Uint8List? _pdfBytes;
  Uint8List? _imageBytes;
  String? _textContent;

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
      // 1) Charger les métadonnées du fichier (requête authentifiée + refresh auto)
      final fileRes = await _apiService.getFile(widget.fileId);
      if (fileRes.statusCode != 200) {
        setState(() {
          _error = 'Erreur lors du chargement (code: ${fileRes.statusCode ?? '??'})';
          _isLoading = false;
        });
        return;
      }

      final fileData = (fileRes.data is Map && (fileRes.data as Map)['data'] is Map)
          ? Map<String, dynamic>.from((fileRes.data as Map)['data'] as Map)
          : null;
      if (fileData == null) {
        setState(() {
          _error = 'Réponse serveur invalide';
          _isLoading = false;
        });
        return;
      }

      _file = FileItem.fromJson(fileData);
      _folderId = _file!.folderId;

      // 2) Préparer les headers Authorization pour les widgets réseau (image/video)
      final token = await SecureStorage.getAccessToken();
      _authHeaders = token != null ? <String, String>{'Authorization': 'Bearer $token'} : const {};

      // 3) Charger les fichiers du même dossier pour navigation précédent/suivant
      final listRes = await _apiService.listFiles(folderId: _folderId);
      if (listRes.statusCode == 200) {
        final items = (listRes.data is Map && (listRes.data as Map)['data'] is Map)
            ? (((listRes.data as Map)['data'] as Map)['items'] as List? ?? const [])
            : const [];
        _filesInFolder = [];
        for (final item in items) {
          if (item is! Map) continue;
          final map = Map<String, dynamic>.from(item);
          final type = map['type']?.toString();
          if (type == 'file') {
            final f = FileItem.fromJson(map);
            _filesInFolder.add(f);
          }
        }
        _currentFileIndex = _filesInFolder.indexWhere((f) => f.id == widget.fileId);
      }

      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
      _loadPreview();
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
      // Preview binaire (image/PDF/texte) via /preview
      if (_file!.isImage || _file!.isPdf || _file!.isText) {
        final res = await _apiService.previewFileBytes(_file!.id, size: 'large');
        final code = res.statusCode ?? 0;
        if (code != 200 || res.data == null) {
          throw Exception('Impossible de charger le preview (code: $code)');
        }

        final bytes = Uint8List.fromList(res.data!);
        if (_file!.isImage) {
          _imageBytes = bytes;
        } else if (_file!.isPdf) {
          _pdfBytes = bytes;
        } else if (_file!.isText) {
          _textContent = utf8.decode(bytes, allowMalformed: true);
        }

        if (mounted) setState(() {});
        return;
      }

      // Audio/Vidéo: streaming via /stream
      if (_file!.isVideo) {
        // Construire l'URL de streaming
        final streamUrl = '${AppConstants.apiBaseUrl}/api/files/${_file!.id}/stream';
        _videoController = VideoPlayerController.networkUrl(
          Uri.parse(streamUrl),
          httpHeaders: _authHeaders,
        );
        await _videoController!.initialize();
        setState(() {});
      } else if (_file!.isAudio) {
        _audioPlayer = AudioPlayer();
        // Télécharger le flux en local pour éviter les 401 (UrlSource ne supporte pas toujours les headers)
        final bytesRes = await _apiService.streamFileBytes(_file!.id);
        final code = bytesRes.statusCode ?? 0;
        if (code == 200 && bytesRes.data != null) {
          final dir = await getTemporaryDirectory();
          final path = '${dir.path}${Platform.pathSeparator}${_file!.name}';
          final out = File(path);
          await out.writeAsBytes(bytesRes.data!);
          await _audioPlayer!.play(DeviceFileSource(out.path));
        } else {
          throw Exception('Impossible de charger le flux audio (code: $code)');
        }
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
      // Télécharger le fichier
      final response = await _apiService.downloadFile(_file!.id);
      if (response.statusCode == 200 && response.data is List<int>) {
        // Enregistrer dans un dossier app-specific (pas de permission requise)
        Directory? directory;
        if (Platform.isAndroid) {
          directory = await getExternalStorageDirectory();
        } else {
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
              content: Text('Fichier sauvegardé: $filePath'),
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
      context.push('/preview/${previousFile.id}');
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
      context.push('/preview/${nextFile.id}');
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
          leading: const AppBackButton(fallbackLocation: '/files'),
          title: const Text('Chargement...'),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _file == null) {
      return Scaffold(
        appBar: AppBar(
          leading: const AppBackButton(fallbackLocation: '/files'),
          title: const Text('Erreur'),
        ),
        body: ResponsiveCenter(
          maxWidth: 560,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                _error ?? 'Fichier non trouvé',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: const AppBackButton(fallbackLocation: '/files'),
        title: Text(_file!.name),
        actions: [
          if (_canOpenFullscreen)
            IconButton(
              icon: const Icon(Icons.fullscreen),
              onPressed: _openFullscreen,
              tooltip: 'Plein écran',
            ),
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
      body: ResponsiveCenter(
        maxWidth: 980,
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: _buildPreview(),
      ),
    );
  }

  bool get _canOpenFullscreen {
    if (_file == null) return false;
    if (_file!.isImage) return _imageBytes != null && _imageBytes!.isNotEmpty;
    if (_file!.isPdf) return _pdfBytes != null && _pdfBytes!.isNotEmpty;
    if (_file!.isVideo) return _videoController != null && _videoController!.value.isInitialized;
    return false;
  }

  void _openFullscreen() {
    if (_file == null) return;

    if (_file!.isImage && _imageBytes != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => FullscreenImageScreen(bytes: _imageBytes!, title: _file!.name),
        ),
      );
      return;
    }

    if (_file!.isPdf && _pdfBytes != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => FullscreenPdfScreen(bytes: _pdfBytes!, title: _file!.name),
        ),
      );
      return;
    }

    if (_file!.isVideo && _videoController != null && _videoController!.value.isInitialized) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => FullscreenVideoScreen(controller: _videoController!, title: _file!.name),
        ),
      );
    }
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
    if (_imageBytes == null || _imageBytes!.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return Center(
      child: InteractiveViewer(
        child: Image.memory(
          _imageBytes!,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) => Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text('Erreur: $error'),
            ],
          ),
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
    if (_pdfBytes == null) {
      return const Center(child: CircularProgressIndicator());
    }
    return Stack(
      children: [
        SfPdfViewer.memory(_pdfBytes!),
        // Petit rappel accessible (en plus du bouton AppBar)
        Positioned(
          right: 8,
          top: 8,
          child: Material(
            color: Colors.black.withValues(alpha: 0.45),
            borderRadius: BorderRadius.circular(999),
            child: IconButton(
              icon: const Icon(Icons.fullscreen, color: Colors.white),
              onPressed: _canOpenFullscreen ? _openFullscreen : null,
              tooltip: 'Plein écran',
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextPreview() {
    final text = _textContent;
    if (text == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: SingleChildScrollView(
        child: SelectableText(
          text,
          style: const TextStyle(fontFamily: 'monospace'),
        ),
      ),
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

class _FullscreenBase extends StatefulWidget {
  final String title;
  final Widget child;

  const _FullscreenBase({required this.title, required this.child});

  @override
  State<_FullscreenBase> createState() => _FullscreenBaseState();
}

class _FullscreenBaseState extends State<_FullscreenBase> {
  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Positioned.fill(child: widget.child),
          SafeArea(
            child: Align(
              alignment: Alignment.topLeft,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.of(context).pop(),
                tooltip: 'Fermer',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class FullscreenImageScreen extends StatelessWidget {
  final Uint8List bytes;
  final String title;

  const FullscreenImageScreen({super.key, required this.bytes, required this.title});

  @override
  Widget build(BuildContext context) {
    return _FullscreenBase(
      title: title,
      child: Center(
        child: InteractiveViewer(
          child: Image.memory(
            bytes,
            fit: BoxFit.contain,
          ),
        ),
      ),
    );
  }
}

class FullscreenPdfScreen extends StatelessWidget {
  final Uint8List bytes;
  final String title;

  const FullscreenPdfScreen({super.key, required this.bytes, required this.title});

  @override
  Widget build(BuildContext context) {
    return _FullscreenBase(
      title: title,
      child: SfPdfViewer.memory(bytes),
    );
  }
}

class FullscreenVideoScreen extends StatefulWidget {
  final VideoPlayerController controller;
  final String title;

  const FullscreenVideoScreen({super.key, required this.controller, required this.title});

  @override
  State<FullscreenVideoScreen> createState() => _FullscreenVideoScreenState();
}

class _FullscreenVideoScreenState extends State<FullscreenVideoScreen> {
  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = widget.controller;
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Center(
            child: AspectRatio(
              aspectRatio: controller.value.aspectRatio,
              child: VideoPlayer(controller),
            ),
          ),
          SafeArea(
            child: Align(
              alignment: Alignment.topLeft,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.of(context).pop(),
                tooltip: 'Fermer',
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: Icon(
                    controller.value.isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill,
                    color: Colors.white,
                    size: 48,
                  ),
                  onPressed: () {
                    setState(() {
                      if (controller.value.isPlaying) {
                        controller.pause();
                      } else {
                        controller.play();
                      }
                    });
                  },
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.replay, color: Colors.white, size: 36),
                  onPressed: () {
                    setState(() {
                      controller.seekTo(Duration.zero);
                      controller.play();
                    });
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
