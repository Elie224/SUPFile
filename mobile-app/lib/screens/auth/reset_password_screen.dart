import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../utils/input_validator.dart';
import '../../widgets/supfile_logo.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String? token;

  const ResetPasswordScreen({super.key, this.token});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _tokenController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _loading = false;
  bool _verifying = true;
  bool _tokenValid = false;
  String? _tokenEmail;
  bool _success = false;
  String? _error;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void initState() {
    super.initState();
    _tokenController.text = widget.token ?? '';
    if (_tokenController.text.trim().isNotEmpty) {
      _verifyToken();
    } else {
      _verifying = false;
      _tokenValid = false;
      _error = null;
    }
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _verifyToken() async {
    final token = _tokenController.text.trim();
    if (token.isEmpty) {
      setState(() {
        _verifying = false;
        _tokenValid = false;
        _error = 'Token manquant.';
      });
      return;
    }

    setState(() {
      _verifying = true;
      _error = null;
    });

    try {
      final response = await _apiService.verifyResetToken(token);
      if (response.statusCode == 200 && response.data['data'] != null) {
        final data = response.data['data'] as Map<String, dynamic>;
        if (mounted) {
          setState(() {
            _verifying = false;
            _tokenValid = data['valid'] == true;
            _tokenEmail = data['email']?.toString();
            if (!_tokenValid) {
              _error =
                  'Ce lien a expiré (15 minutes) ou est invalide. Refaites une demande.';
            }
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _verifying = false;
            _tokenValid = false;
            _error = response.data['error']?['message']?.toString() ??
                'Lien invalide ou expiré.';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _verifying = false;
          _tokenValid = false;
          _error = 'Erreur de connexion. Réessayez plus tard.';
        });
      }
    }
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _loading = true;
    });

    if (!_formKey.currentState!.validate()) {
      setState(() => _loading = false);
      return;
    }

    final token = _tokenController.text.trim();
    if (token.isEmpty) {
      setState(() {
        _error = 'Token manquant';
        _loading = false;
      });
      return;
    }

    try {
      await _apiService.resetPassword(token, _passwordController.text);
      if (mounted) {
        setState(() {
          _success = true;
          _loading = false;
        });
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) context.go('/login');
        });
      }
    } catch (e) {
      String msg = 'Une erreur est survenue.';
      if (e.toString().contains('400')) {
        msg = 'Lien expiré ou mot de passe invalide.';
      }
      if (mounted) {
        setState(() {
          _error = msg;
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [
                    AppConstants.supinfoPurpleDark,
                    AppConstants.supinfoPurple,
                    const Color(0xFF121212),
                  ]
                : [
                    AppConstants.supinfoPurple.withAlpha((0.1 * 255).round()),
                    AppConstants.supinfoGrey,
                    AppConstants.supinfoWhite,
                  ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: _verifying
                  ? const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text('Vérification du lien...'),
                      ],
                    )
                  : _success
                      ? _buildSuccess(isDark)
                      : _buildForm(isDark),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildForm(bool isDark) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 24),
          const SupFileLogo(size: 80, showIcon: true, useGradient: true),
          const SizedBox(height: 16),
          Text(
            'Nouveau mot de passe',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.grey[800],
            ),
            textAlign: TextAlign.center,
          ),
          if (_tokenEmail != null) ...[
            const SizedBox(height: 4),
            Text(
              _tokenEmail!,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.grey[400] : Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
          const SizedBox(height: 24),
          if (_error != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _error!,
                style: TextStyle(color: Colors.red.shade900, fontSize: 13),
              ),
            ),
            const SizedBox(height: 16),
          ],
          if (!_tokenValid) ...[
            TextFormField(
              controller: _tokenController,
              decoration: const InputDecoration(
                labelText: 'Token de réinitialisation',
                prefixIcon: Icon(Icons.vpn_key_outlined),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(8)),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Token requis';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _verifying ? null : _verifyToken,
                icon: _verifying
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.verified),
                label: const Text('Vérifier le token'),
              ),
            ),
            const SizedBox(height: 16),
          ],
          if (!_tokenValid)
            Text(
              'Astuce : le lien reçu par email expire au bout de 15 minutes.',
              style: TextStyle(
                  color: isDark ? Colors.grey[400] : Colors.grey[700],
                  fontSize: 12),
              textAlign: TextAlign.center,
            ),
          if (!_tokenValid) const SizedBox(height: 16),
          if (!_tokenValid)
            TextButton(
              onPressed: () => context.go('/forgot-password'),
              child: const Text('Refaire une demande'),
            ),
          if (!_tokenValid) const SizedBox(height: 8),
          if (_tokenValid) ...[
            TextFormField(
              controller: _passwordController,
              obscureText: _obscurePassword,
              decoration: InputDecoration(
                labelText: 'Nouveau mot de passe',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility : Icons.visibility_off,
                  ),
                  onPressed: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                ),
                border: const OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(8)),
                ),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Mot de passe requis';
                }
                if (!InputValidator.isValidPassword(value)) {
                  return '8 caractères min., une majuscule et un chiffre';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _confirmController,
              obscureText: _obscureConfirm,
              decoration: InputDecoration(
                labelText: 'Confirmer le mot de passe',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureConfirm ? Icons.visibility : Icons.visibility_off,
                  ),
                  onPressed: () =>
                      setState(() => _obscureConfirm = !_obscureConfirm),
                ),
                border: const OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(8)),
                ),
              ),
              validator: (value) {
                if (value != _passwordController.text) {
                  return 'Les mots de passe ne correspondent pas';
                }
                return null;
              },
            ),
            const SizedBox(height: 28),
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.supinfoPurple,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _loading
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('Réinitialiser le mot de passe'),
              ),
            ),
          ],
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => context.go('/login'),
            child: Text(
              'Retour à la connexion',
              style: TextStyle(
                color: isDark ? Colors.grey[400] : Colors.grey[700],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccess(bool isDark) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: const BoxDecoration(
            color: AppConstants.successColor,
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.check, size: 48, color: Colors.white),
        ),
        const SizedBox(height: 24),
        Text(
          'Mot de passe réinitialisé',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.grey[800],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.grey[400] : Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        const Text('Redirection vers la connexion...'),
      ],
    );
  }
}
