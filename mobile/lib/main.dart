import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'services/authService.dart';
import 'views/loginView.dart';
import 'views/dashboardView.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Note: Local developers must configure their specific firebase platform option configs here
  // or place google-services.json / GoogleService-Info.plist into the native Android/iOS project directories.
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint("Firebase initialization note (requires configuration files): $e");
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AAA Student Connect',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC), // Slate 50 (Page background)
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF0EA5E9), // Sky 500 (Primary Blue)
          secondary: Color(0xFF10B981), // Emerald 500 (Success Green)
          error: Color(0xFFEF4444), // Red 500 (Error)
          surface: Colors.white,
          onPrimary: Colors.white,
          onSecondary: Colors.white,
          onError: Colors.white,
          onSurface: Color(0xFF0F172A), // Slate 900
        ),
        textTheme: const TextTheme(
          headlineMedium: TextStyle(
            fontFamily: 'Outfit',
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A), // Slate 900
          ),
          titleLarge: TextStyle(
            fontFamily: 'Outfit',
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A),
          ),
          bodyLarge: TextStyle(
            fontFamily: 'Inter',
            color: Color(0xFF1E293B), // Slate 800
          ),
          bodyMedium: TextStyle(
            fontFamily: 'Inter',
            color: Color(0xFF475569), // Slate 600
          ),
          bodySmall: TextStyle(
            fontFamily: 'Inter',
            color: Color(0xFF64748B), // Slate 500
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
          iconTheme: IconThemeData(color: Color(0xFF1E293B)),
          titleTextStyle: TextStyle(
            fontFamily: 'Outfit',
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A),
            fontSize: 20,
          ),
        ),
        cardTheme: CardTheme(
          color: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFF1F5F9), width: 1.5),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0EA5E9),
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
          ),
          labelStyle: const TextStyle(color: Color(0xFF64748B)),
          floatingLabelStyle: const TextStyle(color: Color(0xFF0EA5E9)),
          prefixIconColor: const Color(0xFF64748B),
        ),
        tabBarTheme: const TabBarTheme(
          labelColor: Color(0xFF0EA5E9),
          unselectedLabelColor: Color(0xFF64748B),
          indicatorColor: Color(0xFF0EA5E9),
          indicatorSize: TabBarIndicatorSize.tab,
          labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          unselectedLabelStyle: TextStyle(fontWeight: FontWeight.normal, fontSize: 13),
        ),
      ),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();

    // Route gate based on active user context and authenticated parent role
    if (authService.isAuthenticated && authService.parentProfile != null) {
      return const DashboardView();
    }
    
    return const LoginView();
  }
}
