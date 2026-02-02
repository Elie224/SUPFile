import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Back button that works with GoRouter even when the screen
/// was reached via `context.go()` (no back stack).
class AppBackButton extends StatelessWidget {
  final String fallbackLocation;
  final Color? color;

  const AppBackButton({
    super.key,
    this.fallbackLocation = '/dashboard',
    this.color,
  });

  void _handleBack(BuildContext context) {
    final router = GoRouter.of(context);
    if (router.canPop()) {
      router.pop();
      return;
    }
    router.go(fallbackLocation);
  }

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      color: color,
      tooltip: 'Retour',
      onPressed: () => _handleBack(context),
    );
  }
}
