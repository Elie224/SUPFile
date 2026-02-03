import 'package:flutter/material.dart';

class ResponsiveCenter extends StatelessWidget {
  final Widget child;
  final double maxWidth;
  final EdgeInsetsGeometry? padding;
  final bool safeArea;
  final AlignmentGeometry alignment;

  const ResponsiveCenter({
    super.key,
    required this.child,
    this.maxWidth = 720,
    this.padding,
    this.safeArea = false,
    this.alignment = Alignment.topCenter,
  });

  EdgeInsets _defaultPaddingForWidth(double width) {
    final horizontal = width < 360
        ? 12.0
        : width < 600
            ? 16.0
            : 24.0;
    return EdgeInsets.symmetric(horizontal: horizontal, vertical: 16);
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    Widget content = Padding(
      padding: padding ?? _defaultPaddingForWidth(width),
      child: Align(
        alignment: alignment,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: child,
        ),
      ),
    );

    if (safeArea) {
      content = SafeArea(child: content);
    }

    return content;
  }
}
