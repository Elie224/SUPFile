import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:video_player/video_player.dart';
import '../../services/api_service.dart';
import '../../models/file.dart';
import '../../models/folder.dart';
import '../files/files_screen.dart';
import '../../utils/secure_logger.dart';
import '../../utils/constants.dart';
import '../../widgets/responsive_center.dart';

/// Écran pour accéder aux liens de partage publics sans être connecté
/// Conforme à l'exigence : "Un utilisateur ne souhaitant pas créer de compte 
/// ne peut pas accéder aux services de stockage, mais peut accéder aux liens 
/// de partage publics qui lui sont envoyés."
class PublicShareScreen extends StatefulWidget {
  final String token;
  
  const PublicShareScreen({super.key, required this.token});

  @override
  State<PublicShareScreen> createState() => _PublicShareScreenState();
}

class _PublicShareScreenState extends State<PublicShareScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = true;
  bool _isPasswordRequired = false;
  bool _isPasswordChecking = false;
  String? _error;
  FileItem? _file;
  FolderItem? _folder;
  String? _activePassword;

  // Preview state (public)
  bool _isPreviewLoading = false;
  String? _previewError;
  Uint8List? _previewBytes;
  String? _textContent;
  VideoPlayerController? _videoController;
  AudioPlayer? _audioPlayer;
  bool _audioPlaying = false;

  @override
  void dispose() {
    _videoController?.dispose();
    _audioPlayer?.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _loadShare();
  }

  Future<void> _loadShare({String? password}) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _apiService.getPublicShare(
        widget.token,
        password: password,
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        // Vérifier si le partage nécessite un mot de passe
        if (data['requires_password'] == true && password == null) {
          setState(() {
            _isPasswordRequired = true;
            _isLoading = false;
          });
          return;
        }

        // Vérifier si le partage a expiré
        if (data['expired'] == true) {
          setState(() {
            _error = 'Ce lien de partage a expiré';
            _isLoading = false;
          });
          return;
        }

        FileItem? loadedFile;
        FolderItem? loadedFolder;

        if (data['file'] != null) {
          loadedFile = FileItem.fromJson(data['file']);
        } else if (data['folder'] != null) {
          loadedFolder = FolderItem.fromJson(data['folder']);
        }

        setState(() {
          _file = loadedFile;
          _folder = loadedFolder;

          // Mémoriser le mot de passe validé (pour preview/download publics)
          _activePassword = password;
          
          _isPasswordRequired = false;
          _isLoading = false;
        });

        // Init preview if a file was loaded
        if (loadedFile != null) {
          await _initPreview(loadedFile);
        }
      } else if (response.statusCode == 401) {
        setState(() {
          _isPasswordRequired = true;
          _isLoading = false;
          _error = 'Mot de passe requis';
        });
      } else {
        setState(() {
          _error = response.data['error']?['message'] ?? 'Erreur lors du chargement du partage';
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

  String _publicStreamUrl(String fileId) {
    final qp = <String, String>{'token': widget.token};
    final pwd = _activePassword;
    if (pwd != null && pwd.trim().isNotEmpty) {
      qp['password'] = pwd.trim();
    }
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/api/files/${Uri.encodeComponent(fileId)}/stream')
        .replace(queryParameters: qp);
    return uri.toString();
  }

  void _openPublicFullscreen(FileItem file) {
    context.push(
      '/share/${widget.token}/preview/${file.id}',
      extra: {
        'file': file.toJson(),
        if (_activePassword != null && _activePassword!.trim().isNotEmpty)
          'password': _activePassword!.trim(),
      },
    );
  }

  Future<void> _initPreview(FileItem file) async {
    // Reset previous preview state
    _videoController?.dispose();
    _videoController = null;
    _audioPlayer?.dispose();
    _audioPlayer = null;
    _audioPlaying = false;
    _previewBytes = null;
    _textContent = null;

    if (!mounted) return;
    setState(() {
      _isPreviewLoading = true;
      _previewError = null;
    });

    try {
      if (file.isImage || file.isPdf || file.isText) {
        final res = await _apiService.previewPublicFileBytes(
          file.id,
          shareToken: widget.token,
          password: _activePassword,
          size: 'large',
        );
        final code = res.statusCode ?? 0;
        if (code != 200 || res.data == null) {
          throw Exception('Impossible de charger la prévisualisation (code: $code)');
        }
        final bytes = res.data!;
        if (!mounted) return;
        setState(() {
          _previewBytes = Uint8List.fromList(bytes);
          if (file.isText) {
            _textContent = utf8.decode(bytes, allowMalformed: true);
          }
          _isPreviewLoading = false;
        });
        return;
      }

      if (file.isVideo) {
        final url = _publicStreamUrl(file.id);
        final c = VideoPlayerController.networkUrl(Uri.parse(url));
        await c.initialize();
        if (!mounted) {
          c.dispose();
          return;
        }
        setState(() {
          _videoController = c;
          _isPreviewLoading = false;
        });
        return;
      }

      if (file.isAudio) {
        final player = AudioPlayer();
        if (!mounted) {
          player.dispose();
          return;
        }
        setState(() {
          _audioPlayer = player;
          _isPreviewLoading = false;
        });
        return;
      }

      if (!mounted) return;
      setState(() {
        _isPreviewLoading = false;
      });
    } catch (e) {
      SecureLogger.error('Public preview init error', error: e);
      if (!mounted) return;
      setState(() {
        _previewError = e.toString();
        _isPreviewLoading = false;
      });
    }
  }

  Future<void> _checkPassword() async {
    if (_passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez entrer le mot de passe'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isPasswordChecking = true;
    });

    await _loadShare(password: _passwordController.text);

    if (!mounted) return;

    setState(() {
      _isPasswordChecking = false;
    });

    if (_error != null && _error!.contains('mot de passe')) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_error!),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _downloadPublicFile() async {
    if (_file == null) return;

    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final response = await _apiService.downloadPublicFileBytes(
        _file!.id,
        shareToken: widget.token,
        password: _activePassword,
      );

      final code = response.statusCode ?? 0;
      if (code != 200 || response.data == null) {
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
      await out.writeAsBytes(response.data!);

      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Fichier sauvegardé: $filePath'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      SecureLogger.error('Public download error', error: e);
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

    // Écran de saisie du mot de passe
    if (_isPasswordRequired) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
          title: const Text('Lien protégé'),
        ),
        body: SingleChildScrollView(
          child: ResponsiveCenter(
            maxWidth: 520,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
              const Icon(
                Icons.lock,
                size: 64,
                color: Colors.blue,
              ),
              const SizedBox(height: 24),
              Text(
                'Ce lien est protégé par un mot de passe',
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _passwordController,
                decoration: const InputDecoration(
                  labelText: 'Mot de passe',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.lock_outline),
                ),
                obscureText: true,
                onSubmitted: (_) => _checkPassword(),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isPasswordChecking ? null : _checkPassword,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isPasswordChecking
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Accéder au contenu'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Card(
                  color: Colors.red[50],
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _error!,
                            style: const TextStyle(color: Colors.red),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              ],
            ),
          ),
        ),
      );
    }

    // Erreur
    if (_error != null && _file == null && _folder == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
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
                _error!,
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              OutlinedButton.icon(
                onPressed: () => context.go('/login'),
                icon: const Icon(Icons.login),
                label: const Text('Se connecter pour accéder à plus de fonctionnalités'),
              ),
            ],
          ),
        ),
      );
    }

    // Affichage du fichier ou dossier partagé
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: Text(_file != null ? _file!.name : (_folder?.name ?? 'Partage')),
        actions: [
          if (_file != null)
            IconButton(
              icon: const Icon(Icons.download),
              onPressed: _downloadPublicFile,
              tooltip: 'Télécharger',
            ),
          if (_file != null && (_file!.isPdf || _file!.isVideo))
            IconButton(
              icon: const Icon(Icons.fullscreen),
              tooltip: 'Plein écran',
              onPressed: () {
                _openPublicFullscreen(_file!);
              },
            ),
        ],
      ),
      body: _file != null
          ? _buildFileView()
          : _folder != null
              ? _buildFolderView()
              : const Center(child: Text('Aucun contenu disponible')),
    );
  }

  Widget _buildFileView() {
    if (_file == null) return const SizedBox.shrink();

    final file = _file!;

    return SingleChildScrollView(
      child: ResponsiveCenter(
        maxWidth: 820,
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
          // Informations du fichier
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _file!.isImage
                            ? Icons.image
                            : _file!.isVideo
                                ? Icons.video_file
                                : _file!.isAudio
                                    ? Icons.audio_file
                                    : _file!.isPdf
                                        ? Icons.picture_as_pdf
                                        : Icons.insert_drive_file,
                        size: 48,
                        color: Colors.blue,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _file!.name,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${_file!.formattedSize} • ${_file!.mimeType ?? 'Fichier'}',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Preview intégrée
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Aperçu',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      if (_isPreviewLoading)
                        Row(
                          children: [
                            const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Mise à jour…',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        )
                      else
                        IconButton(
                          tooltip: 'Recharger la preview',
                          onPressed: () => _initPreview(file),
                          icon: const Icon(Icons.refresh),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  _buildInlinePreview(file),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Boutons d'action
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _downloadPublicFile,
                  icon: const Icon(Icons.download),
                  label: const Text('Télécharger'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              if (file.isPdf || file.isVideo) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      _openPublicFullscreen(file);
                    },
                    icon: const Icon(Icons.fullscreen),
                    label: const Text('Plein écran'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 24),
          // Message informatif
          Card(
            color: Colors.blue[50],
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Colors.blue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Vous visualisez un fichier partagé. Créez un compte pour accéder à toutes les fonctionnalités.',
                      style: TextStyle(color: Colors.blue[900]),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => context.go('/signup'),
            icon: const Icon(Icons.person_add),
            label: const Text('Créer un compte gratuit'),
          ),
          ],
        ),
      ),
    );
  }

  Widget _buildInlinePreview(FileItem file) {
    if (_isPreviewLoading) {
      return const SizedBox(
        height: 220,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_previewError != null) {
      return SizedBox(
        height: 220,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red),
              const SizedBox(height: 8),
              Text(
                'Preview impossible',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 6),
              Text(
                _previewError!,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => _initPreview(file),
                icon: const Icon(Icons.refresh),
                label: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      );
    }

    if (file.isImage) {
      final bytes = _previewBytes;
      if (bytes == null || bytes.isEmpty) {
        return const SizedBox(height: 220, child: Center(child: Text('Aperçu indisponible')));
      }
      return SizedBox(
        height: 260,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: InteractiveViewer(
            child: Image.memory(bytes, fit: BoxFit.contain),
          ),
        ),
      );
    }

    if (file.isPdf) {
      final bytes = _previewBytes;
      if (bytes == null || bytes.isEmpty) {
        return const SizedBox(height: 220, child: Center(child: Text('Aperçu indisponible')));
      }
      // UX: on évite le "scroll dans le PDF" (nested scroll). L'aperçu est non-interactif;
      // pour lire/scroller: bouton plein écran.
      return SizedBox(
        height: 420,
        child: GestureDetector(
          onTap: () => _openPublicFullscreen(file),
          child: Stack(
            children: [
              Positioned.fill(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: IgnorePointer(
                    ignoring: true,
                    child: SfPdfViewer.memory(bytes),
                  ),
                ),
              ),
              Positioned(
                left: 8,
                right: 8,
                bottom: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.touch_app, color: Colors.white, size: 18),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Touchez pour ouvrir en plein écran',
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                      Icon(Icons.fullscreen, color: Colors.white, size: 18),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (file.isText) {
      final text = _textContent;
      if (text == null) {
        return const SizedBox(height: 220, child: Center(child: Text('Aperçu indisponible')));
      }
      return Container(
        constraints: const BoxConstraints(maxHeight: 420),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
        ),
        child: SingleChildScrollView(
          child: SelectableText(
            text,
            style: const TextStyle(fontFamily: 'monospace'),
          ),
        ),
      );
    }

    if (file.isVideo) {
      final c = _videoController;
      if (c == null || !c.value.isInitialized) {
        return const SizedBox(height: 220, child: Center(child: Text('Chargement vidéo...')));
      }
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AspectRatio(
            aspectRatio: c.value.aspectRatio,
            child: VideoPlayer(c),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: Icon(c.value.isPlaying ? Icons.pause : Icons.play_arrow),
                onPressed: () {
                  setState(() {
                    if (c.value.isPlaying) {
                      c.pause();
                    } else {
                      c.play();
                    }
                  });
                },
              ),
              IconButton(
                icon: const Icon(Icons.stop),
                onPressed: () {
                  setState(() {
                    c.pause();
                    c.seekTo(Duration.zero);
                  });
                },
              ),
            ],
          )
        ],
      );
    }

    if (file.isAudio) {
      return SizedBox(
        height: 220,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.audiotrack, size: 64),
              const SizedBox(height: 12),
              Text(file.name, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () async {
                  final player = _audioPlayer;
                  if (player == null) return;

                  final url = _publicStreamUrl(file.id);
                  try {
                    if (_audioPlaying) {
                      await player.pause();
                      if (!mounted) return;
                      setState(() => _audioPlaying = false);
                      return;
                    }

                    // (Re)start from url to keep it simple
                    await player.play(UrlSource(url));
                    if (!mounted) return;
                    setState(() => _audioPlaying = true);
                  } catch (e) {
                    SecureLogger.error('Audio play error', error: e);
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Erreur audio: $e'), backgroundColor: Colors.red),
                    );
                  }
                },
                icon: Icon(_audioPlaying ? Icons.pause : Icons.play_arrow),
                label: Text(_audioPlaying ? 'Pause' : 'Lecture'),
              ),
            ],
          ),
        ),
      );
    }

    return const SizedBox(
      height: 220,
      child: Center(child: Text('Prévisualisation non disponible pour ce type.')),
    );
  }

  Widget _buildFolderView() {
    if (_folder == null) return const SizedBox.shrink();

    return Column(
      children: [
        // Informations du dossier
        Card(
          margin: const EdgeInsets.all(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.folder, size: 48, color: Colors.blue),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _folder!.name,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Dossier partagé',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        // Navigation vers le contenu du dossier
        Expanded(
          child: FilesScreen(folderId: _folder!.id),
        ),
        // Message informatif
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.blue[50],
          child: Row(
            children: [
              const Icon(Icons.info_outline, color: Colors.blue),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Vous visualisez un dossier partagé. Créez un compte pour accéder à toutes les fonctionnalités.',
                  style: TextStyle(color: Colors.blue[900]),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: OutlinedButton.icon(
            onPressed: () => context.go('/signup'),
            icon: const Icon(Icons.person_add),
            label: const Text('Créer un compte gratuit'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
      ],
    );
  }
}


