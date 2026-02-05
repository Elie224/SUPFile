import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/app_back_button.dart';

class ShareScreen extends StatefulWidget {
  final String? fileId;
  final String? folderId;
  
  const ShareScreen({super.key, this.fileId, this.folderId});

  @override
  State<ShareScreen> createState() => _ShareScreenState();
}

class _ShareScreenState extends State<ShareScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _userSearchController = TextEditingController();
  Timer? _searchDebounce;
  DateTime? _expirationDate;
  bool _isLoading = false;
  String? _shareToken;
  String? _shareUrl;
  String? _error;
  bool _passwordProtected = false;
  List<Map<String, dynamic>> _foundUsers = [];
  bool _isSearchingUsers = false;
  String? _userSearchError;
  String? _selectedUserId;

  @override
  void dispose() {
    _passwordController.dispose();
    _userSearchController.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  Future<void> _loadUserSuggestions() async {
    if (!mounted) return;
    setState(() {
      _isSearchingUsers = true;
      _userSearchError = null;
    });
    await _searchUsers('');
  }

  void _onUserSearchChanged(String value) {
    _searchDebounce?.cancel();

    final q = value.trim();
    if (q.isEmpty) {
      // UX: quand le champ est vide, afficher des suggestions au lieu d'une zone vide.
      // Cela aligne le comportement avec le web (liste visible dès l'ouverture).
      _selectedUserId = null;
      _searchDebounce = Timer(const Duration(milliseconds: 150), () {
        if (!mounted) return;
        _loadUserSuggestions();
      });
      return;
    }

    if (q.length < 2) {
      setState(() {
        _foundUsers = [];
        _selectedUserId = null;
        _isSearchingUsers = false;
        _userSearchError = 'Tapez au moins 2 caractères…';
      });
      return;
    }

    setState(() {
      _isSearchingUsers = true;
      _userSearchError = null;
    });

    _searchDebounce = Timer(const Duration(milliseconds: 300), () {
      if (!mounted) return;
      _searchUsers(q);
    });
  }
  
  Future<void> _searchUsers(String query) async {
    final q = query.trim();
    // Champ vide => suggestions (liste). 1 caractère => pas de recherche (éviter requêtes trop larges).
    if (q.length == 1) {
      if (!mounted) return;
      setState(() {
        _foundUsers = [];
        _isSearchingUsers = false;
        _userSearchError = 'Tapez au moins 2 caractères…';
      });
      return;
    }

    try {
      final response = await _apiService.listUsers(q);
      if (!mounted) return;
      if (response.statusCode == 200) {
        setState(() {
          _foundUsers = (response.data is Map && response.data['data'] is List)
              ? (response.data['data'] as List).cast<Map<String, dynamic>>()
              : <Map<String, dynamic>>[];
          if (q.isEmpty) {
            _userSearchError = null;
          }
        });
      } else {
        setState(() {
          _foundUsers = [];
          _userSearchError = 'Recherche impossible (code: ${response.statusCode})';
        });
      }
    } catch (e) {
      if (!mounted) return;
      String msg = 'Erreur lors de la recherche des utilisateurs';
      if (e is DioException) {
        final code = e.response?.statusCode;
        final data = e.response?.data;
        if (code == 401) {
          msg = 'Session expirée. Veuillez vous reconnecter.';
        } else if (data is Map) {
          final errMsg = (data['error'] is Map) ? data['error']['message'] : null;
          msg = (errMsg ?? data['message'] ?? msg).toString();
        } else if (code != null) {
          msg = 'Recherche impossible (code: $code)';
        }
      }
      setState(() {
        _foundUsers = [];
        _userSearchError = msg;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSearchingUsers = false;
        });
      }
    }
  }
  
  Future<void> _createInternalShare() async {
    if (_selectedUserId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner un utilisateur'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _apiService.createInternalShare(
        fileId: widget.fileId,
        folderId: widget.folderId,
        userId: _selectedUserId!,
      );

      if (response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Partage interne créé avec succès'),
              backgroundColor: Colors.green,
            ),
          );
          final router = GoRouter.of(context);
          if (router.canPop()) {
            router.pop();
          } else {
            router.go('/shares');
          }
        }
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _createPublicShare() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _apiService.createPublicShare(
        fileId: widget.fileId,
        folderId: widget.folderId,
        password: _passwordProtected && _passwordController.text.isNotEmpty 
            ? _passwordController.text 
            : null,
        expiresAt: _expirationDate,
      );

      if (response.statusCode == 201) {
        final data = response.data['data'];
        setState(() {
          // Backend renvoie `public_token` (pas `token`).
          _shareToken = (data is Map) ? (data['public_token'] ?? data['token'])?.toString() : null;
          final urlFromApi = (data is Map) ? data['share_url']?.toString() : null;
          _shareUrl = (urlFromApi != null && urlFromApi.trim().isNotEmpty)
              ? urlFromApi
              : (_shareToken != null && _shareToken!.isNotEmpty)
                  ? '${AppConstants.apiBaseUrl}/share/$_shareToken'
                  : null;
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

  Future<void> _selectExpirationDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (!mounted) return;
    
    if (picked != null) {
      final TimeOfDay? time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.now(),
      );

      if (!mounted) return;
      
      if (time != null) {
        setState(() {
          _expirationDate = DateTime(
            picked.year,
            picked.month,
            picked.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  Future<void> _copyToClipboard() async {
    if (_shareUrl != null) {
      await Clipboard.setData(ClipboardData(text: _shareUrl!));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lien copié dans le presse-papiers'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }

  Future<void> _shareLink() async {
    if (_shareUrl != null) {
      final uri = Uri.parse(_shareUrl!);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const AppBackButton(fallbackLocation: '/dashboard'),
        title: const Text('Partager'),
        actions: [
          IconButton(
            icon: const Icon(Icons.link),
            tooltip: 'Mes partages',
            onPressed: () => context.go('/shares'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Type de partage
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Partage public',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      title: const Text('Protéger par mot de passe'),
                      value: _passwordProtected,
                      onChanged: (value) {
                        setState(() {
                          _passwordProtected = value;
                        });
                      },
                    ),
                    if (_passwordProtected) ...[
                      const SizedBox(height: 8),
                      TextField(
                        controller: _passwordController,
                        decoration: const InputDecoration(
                          labelText: 'Mot de passe',
                          border: OutlineInputBorder(),
                        ),
                        obscureText: true,
                      ),
                    ],
                    const SizedBox(height: 16),
                    ListTile(
                      leading: const Icon(Icons.calendar_today),
                      title: const Text('Date d\'expiration'),
                      subtitle: Text(
                        _expirationDate != null
                            ? '${_expirationDate!.day}/${_expirationDate!.month}/${_expirationDate!.year} ${_expirationDate!.hour}:${_expirationDate!.minute.toString().padLeft(2, '0')}'
                            : 'Aucune',
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: _expirationDate != null
                            ? () {
                                setState(() {
                                  _expirationDate = null;
                                });
                              }
                            : null,
                      ),
                      onTap: _selectExpirationDate,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _isLoading ? null : _createPublicShare,
                      icon: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.link),
                      label: const Text('Créer le lien de partage'),
                    ),
                  ],
                ),
              ),
            ),
            
            // Lien généré
            if (_shareUrl != null) ...[
              const SizedBox(height: 16),
              Card(
                color: Colors.green[50],
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Lien de partage créé',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey),
                        ),
                        child: SelectableText(
                          _shareUrl!,
                          style: const TextStyle(fontFamily: 'monospace'),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _copyToClipboard,
                              icon: const Icon(Icons.copy),
                              label: const Text('Copier'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _shareLink,
                              icon: const Icon(Icons.share),
                              label: const Text('Partager'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
            
            // Erreur
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
            
            const SizedBox(height: 32),
            
            // Partage interne
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Partage avec un utilisateur',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _userSearchController,
                      decoration: InputDecoration(
                        labelText: 'Rechercher un utilisateur',
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: _userSearchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: () {
                                  _userSearchController.clear();
                                  _onUserSearchChanged('');
                                },
                              )
                            : null,
                        border: const OutlineInputBorder(),
                      ),
                      onChanged: (value) {
                        _onUserSearchChanged(value);
                      },
                    ),
                    if (_userSearchController.text.trim().isEmpty && !_isSearchingUsers && _userSearchError == null && _foundUsers.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Suggestions (tapez 2 caractères pour filtrer)',
                        style: TextStyle(color: Colors.grey[700], fontSize: 12),
                      ),
                    ],
                    if (_userSearchError != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        _userSearchError!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ],
                    if (_isSearchingUsers)
                      const Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Center(child: CircularProgressIndicator()),
                      )
                    else if (_foundUsers.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Container(
                        constraints: const BoxConstraints(maxHeight: 200),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: ListView.builder(
                          shrinkWrap: true,
                          itemCount: _foundUsers.length,
                          itemBuilder: (context, index) {
                            final user = _foundUsers[index];
                            final userId = user['id']?.toString() ?? user['_id']?.toString();
                            final isSelected = _selectedUserId == userId;
                            final displayName = user['display_name']?.toString().trim() ?? '';
                            final email = user['email']?.toString().trim() ?? '';
                            
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundImage: user['avatar_url'] != null
                                  ? NetworkImage(
                                    (user['avatar_url'] is String && (user['avatar_url'] as String).startsWith('/'))
                                      ? '${AppConstants.apiBaseUrl}${user['avatar_url']}'
                                      : user['avatar_url'],
                                    )
                                    : null,
                                child: user['avatar_url'] == null
                                    ? const Icon(Icons.person)
                                    : null,
                              ),
                              title: Text(displayName.isNotEmpty ? displayName : email),
                              subtitle: displayName.isNotEmpty ? Text(email) : null,
                              selected: isSelected,
                              onTap: () {
                                setState(() {
                                  _selectedUserId = userId;
                                });
                              },
                              trailing: isSelected
                                  ? const Icon(Icons.check_circle, color: Colors.green)
                                  : null,
                            );
                          },
                        ),
                      ),
                    ],
                    if (!_isSearchingUsers && _userSearchError == null) ...[
                      if (_userSearchController.text.trim().length >= 2 && _foundUsers.isEmpty) ...[
                        const SizedBox(height: 12),
                        Text(
                          'Aucun utilisateur trouvé. Vérifiez l’email/nom, ou créez un second compte pour tester le partage interne.',
                          style: TextStyle(color: Colors.grey[700]),
                        ),
                      ]
                    ],
                    if (_selectedUserId != null) ...[
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _isLoading ? null : _createInternalShare,
                        icon: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.person_add),
                        label: const Text('Partager avec cet utilisateur'),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

