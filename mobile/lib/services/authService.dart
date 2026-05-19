import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter/foundation.dart';
import 'apiService.dart';
import 'package:dio/dio.dart';

class AuthService extends ChangeNotifier {
  final fb.FirebaseAuth _auth = fb.FirebaseAuth.instance;
  fb.User? _user;
  Map<String, dynamic>? _parentProfile;
  bool _isLoading = false;

  fb.User? get user => _user;
  Map<String, dynamic>? get parentProfile => _parentProfile;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  AuthService() {
    _auth.authStateChanges().listen((fb.User? user) async {
      _user = user;
      if (user != null) {
        await fetchParentProfile();
      } else {
        _parentProfile = null;
      }
      notifyListeners();
    });
  }

  Future<void> fetchParentProfile() async {
    if (_user == null) return;
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
      await _auth.signInWithEmailAndPassword(email: email, password: password);
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
      // 1. Create firebase user
      final credential = await _auth.createUserWithEmailAndPassword(email: email, password: password);
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
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> signOut() async {
    await _auth.signOut();
    _user = null;
    _parentProfile = null;
    notifyListeners();
  }
}
