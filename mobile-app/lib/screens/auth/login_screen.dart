import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../services/oauth_service.dart';
import '../../utils/constants.dart';
import '../../widgets/supfile_logo.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _twoFactorCodeController = TextEditingController();
  bool _obscurePassword = true;
  bool _show2FAStep = false;
  bool _resendLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _twoFactorCodeController.dispose();
    super.dispose();
  }

  Future<void> _handleOAuthLogin(String provider) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Connexion avec $provider...'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
      
      Map<String, dynamic>? oauthData;
      
      if (provider == 'google') {
        // Utiliser Google Sign-In natif
        oauthData = await OAuthService.signInWithGoogle();
      } else if (provider == 'github') {
        // Utiliser GitHub avec deep link
        oauthData = await OAuthService.signInWithGitHub();
      } else {
        // Fallback vers navigateur pour autres providers
        await OAuthService.signInWithProvider(provider);
        return;
      }
      
      if (oauthData == null) {
        // L'utilisateur a annulé
        return;
      }

      bool success;

      // GitHub mobile: the backend redirects to a deep link containing JWT tokens.
      // We already have the tokens, so don't call the OAuth callback endpoint again.
      if (provider == 'github' &&
          oauthData['access_token'] is String &&
          oauthData['refresh_token'] is String &&
          oauthData['id_token'] == null) {
        success = await authProvider.loginWithExistingTokens(
          accessToken: oauthData['access_token'] as String,
          refreshToken: oauthData['refresh_token'] as String,
        );
      } else {
        // Google mobile: send Google tokens to backend for verification.
        success = await authProvider.oauthLogin(provider, oauthData);
      }
      
      if (success && mounted) {
        context.go('/dashboard');
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authProvider.error ?? 'Erreur lors de la connexion OAuth'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur OAuth: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final result = await authProvider.login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (result == AuthProvider.loginResultSuccess) {
      if (mounted) context.go('/dashboard');
    } else if (result == AuthProvider.loginResultRequires2FA) {
      if (mounted) setState(() => _show2FAStep = true);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authProvider.error ?? 'Erreur'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleVerify2FA() async {
    final code = _twoFactorCodeController.text.trim();
    if (code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Entrez le code à 6 chiffres ou un code de secours'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.verify2FALogin(code);

    if (success && mounted) {
      context.go('/dashboard');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error ?? 'Code 2FA invalide'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _handleResendVerification() async {
    if (_emailController.text.trim().isEmpty) return;
    setState(() => _resendLoading = true);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.resendVerificationEmail(
      _emailController.text.trim(),
    );
    if (!mounted) return;
    setState(() => _resendLoading = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success
              ? 'Email de vérification renvoyé. Vérifiez votre boîte mail.'
              : (authProvider.error ?? 'Erreur lors de l\'envoi'),
        ),
        backgroundColor: success ? Colors.green : Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
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
              child: _show2FAStep ? _build2FAStep() : Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 40),
                    // Logo personnalisé SUPFile
                    const SupFileLogo(
                      size: 120,
                      showIcon: true,
                      useGradient: true,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Connexion à votre espace',
                      style: TextStyle(
                        fontSize: 16,
                        color: isDark ? Colors.grey[300] : Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 40),
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
                      return null;
                    },
                  ),
                    const SizedBox(height: 32),
                    // Bouton de connexion avec gradient
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
                        onPressed: authProvider.isLoading ? null : _handleLogin,
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
                                'Connexion',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => context.go('/forgot-password'),
                      child: Text(
                        'Mot de passe oublié ?',
                        style: TextStyle(
                          color: isDark ? Colors.grey[400] : Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (authProvider.errorCode == 'EMAIL_NOT_VERIFIED') ...[
                      TextButton.icon(
                        onPressed: _resendLoading ? null : _handleResendVerification,
                        icon: _resendLoading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.mark_email_read),
                        label: const Text('Renvoyer l\'email de vérification'),
                      ),
                      const SizedBox(height: 8),
                    ],
                    // Lien vers inscription
                    TextButton(
                      onPressed: () => context.go('/signup'),
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
                            TextSpan(text: 'Pas encore de compte ? '),
                            TextSpan(
                              text: 'Inscription',
                              style: TextStyle(
                                color: AppConstants.supinfoPurple,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    // Séparateur stylisé
                    Row(
                      children: [
                        Expanded(
                          child: Divider(
                            color: isDark ? Colors.grey[700] : Colors.grey[300],
                            thickness: 1,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            'OU',
                            style: TextStyle(
                              color: isDark ? Colors.grey[500] : Colors.grey[600],
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Divider(
                            color: isDark ? Colors.grey[700] : Colors.grey[300],
                            thickness: 1,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    // Boutons OAuth modernisés
                    _buildOAuthButton(
                      context: context,
                      icon: Icons.g_mobiledata,
                      label: 'Continuer avec Google',
                      onPressed: () => _handleOAuthLogin('google'),
                      backgroundColor: Colors.white,
                      textColor: Colors.black87,
                      iconColor: Colors.blue,
                    ),
                    const SizedBox(height: 12),
                    _buildOAuthButton(
                      context: context,
                      icon: Icons.code,
                      label: 'Continuer avec GitHub',
                      onPressed: () => _handleOAuthLogin('github'),
                      backgroundColor: Colors.black87,
                      textColor: Colors.white,
                      iconColor: Colors.white,
                    ),
                    const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
      ),
    );
  }

  Widget _build2FAStep() {
    final authProvider = Provider.of<AuthProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 40),
        const SupFileLogo(size: 120, showIcon: true, useGradient: true),
        const SizedBox(height: 8),
        Text(
          'Code de vérification',
          style: TextStyle(
            fontSize: 16,
            color: isDark ? Colors.grey[300] : Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
        if (authProvider.pending2FAEmail != null) ...[
          const SizedBox(height: 8),
          Text(
            authProvider.pending2FAEmail!,
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.grey[400] : Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
        const SizedBox(height: 24),
        TextFormField(
          controller: _twoFactorCodeController,
          keyboardType: TextInputType.number,
          maxLength: 8,
          decoration: const InputDecoration(
            labelText: 'Code à 6 chiffres ou code de secours',
            prefixIcon: Icon(Icons.security),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(8)),
            ),
          ),
          onFieldSubmitted: (_) => _handleVerify2FA(),
        ),
        const SizedBox(height: 24),
        Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                AppConstants.supinfoPurple,
                AppConstants.supinfoPurpleLight,
              ],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: ElevatedButton(
            onPressed: authProvider.isLoading ? null : _handleVerify2FA,
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
                      valueColor: AlwaysStoppedAnimation<Color>(AppConstants.supinfoWhite),
                    ),
                  )
                : const Text('Vérifier', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () => setState(() {
            _show2FAStep = false;
            _twoFactorCodeController.clear();
          }),
          child: Text(
            'Retour à la connexion',
            style: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[600]),
          ),
        ),
      ],
    );
  }

  Widget _buildOAuthButton({
    required BuildContext context,
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
    required Color backgroundColor,
    required Color textColor,
    required Color iconColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[800] : backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? Colors.grey[700]! : Colors.grey[300]!,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha((0.05 * 255).round()),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          side: BorderSide.none,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: iconColor,
              size: 24,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


