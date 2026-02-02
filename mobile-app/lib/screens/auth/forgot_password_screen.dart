import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/supfile_logo.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _loading = false;
  bool _success = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
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

    try {
      await _apiService.forgotPassword(_emailController.text.trim());
      if (mounted) {
        setState(() {
          _success = true;
          _loading = false;
        });
      }
    } catch (e) {
      final msg = e.toString();
      if (mounted) {
        setState(() {
          _error = msg.contains('401') || msg.contains('404')
              ? 'Aucun compte associé à cet email.'
              : 'Erreur. Vérifiez votre connexion et réessayez.';
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
              child: _success ? _buildSuccess() : _buildForm(isDark),
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
          const SizedBox(height: 40),
          const SupFileLogo(size: 100, showIcon: true, useGradient: true),
          const SizedBox(height: 16),
          Text(
            'Mot de passe oublié ?',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.grey[800],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Entrez votre email pour recevoir un lien de réinitialisation.',
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
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
              if (value == null || value.isEmpty) return 'E-mail requis';
              if (!value.contains('@')) return 'Email invalide';
              return null;
            },
          ),
          const SizedBox(height: 24),
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
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Envoyer le lien'),
            ),
          ),
          const SizedBox(height: 20),
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

  Widget _buildSuccess() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 40),
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
          'Email envoyé !',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.grey[800],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Si un compte existe pour cet email, vous recevrez un lien pour réinitialiser votre mot de passe.',
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.grey[400] : Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        SizedBox(
          height: 50,
          child: ElevatedButton(
            onPressed: () => context.go('/login'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.supinfoPurple,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('Retour à la connexion'),
          ),
        ),
      ],
    );
  }
}
