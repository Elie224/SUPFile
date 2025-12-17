import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart';

import 'providers/auth_provider.dart';
import 'providers/files_provider.dart';
import 'providers/theme_provider.dart';
import 'routes/app_router.dart';
import 'utils/constants.dart';
import 'utils/http_cache.dart';
import 'utils/performance_optimizer.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialiser le cache HTTP de manière asynchrone
  HttpCache.initialize();
  
  // Nettoyer le cache expiré au démarrage
  PerformanceOptimizer.cleanExpiredCache();
  
  runApp(const SUPFileApp());
}

class SUPFileApp extends StatelessWidget {
  const SUPFileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => FilesProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          return MaterialApp.router(
            title: 'SUPFile',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.light(
                primary: AppConstants.supinfoPurple,
                secondary: AppConstants.supinfoPurpleLight,
                surface: AppConstants.supinfoWhite,
                background: AppConstants.supinfoGrey,
                error: AppConstants.errorColor,
                onPrimary: AppConstants.supinfoWhite,
                onSecondary: AppConstants.supinfoWhite,
                onSurface: AppConstants.supinfoPurpleDark,
                onBackground: AppConstants.supinfoPurpleDark,
                onError: AppConstants.supinfoWhite,
                brightness: Brightness.light,
              ),
              scaffoldBackgroundColor: AppConstants.supinfoGrey,
              appBarTheme: AppBarTheme(
                backgroundColor: AppConstants.supinfoPurple,
                foregroundColor: AppConstants.supinfoWhite,
                elevation: 0,
                centerTitle: true,
                titleTextStyle: const TextStyle(
                  color: AppConstants.supinfoWhite,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.supinfoPurple,
                  foregroundColor: AppConstants.supinfoWhite,
                  elevation: 2,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              inputDecorationTheme: InputDecorationTheme(
                filled: true,
                fillColor: AppConstants.supinfoWhite,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppConstants.supinfoPurple, width: 2),
                ),
                errorBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppConstants.errorColor),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              ),
              cardTheme: CardTheme(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                color: AppConstants.supinfoWhite,
              ),
            ),
            darkTheme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.dark(
                primary: AppConstants.supinfoPurpleLight,
                secondary: AppConstants.supinfoPurple,
                surface: const Color(0xFF1E1E1E),
                background: const Color(0xFF121212),
                error: AppConstants.errorColor,
                onPrimary: AppConstants.supinfoWhite,
                onSecondary: AppConstants.supinfoWhite,
                onSurface: AppConstants.supinfoWhite,
                onBackground: AppConstants.supinfoWhite,
                onError: AppConstants.supinfoWhite,
                brightness: Brightness.dark,
              ),
              scaffoldBackgroundColor: const Color(0xFF121212),
              appBarTheme: AppBarTheme(
                backgroundColor: AppConstants.supinfoPurpleDark,
                foregroundColor: AppConstants.supinfoWhite,
                elevation: 0,
                centerTitle: true,
                titleTextStyle: const TextStyle(
                  color: AppConstants.supinfoWhite,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.supinfoPurpleLight,
                  foregroundColor: AppConstants.supinfoWhite,
                  elevation: 2,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              inputDecorationTheme: InputDecorationTheme(
                filled: true,
                fillColor: const Color(0xFF1E1E1E),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade700),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade700),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppConstants.supinfoPurpleLight, width: 2),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              ),
              cardTheme: CardTheme(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                color: const Color(0xFF1E1E1E),
              ),
            ),
            themeMode: themeProvider.themeMode,
            locale: const Locale('fr', 'FR'),
            supportedLocales: const [
              Locale('fr', 'FR'),
            ],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            routerConfig: AppRouter.createRouter(context),
          );
        },
      ),
    );
  }
}

