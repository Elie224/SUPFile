import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../utils/constants.dart';
import '../../widgets/supfile_logo.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _successMessage = '';
  String _resendSuccess = '';
  bool _resendLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSignup() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final result = await authProvider.signup(
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (result == AuthProvider.signupResultSuccess) {
      if (mounted) {
        context.go('/dashboard');
      }
    } else if (result == AuthProvider.signupResultRequiresVerification) {
      if (mounted) {
        setState(() {
          _successMessage =
              'Compte créé. Un email de vérification a été envoyé. '
              'Cliquez sur le lien pour activer votre compte, puis connectez-vous.';
          _resendSuccess = '';
        });
      }
    } else {
      if (mounted) {
        String errorMsg = authProvider.error ?? 'Erreur';
        
        // Améliorer les messages d'erreur
        if (errorMsg.contains('FormatException')) {
          errorMsg = 'Le serveur API ne répond pas correctement. '
              'Vérifiez que l\'API est accessible à: ${AppConstants.apiBaseUrl}';
        } else if (errorMsg.contains('Connection refused') || 
                   errorMsg.contains('Connection timed out')) {
          errorMsg = 'Impossible de se connecter au serveur. '
              'Vérifiez que l\'API est en cours d\'exécution à: ${AppConstants.apiBaseUrl}';
        } else if (errorMsg.contains('already exists') || 
                   errorMsg.contains('Email already')) {
          errorMsg = 'Cet email est déjà utilisé.';
        } else if (errorMsg.contains('Invalid credentials') || 
                   errorMsg.contains('Invalid password')) {
          errorMsg = 'Email ou mot de passe invalide.';
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMsg),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  Future<void> _handleResendVerification() async {
    if (_emailController.text.trim().isEmpty) return;
    setState(() {
      _resendLoading = true;
      _resendSuccess = '';
    });
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.resendVerificationEmail(
      _emailController.text.trim(),
    );
    if (!mounted) return;
    setState(() {
      _resendLoading = false;
      _resendSuccess = success
          ? 'Email de vérification renvoyé. Vérifiez votre boîte mail.'
          : '';
    });
    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error ?? 'Erreur lors de l\'envoi'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inscription'),
        elevation: 0,
      ),
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
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 20),
                  // Logo personnalisé SUPFile
                  const SupFileLogo(
                    size: 100,
                    showIcon: true,
                    useGradient: true,
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Créer un compte',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppConstants.supinfoPurple,
                      letterSpacing: 0.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Rejoignez SUPFile dès aujourd\'hui',
                    style: TextStyle(
                      fontSize: 15,
                      color: isDark ? Colors.grey[300] : Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  if (_successMessage.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.green.withAlpha((0.1 * 255).round()),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.green.withAlpha((0.3 * 255).round())),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Icon(Icons.mark_email_read, color: Colors.green, size: 32),
                          const SizedBox(height: 8),
                          Text(
                            _successMessage,
                            style: const TextStyle(fontSize: 14),
                            textAlign: TextAlign.center,
                          ),
                          if (_resendSuccess.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(
                              _resendSuccess,
                              style: const TextStyle(color: Colors.green, fontSize: 13),
                              textAlign: TextAlign.center,
                            ),
                          ],
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: _resendLoading ? null : _handleResendVerification,
                            icon: _resendLoading
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.refresh),
                            label: const Text('Renvoyer l\'email de vérification'),
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton(
                            onPressed: () => context.go('/login'),
                            child: const Text('Aller à la connexion'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                  if (_successMessage.isNotEmpty) ...[
                    const SizedBox(height: 8),
                  ] else ...[
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'E-mail',
                    prefixIcon: Icon(Icons.email),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(8)),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'E-mail requis';
                    }
                    if (!value.contains('@')) {
                      return 'Email invalide';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Mot de passe',
                    prefixIcon: const Icon(Icons.lock),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility : Icons.visibility_off,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                    border: const OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(8)),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Mot de passe requis';
                    }
                    if (value.length < 8) {
                      return 'Minimum 8 caractères';
                    }
                    if (!value.contains(RegExp(r'[A-Z]'))) {
                      return 'Au moins une majuscule';
                    }
                    if (!value.contains(RegExp(r'[0-9]'))) {
                      return 'Au moins un chiffre';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirmPassword,
                  decoration: InputDecoration(
                    labelText: 'Confirmer le mot de passe',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirmPassword ? Icons.visibility : Icons.visibility_off,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscureConfirmPassword = !_obscureConfirmPassword;
                        });
                      },
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  validator: (value) {
                    if (value != _passwordController.text) {
                      return 'Les mots de passe ne correspondent pas';
                    }
                    return null;
                  },
                ),
                  const SizedBox(height: 32),
                  // Bouton d'inscription avec gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          AppConstants.supinfoPurple,
                          AppConstants.supinfoPurpleLight,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: AppConstants.supinfoPurple.withAlpha((0.4 * 255).round()),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: authProvider.isLoading ? null : _handleSignup,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: authProvider.isLoading
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  AppConstants.supinfoWhite,
                                ),
                              ),
                            )
                          : const Text(
                              'Inscription',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Lien vers connexion
                  TextButton(
                    onPressed: () => context.go('/login'),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        style: TextStyle(
                          color: isDark ? Colors.grey[300] : Colors.grey[700],
                          fontSize: 15,
                        ),
                        children: const [
                          TextSpan(text: 'Déjà un compte ? '),
                          TextSpan(
                            text: 'Connexion',
                            style: TextStyle(
                              color: AppConstants.supinfoPurple,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
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






