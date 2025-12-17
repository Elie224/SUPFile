import 'package:flutter/material.dart';
import '../utils/constants.dart';

/// Widget logo personnalisé pour SUPFile
/// Affiche le texte "supfile" avec un style moderne et élégant
class SupFileLogo extends StatelessWidget {
  final double size;
  final bool showIcon;
  final Color? textColor;
  final bool useGradient;

  const SupFileLogo({
    super.key,
    this.size = 120,
    this.showIcon = true,
    this.textColor,
    this.useGradient = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final effectiveTextColor = textColor ?? 
        (isDark ? AppConstants.supinfoWhite : AppConstants.supinfoPurple);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (showIcon)
          Container(
            width: size,
            height: size,
            padding: EdgeInsets.all(size * 0.2),
            decoration: BoxDecoration(
              gradient: useGradient
                  ? const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppConstants.supinfoPurple,
                        AppConstants.supinfoPurpleLight,
                      ],
                    )
                  : null,
              color: useGradient ? null : AppConstants.supinfoPurple,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppConstants.supinfoPurple.withOpacity(0.3),
                  blurRadius: 20,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Center(
              child: Text(
                'supfile',
                style: TextStyle(
                  fontSize: size * 0.28,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.supinfoWhite,
                  letterSpacing: 2.0,
                  height: 1.0,
                  shadows: [
                    Shadow(
                      color: Colors.black.withOpacity(0.3),
                      offset: const Offset(0, 2),
                      blurRadius: 4,
                    ),
                  ],
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        if (showIcon) SizedBox(height: size * 0.3),
        // Texte "SUPFile" en dessous
        ShaderMask(
          shaderCallback: (bounds) {
            if (useGradient) {
              return const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppConstants.supinfoPurple,
                  AppConstants.supinfoPurpleLight,
                ],
              ).createShader(bounds);
            }
            return LinearGradient(
              colors: [effectiveTextColor, effectiveTextColor],
            ).createShader(bounds);
          },
          child: Text(
            'SUPFile',
            style: TextStyle(
              fontSize: size * 0.35,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: 2.0,
            ),
          ),
        ),
      ],
    );
  }
}

/// Version compacte du logo (juste le texte)
class SupFileLogoCompact extends StatelessWidget {
  final double fontSize;
  final Color? color;
  final bool useGradient;

  const SupFileLogoCompact({
    super.key,
    this.fontSize = 32,
    this.color,
    this.useGradient = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final effectiveColor = color ?? 
        (isDark ? AppConstants.supinfoWhite : AppConstants.supinfoPurple);

    if (useGradient) {
      return ShaderMask(
        shaderCallback: (bounds) {
          return const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppConstants.supinfoPurple,
              AppConstants.supinfoPurpleLight,
            ],
          ).createShader(bounds);
        },
        child: Text(
          'supfile',
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            letterSpacing: 1.5,
          ),
        ),
      );
    }

    return Text(
      'supfile',
      style: TextStyle(
        fontSize: fontSize,
        fontWeight: FontWeight.bold,
        color: effectiveColor,
        letterSpacing: 1.5,
      ),
    );
  }
}

