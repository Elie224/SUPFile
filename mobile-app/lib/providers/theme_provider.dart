import 'package:flutter/material.dart';

class ThemeProvider with ChangeNotifier {
  // Seulement 2 thèmes: clair et sombre (pas de mode système)
  ThemeMode _themeMode = ThemeMode.light;

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;
  bool get isLightMode => _themeMode == ThemeMode.light;

  void setThemeMode(ThemeMode mode) {
    _themeMode = mode == ThemeMode.system ? ThemeMode.light : mode;
    notifyListeners();
  }

  void toggleTheme() {
    _themeMode =
        _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }
}
