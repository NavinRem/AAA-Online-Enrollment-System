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
      title: 'AAA Enrollment Parent Portal',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3B82F6), // Ocean Blue token matching Web modernization branding
          primary: const Color(0xFF2563EB),
          secondary: const Color(0xFF10B981), // Premium Emerald green for positive payment triggers
        ),
        textTheme: const TextTheme(
          headlineMedium: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold),
          bodyMedium: TextStyle(fontFamily: 'Inter'),
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
