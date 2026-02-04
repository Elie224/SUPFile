import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/app_back_button.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final ApiService _apiService = ApiService();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _emailController = TextEditingController();
  final _displayNameController = TextEditingController();
  bool _obscureCurrentPassword = true;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;
  bool _isChangingPassword = false;
  bool _isUpdatingProfile = false;
  bool _twoFactorEnabled = false;
  int _twoFactorBackupCodesCount = 0;
  bool _loading2FA = false;

  @override
  void initState() {
    super.initState();
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    if (user != null) {
      _emailController.text = user.email;
      _displayNameController.text = user.displayName ?? '';
      _twoFactorEnabled = user.twoFactorEnabled;
    }
    _load2FAStatus();
  }

  Future<void> _load2FAStatus() async {
    try {
      final response = await _apiService.get2FAStatus();
      if (response.statusCode == 200 && response.data['data'] != null) {
        final data = response.data['data'] as Map<String, dynamic>;
        if (mounted) {
          setState(() {
            _twoFactorEnabled = data['two_factor_enabled'] == true;
            _twoFactorBackupCodesCount = data['backup_codes_count'] is int
                ? data['backup_codes_count'] as int
                : 0;
          });
        }
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _emailController.dispose();
    _displayNameController.dispose();
    super.dispose();
  }

  Future<void> _updateProfile() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final currentUser = authProvider.user;

    setState(() {
      _isUpdatingProfile = true;
    });

    try {
      await _apiService.updateProfile(
        email: _emailController.text.trim() != currentUser?.email
            ? _emailController.text.trim()
            : null,
        displayName: _displayNameController.text.trim().isNotEmpty
            ? _displayNameController.text.trim()
            : null,
      );
      await authProvider.refreshUser();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profil mis à jour avec succès'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isUpdatingProfile = false;
      });
    }
  }

  void _showEditProfileDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Modifier le profil'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'E-mail',
                  prefixIcon: Icon(Icons.email),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _displayNameController,
                decoration: const InputDecoration(
                  labelText: 'Nom d\'affichage',
                  prefixIcon: Icon(Icons.person),
                  border: OutlineInputBorder(),
                ),
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
            onPressed: _isUpdatingProfile
                ? null
                : () async {
                    await _updateProfile();
                    if (!context.mounted) return;
                    Navigator.pop(context);
                  },
            child: _isUpdatingProfile
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Enregistrer'),
          ),
        ],
      ),
    );
  }

  Future<void> _uploadAvatar() async {
    try {
      final screenContext = context;
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final messenger = ScaffoldMessenger.of(context);
      final navigator = Navigator.of(context);

      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 85,
      );

      if (!mounted) return;

      if (image != null) {
        final file = File(image.path);

        // Vérifier la taille
        final fileSize = await file.length();
        if (fileSize > AppConstants.maxImageSize) {
          if (!mounted) return;
          messenger.showSnackBar(
            const SnackBar(
              content: Text('L\'image est trop grande (max 5 MB)'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }

        // Afficher un indicateur de progression
        if (!screenContext.mounted) return;
        showDialog(
          context: screenContext,
          barrierDismissible: false,
          builder: (dialogContext) =>
              const Center(child: CircularProgressIndicator()),
        );

        try {
          await _apiService.uploadAvatar(file);
          await authProvider.refreshUser();

          if (!mounted) return;
          navigator.pop(); // Fermer le dialogue
          messenger.showSnackBar(
            const SnackBar(
              content: Text('Avatar mis à jour'),
              backgroundColor: Colors.green,
            ),
          );
        } catch (e) {
          if (!mounted) return;
          navigator.pop(); // Fermer le dialogue
          messenger.showSnackBar(
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

  Future<void> _changePassword() async {
    if (_newPasswordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Les mots de passe ne correspondent pas'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_newPasswordController.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Le mot de passe doit contenir au moins 8 caractères'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isChangingPassword = true;
    });

    try {
      await _apiService.changePassword(
        _currentPasswordController.text,
        _newPasswordController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Mot de passe modifié avec succès'),
            backgroundColor: Colors.green,
          ),
        );

        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();

        Navigator.pop(context); // Fermer le dialogue
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isChangingPassword = false;
      });
    }
  }

  void _showChangePasswordDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Changer le mot de passe'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _currentPasswordController,
                obscureText: _obscureCurrentPassword,
                decoration: InputDecoration(
                  labelText: 'Mot de passe actuel',
                  prefixIcon: const Icon(Icons.lock),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureCurrentPassword
                          ? Icons.visibility
                          : Icons.visibility_off,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureCurrentPassword = !_obscureCurrentPassword;
                      });
                    },
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _newPasswordController,
                obscureText: _obscureNewPassword,
                decoration: InputDecoration(
                  labelText: 'Nouveau mot de passe',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureNewPassword
                          ? Icons.visibility
                          : Icons.visibility_off,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureNewPassword = !_obscureNewPassword;
                      });
                    },
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _confirmPasswordController,
                obscureText: _obscureConfirmPassword,
                decoration: InputDecoration(
                  labelText: 'Confirmer le mot de passe',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureConfirmPassword
                          ? Icons.visibility
                          : Icons.visibility_off,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureConfirmPassword = !_obscureConfirmPassword;
                      });
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              _currentPasswordController.clear();
              _newPasswordController.clear();
              _confirmPasswordController.clear();
              Navigator.pop(context);
            },
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: _isChangingPassword ? null : _changePassword,
            child: _isChangingPassword
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Modifier'),
          ),
        ],
      ),
    );
  }

  Future<void> _show2FASetupDialog() async {
    setState(() => _loading2FA = true);
    try {
      final response = await _apiService.setup2FA();
      if (!mounted) return;
      setState(() => _loading2FA = false);
      if (response.statusCode != 200 || response.data['data'] == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Impossible de démarrer la configuration 2FA'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
      final data = response.data['data'] as Map<String, dynamic>;
      final secret = data['secret'] as String?;
      final backupCodes = (data['backupCodes'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [];
      final qrCodeDataUrl = data['qrCode'] as String?;
      if (secret == null) return;
      _show2FAVerifyDialog(
        secret: secret,
        backupCodes: backupCodes,
        qrCodeDataUrl: qrCodeDataUrl,
      );
    } catch (e) {
      if (mounted) {
        setState(() => _loading2FA = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur configuration 2FA: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _show2FAVerifyDialog({
    required String secret,
    required List<String> backupCodes,
    String? qrCodeDataUrl,
  }) {
    final codeController = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Activer la double authentification'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Scannez le QR code avec votre application d\'authentification (Google Authenticator, etc.) :',
                  style: TextStyle(fontSize: 13),
                ),
                if (qrCodeDataUrl != null && qrCodeDataUrl.contains(',')) ...[
                  const SizedBox(height: 12),
                  Center(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.memory(
                        base64Decode(qrCodeDataUrl.split(',').last),
                        width: 200,
                        height: 200,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                const Text(
                  'Ou saisissez ce code manuellement :',
                  style: TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 4),
                SelectableText(
                  secret,
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 14),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: codeController,
                  keyboardType: TextInputType.number,
                  maxLength: 8,
                  decoration: const InputDecoration(
                    labelText: 'Code à 6 chiffres pour confirmer',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () async {
                final code = codeController.text.trim();
                if (code.isEmpty) return;
                try {
                  final response = await _apiService.verify2FA(
                    code,
                    secret,
                    backupCodes,
                  );
                  if (!ctx.mounted) return;
                  if (!mounted) return;
                  if (response.statusCode == 200) {
                    Navigator.pop(ctx);
                    setState(() => _twoFactorEnabled = true);
                    final authProvider =
                        Provider.of<AuthProvider>(context, listen: false);
                    await authProvider.refreshUser();
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Double authentification activée'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  } else {
                    final msg =
                        response.data['error']?['message'] ?? 'Code invalide';
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(msg), backgroundColor: Colors.red),
                    );
                  }
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Erreur: ${e.toString()}'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              },
              child: const Text('Activer'),
            ),
          ],
        );
      },
    );
  }

  void _show2FADisableDialog() {
    final passwordController = TextEditingController();
    var loading = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text('Désactiver le 2FA'),
            content: TextField(
              controller: passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Mot de passe',
                border: OutlineInputBorder(),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Annuler'),
              ),
              ElevatedButton(
                onPressed: loading
                    ? null
                    : () async {
                        final screenContext = this.context;
                        final messenger = ScaffoldMessenger.of(screenContext);
                        final authProvider = Provider.of<AuthProvider>(
                            screenContext,
                            listen: false);

                        final password = passwordController.text;
                        if (password.isEmpty) return;
                        setDialogState(() => loading = true);
                        try {
                          await _apiService.disable2FA(password);
                          if (!ctx.mounted) return;
                          if (!mounted) return;
                          Navigator.pop(ctx);
                          setState(() {
                            _twoFactorEnabled = false;
                            _twoFactorBackupCodesCount = 0;
                          });
                          await authProvider.refreshUser();
                          if (!mounted) return;
                          messenger.showSnackBar(
                            const SnackBar(
                              content:
                                  Text('Double authentification désactivée'),
                              backgroundColor: Colors.green,
                            ),
                          );
                        } catch (e) {
                          if (!mounted) return;
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(
                                e.toString().contains('401')
                                    ? 'Mot de passe incorrect'
                                    : e.toString(),
                              ),
                              backgroundColor: Colors.red,
                            ),
                          );
                        } finally {
                          if (mounted) setDialogState(() => loading = false);
                        }
                      },
                child: loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Désactiver'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        leading: const AppBackButton(fallbackLocation: '/dashboard'),
        title: const Text('Paramètres'),
        elevation: 0,
      ),
      body: ListView(
        children: [
          // Profil
          Card(
            margin: const EdgeInsets.all(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: _uploadAvatar,
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundImage: user?.avatarUrl != null
                              ? NetworkImage(user!.avatarUrl!)
                              : null,
                          child: user?.avatarUrl == null
                              ? const Icon(Icons.person, size: 50)
                              : null,
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.blue,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt,
                                size: 20, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user?.email ?? '',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  if (user?.displayName != null) ...[
                    const SizedBox(height: 8),
                    Text(user!.displayName!),
                  ],
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _showEditProfileDialog,
                    icon: const Icon(Icons.edit),
                    label: const Text('Modifier le profil'),
                  ),
                ],
              ),
            ),
          ),

          // Thème (persisté côté API pour synchronisation multi-appareils)
          Consumer<ThemeProvider>(
            builder: (context, themeProvider, _) {
              return SwitchListTile(
                secondary: const Icon(Icons.dark_mode),
                title: const Text('Mode sombre'),
                value: themeProvider.isDarkMode,
                onChanged: (value) {
                  themeProvider.setThemeMode(
                    value ? ThemeMode.dark : ThemeMode.light,
                  );
                  () async {
                    try {
                      await _apiService.updatePreferences({
                        'theme': value ? 'dark' : 'light',
                      });
                    } catch (_) {
                      // Ignore API failures for theme sync; local theme already applied.
                    }
                  }();
                },
              );
            },
          ),

          const Divider(),

          // Quota
          if (user != null)
            ListTile(
              leading: const Icon(Icons.storage),
              title: const Text('Espace de stockage'),
              subtitle: LinearProgressIndicator(
                value: user.quotaPercentage / 100,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(
                  user.quotaPercentage > 80 ? Colors.red : Colors.green,
                ),
              ),
              trailing: Text(
                '${(user.quotaUsed / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB / ${(user.quotaLimit / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB',
              ),
            ),

          const Divider(),

          ListTile(
            leading: const Icon(Icons.link),
            title: const Text('Gérer mes partages'),
            subtitle: const Text('Voir et désactiver les liens'),
            onTap: () => context.go('/shares'),
          ),

          const Divider(),

          // Pages légales
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('Politique de confidentialité'),
            onTap: () => context.go('/politique-confidentialite'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: const Text('Conditions d\'utilisation'),
            onTap: () => context.go('/conditions-utilisation'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('Mentions légales'),
            onTap: () => context.go('/mentions-legales'),
          ),

          const Divider(),

          ListTile(
            leading: const Icon(Icons.cloud_off),
            title: const Text('À propos du mode hors ligne'),
            subtitle: const Text('Utilisation et synchronisation'),
            onTap: () => context.go('/offline'),
          ),

          const Divider(),

          // Changer le mot de passe
          ListTile(
            leading: const Icon(Icons.lock),
            title: const Text('Changer le mot de passe'),
            onTap: _showChangePasswordDialog,
          ),

          const Divider(),

          // Double authentification (2FA)
          ListTile(
            leading: const Icon(Icons.security),
            title: const Text('Double authentification (2FA)'),
            subtitle: Text(
              _twoFactorEnabled
                  ? 'Activée${_twoFactorBackupCodesCount > 0 ? " · $_twoFactorBackupCodesCount codes de secours" : ""}'
                  : 'Désactivée',
            ),
            trailing: _loading2FA
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : null,
            onTap: _loading2FA
                ? null
                : () {
                    if (_twoFactorEnabled) {
                      _show2FADisableDialog();
                    } else {
                      _show2FASetupDialog();
                    }
                  },
          ),

          const Divider(),

          if (kDebugMode) ...[
            ListTile(
              leading: const Icon(Icons.bug_report),
              title: const Text('Debug réseau'),
              subtitle: Text(() {
                final cfg = _apiService.debugNetworkConfig();
                return 'build=${cfg['buildMarker']}\n'
                    'baseUrl=${cfg['baseUrl']}\n'
                    'connect=${cfg['connectTimeoutSec']}s  '
                    'receive=${cfg['receiveTimeoutSec']}s  '
                    'send=${cfg['sendTimeoutSec']}s';
              }()),
              isThreeLine: true,
            ),
            const Divider(),
          ],

          // Déconnexion
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text(
              'Déconnexion',
              style: TextStyle(color: Colors.red),
            ),
            onTap: () async {
              await authProvider.logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
    );
  }
}
