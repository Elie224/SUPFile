import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../models/file.dart';
import '../../models/folder.dart';
import '../../utils/constants.dart';
import '../files/preview_screen.dart';
import '../files/files_screen.dart';

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
  Map<String, dynamic>? _shareData;
  FileItem? _file;
  FolderItem? _folder;

  @override
  void dispose() {
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
        setState(() {
          _shareData = data;
          
          // Vérifier si le partage nécessite un mot de passe
          if (data['requires_password'] == true && password == null) {
            _isPasswordRequired = true;
            _isLoading = false;
            return;
          }
          
          // Vérifier si le partage a expiré
          if (data['expired'] == true) {
            _error = 'Ce lien de partage a expiré';
            _isLoading = false;
            return;
          }
          
          // Charger le fichier ou le dossier
          if (data['file'] != null) {
            _file = FileItem.fromJson(data['file']);
          } else if (data['folder'] != null) {
            _folder = FolderItem.fromJson(data['folder']);
          }
          
          _isPasswordRequired = false;
          _isLoading = false;
        });
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

  Future<void> _downloadFile() async {
    if (_file == null) return;

    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final response = await _apiService.downloadFile(_file!.id);
      
      if (response.statusCode == 200) {
        // Note: Pour les utilisateurs non connectés, on pourrait ouvrir le fichier
        // dans le navigateur ou utiliser un package de téléchargement
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Téléchargement de ${_file!.name} démarré'),
              backgroundColor: Colors.green,
            ),
          );
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
          padding: const EdgeInsets.all(24),
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
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
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
              onPressed: _downloadFile,
              tooltip: 'Télécharger',
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

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
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
          // Boutons d'action
          ElevatedButton.icon(
            onPressed: () {
              // Naviguer vers la prévisualisation
              context.push('/preview/${_file!.id}');
            },
            icon: const Icon(Icons.preview),
            label: const Text('Prévisualiser'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _downloadFile,
            icon: const Icon(Icons.download),
            label: const Text('Télécharger'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
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


