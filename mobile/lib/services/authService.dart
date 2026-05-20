import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'apiService.dart';
import 'package:dio/dio.dart';

class AuthService extends ChangeNotifier {
  fb.FirebaseAuth? _auth;
  fb.User? _user;
  Map<String, dynamic>? _parentProfile;
  bool _isLoading = false;
  bool _isMockMode = false;

  fb.User? get user => _user;
  Map<String, dynamic>? get parentProfile => _parentProfile;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  bool get isMockMode => _isMockMode;

  AuthService() {
    try {
      // Accessing Firebase.app() will throw an exception if the default app is not initialized
      Firebase.app();
      _auth = fb.FirebaseAuth.instance;
      _auth!.authStateChanges().listen((fb.User? user) async {
        _user = user;
        if (user != null) {
          await fetchParentProfile();
        } else {
          _parentProfile = null;
        }
        notifyListeners();
      });
    } catch (e) {
      _isMockMode = true;
      _auth = null;
      debugPrint("Firebase core not initialized or configuration missing ($e). Running in Offline Mock Mode.");
    }
  }

  Future<void> fetchParentProfile() async {
    if (_user == null || _isMockMode) return;
    try {
      final dio = Dio(BaseOptions(baseUrl: ApiService.baseUrl));
      final token = await _user!.getIdToken();
      
      final response = await dio.get(
        '/auth/me',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        _parentProfile = response.data;
        // Strict Mobile Rule: Verify role is 'parent'
        if (_parentProfile?['role'] != 'parent') {
          await signOut();
          throw Exception('Access Denied: Only Parent accounts are permitted on this application.');
        }
      }
    } catch (e) {
      debugPrint('Error fetching parent profile: $e');
      _parentProfile = null;
    }
  }

  Future<void> signIn(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      if (_isMockMode) {
        await Future.delayed(const Duration(milliseconds: 800));
        if (email.contains('@') && password.length >= 6) {
          _user = MockUser(uid: 'mock-parent-1', email: email);
          _parentProfile = {
            'id': 'mock-parent-1',
            'name': 'Mock Parent User',
            'email': email,
            'phone': '123-456-7890',
            'role': 'parent',
            'status': 'active'
          };
        } else {
          throw Exception('Invalid email or password (min 6 characters required).');
        }
      } else {
        await _auth!.signInWithEmailAndPassword(email: email, password: password);
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> register(String email, String password, String name, String phone) async {
    _isLoading = true;
    notifyListeners();
    try {
      if (_isMockMode) {
        await Future.delayed(const Duration(milliseconds: 800));
        _user = MockUser(uid: 'mock-parent-1', email: email);
        _parentProfile = {
          'id': 'mock-parent-1',
          'name': name,
          'email': email,
          'phone': phone,
          'role': 'parent',
          'status': 'active'
        };
      } else {
        // 1. Create firebase user
        final credential = await _auth!.createUserWithEmailAndPassword(email: email, password: password);
        final uid = credential.user?.uid;

        if (uid != null) {
          // 2. Register profile in the backend
          final dio = Dio(BaseOptions(baseUrl: ApiService.baseUrl));
          await dio.post('/auth/register', data: {
            'id': uid,
            'email': email,
            'name': name,
            'phone': phone,
            'role': 'parent',
            'status': 'active'
          });
        }
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> signOut() async {
    if (!_isMockMode && _auth != null) {
      await _auth!.signOut();
    }
    _user = null;
    _parentProfile = null;
    notifyListeners();
  }
}

class MockUser implements fb.User {
  @override
  final String uid;
  @override
  final String? email;

  MockUser({required this.uid, this.email});

  @override
  Future<String> getIdToken([bool forceRefresh = false]) async {
    return 'mock-id-token';
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
