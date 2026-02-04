import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../models/file.dart';
import '../../services/api_service.dart';
import 'dart:io';
import '../../utils/storage_paths.dart';
import '../../utils/web_download.dart';
import '../../widgets/app_back_button.dart';

/// Galerie d'images pour naviguer entre les images d'un dossier
/// Conforme à l'exigence : "galerie pour les images"
class ImageGalleryScreen extends StatefulWidget {
  final List<FileItem> images;
  final int initialIndex;
  
  const ImageGalleryScreen({
    super.key,
    required this.images,
    this.initialIndex = 0,
  });

  @override
  State<ImageGalleryScreen> createState() => _ImageGalleryScreenState();
}

class _ImageGalleryScreenState extends State<ImageGalleryScreen> {
  late PageController _pageController;
  late int _currentIndex;
  late final ApiService _apiService;
  final Map<String, Future<Uint8List?>> _previewFutures = {};

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _apiService = ApiService();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<Uint8List?> _getPreviewBytes(FileItem image, {required String size}) {
    final key = '${image.id}:$size';
    return _previewFutures.putIfAbsent(key, () async {
      final res = await _apiService.previewFileBytes(image.id, size: size);
      if (res.statusCode != 200 || res.data == null) return null;
      return Uint8List.fromList(res.data!);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Galerie')),
        body: const Center(
          child: Text('Aucune image disponible'),
        ),
      );
    }

    final currentImage = widget.images[_currentIndex];

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black87,
        iconTheme: const IconThemeData(color: Colors.white),
        leading: const AppBackButton(fallbackLocation: '/files', color: Colors.white),
        title: Text(
          '${_currentIndex + 1} / ${widget.images.length}',
          style: const TextStyle(color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline, color: Colors.white),
            onPressed: () => _showImageInfo(currentImage),
          ),
          IconButton(
            icon: const Icon(Icons.download, color: Colors.white),
            onPressed: () => _downloadImage(currentImage),
          ),
        ],
      ),
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: widget.images.length,
            onPageChanged: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            itemBuilder: (context, index) {
              final image = widget.images[index];

              return InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: Center(
                  child: FutureBuilder<Uint8List?>(
                    future: _getPreviewBytes(image, size: 'large'),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(
                          child: CircularProgressIndicator(color: Colors.white),
                        );
                      }

                      final bytes = snapshot.data;
                      if (bytes == null || bytes.isEmpty) {
                        return const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.error_outline, size: 64, color: Colors.white),
                            SizedBox(height: 16),
                            Text('Impossible de charger l\'image', style: TextStyle(color: Colors.white)),
                          ],
                        );
                      }

                      return Image.memory(bytes, fit: BoxFit.contain);
                    },
                  ),
                ),
              );
            },
          ),
          // Miniatures en bas
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 100,
              color: Colors.black87,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                itemCount: widget.images.length,
                itemBuilder: (context, index) {
                  final image = widget.images[index];
                  final isSelected = index == _currentIndex;
                  
                  return GestureDetector(
                    onTap: () {
                      _pageController.animateToPage(
                        index,
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      );
                    },
                    child: Container(
                      width: 80,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: isSelected ? Colors.blue : Colors.transparent,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: FutureBuilder<Uint8List?>(
                          future: _getPreviewBytes(image, size: 'small'),
                          builder: (context, snapshot) {
                            final bytes = snapshot.data;
                            if (snapshot.connectionState == ConnectionState.waiting) {
                              return Container(
                                color: Colors.grey[800],
                                child: const Center(
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              );
                            }
                            if (bytes == null || bytes.isEmpty) {
                              return Container(
                                color: Colors.grey[800],
                                child: const Icon(Icons.error, color: Colors.white),
                              );
                            }
                            return Image.memory(bytes, fit: BoxFit.cover);
                          },
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showImageInfo(FileItem image) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              image.name,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            _buildInfoRow('Taille', image.formattedSize),
            _buildInfoRow('Type', image.mimeType ?? 'Inconnu'),
            if (image.modifiedAt != null)
              _buildInfoRow(
                'Modifié le',
                image.modifiedAt!.toString().substring(0, 10),
              ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  context.push('/preview/${image.id}');
                },
                icon: const Icon(Icons.preview),
                label: const Text('Ouvrir en mode prévisualisation'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _downloadImage(FileItem image) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final response = await _apiService.downloadFile(image.id);
      if (response.statusCode != 200) {
        throw Exception('Erreur téléchargement (code: ${response.statusCode ?? '??'})');
      }

      if (kIsWeb) {
        await WebDownload.saveBytesAsFile(
          bytes: (response.data as List<int>),
          fileName: image.name,
          mimeType: image.mimeType ?? 'application/octet-stream',
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Téléchargement démarré'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        final directory = await StoragePaths.getWritableDirectory();
        final filePath = '${directory.path}/${image.name}';
        final savedFile = File(filePath);
        await savedFile.writeAsBytes(response.data);

        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Image sauvegardée: $filePath'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        // If the dialog is open, close it.
        if (Navigator.of(context).canPop()) {
          Navigator.pop(context);
        }
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


