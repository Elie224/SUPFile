import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/supfile_logo.dart';

class VerifyEmailScreen extends StatefulWidget {
  final String? token;

  const VerifyEmailScreen({super.key, this.token});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _emailController = TextEditingController();
  String _status = 'loading';
  String _message = '';
  bool _resendLoading = false;
  String _resendSuccess = '';

  @override
  void initState() {
    super.initState();
    _verifyEmail();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _verifyEmail() async {
    final token = widget.token;
    if (token == null || token.isEmpty) {
      setState(() {
        _status = 'error';
        _message = 'Lien invalide : token manquant.';
      });
      return;
    }

    try {
      final response = await _apiService.verifyEmail(token);
      if (!mounted) return;
      if (response.statusCode == 200) {
        setState(() {
          _status = 'success';
          _message = response.data?['message']?.toString() ??
              'Email vérifié. Vous pouvez maintenant vous connecter.';
        });
        Future.delayed(const Duration(milliseconds: 2500), () {
          if (mounted) context.go('/login');
        });
      } else {
        setState(() {
          _status = 'error';
          _message = response.data?['error']?['message']?.toString() ??
              'Lien expiré ou invalide.';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _status = 'error';
        _message = 'Lien expiré ou invalide.';
      });
    }
  }

  Future<void> _resendVerification() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) return;
    setState(() {
      _resendLoading = true;
      _resendSuccess = '';
    });
    try {
      final response = await _apiService.resendVerification(email);
      if (!mounted) return;
      if (response.statusCode == 200) {
        setState(() {
          _resendSuccess = 'Email de vérification renvoyé.';
          _resendLoading = false;
        });
      } else {
        setState(() {
          _resendSuccess = '';
          _resendLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              response.data?['error']?['message']?.toString() ??
                  'Erreur lors de l\'envoi',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _resendLoading = false;
        _resendSuccess = '';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Vérification de l\'email'),
      ),
      body: Container(
        width: double.infinity,
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
                    AppConstants.supinfoPurple.withOpacity(0.1),
                    AppConstants.supinfoGrey,
                    AppConstants.supinfoWhite,
                  ],
          ),
        ),
        child: Center(
          child: Card(
            margin: const EdgeInsets.all(24),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SupFileLogo(size: 72, showIcon: true, useGradient: true),
                  const SizedBox(height: 12),
                  Text(
                    'Vérification de l\'email',
                    style: Theme.of(context).textTheme.titleLarge,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  if (_status == 'loading') ...[
                    const CircularProgressIndicator(),
                    const SizedBox(height: 12),
                    const Text('Vérification en cours...'),
                  ] else if (_status == 'success') ...[
                    const Icon(Icons.check_circle, color: Colors.green, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      _message,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.green),
                    ),
                    const SizedBox(height: 8),
                    const Text('Redirection vers la connexion...'),
                  ] else ...[
                    const Icon(Icons.error_outline, color: Colors.red, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      _message,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.red),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'E-mail',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    if (_resendSuccess.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(
                        _resendSuccess,
                        style: const TextStyle(color: Colors.green),
                        textAlign: TextAlign.center,
                      ),
                    ],
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: _resendLoading ? null : _resendVerification,
                      icon: _resendLoading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.refresh),
                      label: const Text('Renvoyer l\'email'),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Aller à la connexion'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
