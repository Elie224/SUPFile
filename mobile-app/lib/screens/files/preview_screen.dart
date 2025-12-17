import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_player/video_player.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../utils/secure_logger.dart';
import '../../models/file.dart';

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
      final response = await _apiService.listFiles();
      if (response.statusCode == 200) {
        final items = response.data['data']['items'] ?? [];
        for (var item in items) {
          if ((item['id']?.toString() ?? item['_id']?.toString()) == widget.fileId) {
            setState(() {
              _file = FileItem.fromJson(item);
              _isLoading = false;
            });
            _loadPreview();
            return;
          }
        }
        setState(() {
          _error = 'Fichier non trouvé';
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

  Future<void> _downloadFile() async {
    try {
      final response = await _apiService.downloadFile(_file!.id);
      if (response.statusCode == 200) {
        // TODO: Sauvegarder le fichier sur l'appareil
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Téléchargement démarré')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
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
                onPressed: () {
                  // TODO: Précédent
                },
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
                onPressed: () {
                  // TODO: Suivant
                },
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
