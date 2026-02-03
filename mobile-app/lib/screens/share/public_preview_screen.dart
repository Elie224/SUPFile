import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:video_player/video_player.dart';

import '../../models/file.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../utils/secure_logger.dart';
import '../../widgets/responsive_center.dart';

class PublicPreviewScreen extends StatefulWidget {
  final String shareToken;
  final String fileId;
  final Map<String, dynamic>? fileJson;
  final String? password;

  const PublicPreviewScreen({
    super.key,
    required this.shareToken,
    required this.fileId,
    this.fileJson,
    this.password,
  });

  @override
  State<PublicPreviewScreen> createState() => _PublicPreviewScreenState();
}

class _PublicPreviewScreenState extends State<PublicPreviewScreen> {
  final ApiService _apiService = ApiService();

  bool _loading = true;
  String? _error;
  FileItem? _file;

  Uint8List? _previewBytes;
  String? _textContent;

  VideoPlayerController? _videoController;
  AudioPlayer? _audioPlayer;
  bool _audioPlaying = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _audioPlayer?.dispose();
    super.dispose();
  }

  String _publicPreviewUrl() {
    final qp = <String, String>{'token': widget.shareToken};
    if (widget.password != null && widget.password!.trim().isNotEmpty) {
      qp['password'] = widget.password!.trim();
    }
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/api/files/${Uri.encodeComponent(widget.fileId)}/preview')
        .replace(queryParameters: qp);
    return uri.toString();
  }

  String _publicStreamUrl() {
    final qp = <String, String>{'token': widget.shareToken};
    if (widget.password != null && widget.password!.trim().isNotEmpty) {
      qp['password'] = widget.password!.trim();
    }
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/api/files/${Uri.encodeComponent(widget.fileId)}/stream')
        .replace(queryParameters: qp);
    return uri.toString();
  }

  Future<void> _init() async {
    try {
      // 1) file metadata
      if (widget.fileJson != null) {
        _file = FileItem.fromJson(Map<String, dynamic>.from(widget.fileJson!));
      } else {
        // fallback: re-fetch share and extract file
        final res = await _apiService.getPublicShare(widget.shareToken, password: widget.password);
        if (res.statusCode != 200) {
          throw Exception(res.data?['error']?['message'] ?? 'Impossible de charger le partage');
        }
        final data = res.data['data'];
        if (data == null || data['file'] == null) {
          throw Exception('Fichier non trouvé');
        }
        _file = FileItem.fromJson(Map<String, dynamic>.from(data['file'] as Map));
      }

      await _loadPreview();

      if (!mounted) return;
      setState(() {
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _loadPreview() async {
    if (_file == null) return;

    if (_file!.isImage || _file!.isPdf || _file!.isText) {
      final res = await _apiService.previewPublicFileBytes(
        widget.fileId,
        shareToken: widget.shareToken,
        password: widget.password,
        size: 'large',
      );
      final code = res.statusCode ?? 0;
      if (code != 200 || res.data == null) {
        throw Exception('Impossible de charger la prévisualisation (code: $code)');
      }
      _previewBytes = Uint8List.fromList(res.data!);
      if (_file!.isText) {
        _textContent = utf8.decode(_previewBytes!, allowMalformed: true);
      }
      return;
    }

    if (_file!.isVideo) {
      final streamUrl = _publicStreamUrl();
      _videoController = VideoPlayerController.networkUrl(Uri.parse(streamUrl));
      await _videoController!.initialize();
      return;
    }

    if (_file!.isAudio) {
      _audioPlayer = AudioPlayer();
      final streamUrl = _publicStreamUrl();
      // Streaming direct (URL) fonctionne sans headers grâce au token en query
      await _audioPlayer!.play(UrlSource(streamUrl));
      _audioPlaying = true;
      return;
    }
  }

  Future<void> _downloadPublicFile() async {
    if (_file == null) return;

    try {
      final res = await _apiService.downloadPublicFileBytes(
        widget.fileId,
        shareToken: widget.shareToken,
        password: widget.password,
      );
      final code = res.statusCode ?? 0;
      if (code != 200 || res.data == null) {
        throw Exception('Téléchargement impossible (code: $code)');
      }

      Directory? directory;
      if (Platform.isAndroid) {
        directory = await getExternalStorageDirectory();
      } else {
        directory = await getApplicationDocumentsDirectory();
      }
      if (directory == null) throw Exception('Répertoire non disponible');
      if (!await directory.exists()) await directory.create(recursive: true);

      final safeName = _file!.name.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
      final filePath = '${directory.path}${Platform.pathSeparator}$safeName';
      final out = File(filePath);
      await out.writeAsBytes(res.data!);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Fichier sauvegardé: $filePath'), backgroundColor: Colors.green),
      );
    } catch (e) {
      SecureLogger.error('Public download error', error: e);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _openFullscreen() async {
    if (_file == null) return;

    if (_file!.isVideo) {
      final url = _publicStreamUrl();
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => _VideoFullscreenPage(url: url, title: _file!.name),
        ),
      );
      return;
    }

    if (_file!.isPdf) {
      final url = _publicPreviewUrl();
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => _PdfFullscreenPage(url: url, title: _file!.name),
        ),
      );
      return;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
          title: const Text('Chargement...'),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _file == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
          title: const Text('Erreur'),
        ),
        body: ResponsiveCenter(
          maxWidth: 560,
          child: Text(
            _error ?? 'Erreur inconnue',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
      );
    }

    final canFullscreen = _file!.isVideo || _file!.isPdf;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
        title: Text(_file!.name, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          if (canFullscreen)
            IconButton(
              icon: const Icon(Icons.fullscreen),
              tooltip: 'Plein écran',
              onPressed: _openFullscreen,
            ),
          IconButton(
            icon: const Icon(Icons.download),
            tooltip: 'Télécharger',
            onPressed: _downloadPublicFile,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_file!.isImage) {
      final bytes = _previewBytes;
      if (bytes == null || bytes.isEmpty) return const Center(child: CircularProgressIndicator());
      return Center(
        child: InteractiveViewer(
          child: Image.memory(bytes, fit: BoxFit.contain),
        ),
      );
    }

    if (_file!.isPdf) {
      final bytes = _previewBytes;
      if (bytes == null || bytes.isEmpty) return const Center(child: CircularProgressIndicator());
      return ResponsiveCenter(
        maxWidth: 920,
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height,
          child: SfPdfViewer.memory(bytes),
        ),
      );
    }

    if (_file!.isText) {
      final text = _textContent;
      if (text == null) return const Center(child: CircularProgressIndicator());
      return ResponsiveCenter(
        maxWidth: 920,
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: SingleChildScrollView(
              child: SelectableText(text, style: const TextStyle(fontFamily: 'monospace')),
            ),
          ),
        ),
      );
    }

    if (_file!.isVideo) {
      final controller = _videoController;
      if (controller == null || !controller.value.isInitialized) {
        return const Center(child: CircularProgressIndicator());
      }
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AspectRatio(
              aspectRatio: controller.value.aspectRatio,
              child: VideoPlayer(controller),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: Icon(controller.value.isPlaying ? Icons.pause : Icons.play_arrow),
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
                IconButton(
                  icon: const Icon(Icons.stop),
                  onPressed: () {
                    setState(() {
                      controller.pause();
                      controller.seekTo(Duration.zero);
                    });
                  },
                ),
              ],
            )
          ],
        ),
      );
    }

    if (_file!.isAudio) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.audiotrack, size: 96),
            const SizedBox(height: 16),
            Text(_file!.name, textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () async {
                if (_audioPlayer == null) {
                  await _loadPreview();
                  setState(() {});
                  return;
                }
                if (_audioPlaying) {
                  await _audioPlayer!.pause();
                } else {
                  await _audioPlayer!.resume();
                }
                setState(() {
                  _audioPlaying = !_audioPlaying;
                });
              },
              icon: Icon(_audioPlaying ? Icons.pause : Icons.play_arrow),
              label: Text(_audioPlaying ? 'Pause' : 'Lecture'),
            ),
          ],
        ),
      );
    }

    return Center(
      child: ResponsiveCenter(
        maxWidth: 560,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.insert_drive_file, size: 80),
            const SizedBox(height: 12),
            const Text('Prévisualisation non disponible pour ce type.'),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _downloadPublicFile,
              icon: const Icon(Icons.download),
              label: const Text('Télécharger'),
            )
          ],
        ),
      ),
    );
  }
}

class _PdfFullscreenPage extends StatelessWidget {
  final String url;
  final String title;

  const _PdfFullscreenPage({required this.url, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis)),
      body: SfPdfViewer.network(url),
    );
  }
}

class _VideoFullscreenPage extends StatefulWidget {
  final String url;
  final String title;

  const _VideoFullscreenPage({required this.url, required this.title});

  @override
  State<_VideoFullscreenPage> createState() => _VideoFullscreenPageState();
}

class _VideoFullscreenPageState extends State<_VideoFullscreenPage> {
  VideoPlayerController? _controller;

  @override
  void initState() {
    super.initState();
    _enterFullscreen();
    _init();
  }

  Future<void> _enterFullscreen() async {
    await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
  }

  Future<void> _exitFullscreen() async {
    await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  }

  Future<void> _init() async {
    try {
      final c = VideoPlayerController.networkUrl(Uri.parse(widget.url));
      await c.initialize();
      await c.play();
      if (!mounted) return;
      setState(() {
        _controller = c;
      });
    } catch (e) {
      SecureLogger.error('Fullscreen video init error', error: e);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    _exitFullscreen();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = _controller;
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            Center(
              child: c != null && c.value.isInitialized
                  ? AspectRatio(
                      aspectRatio: c.value.aspectRatio,
                      child: VideoPlayer(c),
                    )
                  : const CircularProgressIndicator(),
            ),
            Positioned(
              top: 12,
              left: 12,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
