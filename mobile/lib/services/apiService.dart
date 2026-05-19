import 'dart:io';
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../models/models.dart';

class ApiService {
  late final Dio _dio;

  // Base API URL configuration
  // Smart Emulator mapping: Android emulators map localhost to 10.0.2.2
  static String get baseUrl {
    const String defaultHost = 'http://127.0.0.1:5001/aaa-online-registration-e3833/us-central1/api';
    if (!kIsWeb && Platform.isAndroid) {
      return defaultHost.replaceAll('127.0.0.1', '10.0.2.2');
    }
    return defaultHost;
  }

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ));

    // Token Injector Interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        try {
          final user = FirebaseAuth.instance.currentUser;
          if (user != null) {
            // Get fresh token (will refresh automatically if expired)
            final String? idToken = await user.getIdToken(true);
            if (idToken != null) {
              options.headers['Authorization'] = 'Bearer $idToken';
            }
          }
        } catch (e) {
          debugPrint('Error attaching Firebase token to request: $e');
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        debugPrint('Dio API Error [${e.response?.statusCode}]: ${e.message}');
        return handler.next(e);
      },
    ));
  }

  // --- Student Operations ---

  Future<List<Student>> getStudents(String parentId) async {
    try {
      final response = await _dio.get('/students/parent/$parentId');
      if (response.statusCode == 200) {
        final List data = response.data ?? [];
        return data.map((json) => Student.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to load students: $e');
    }
  }

  // --- Enrollment Operations ---

  Future<List<Enrollment>> getEnrollments(String parentId) async {
    try {
      final response = await _dio.get('/enrollments/parent/$parentId');
      if (response.statusCode == 200) {
        final List data = response.data['data'] ?? [];
        return data.map((json) => Enrollment.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to load enrollments: $e');
    }
  }

  // --- Attendance Operations ---

  Future<List<AttendanceRecord>> getAttendanceForClass(String classId, String studentId) async {
    try {
      final response = await _dio.get('/attendance/$classId');
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = response.data ?? {};
        final List<AttendanceRecord> records = [];

        // Parse attendance map: sessionId -> { studentId: status }
        data.forEach((sessionIdStr, statusesMap) {
          final int? sessionId = int.tryParse(sessionIdStr);
          if (sessionId != null && statusesMap is Map) {
            final String? status = statusesMap[studentId]?.toString();
            if (status != null) {
              records.add(AttendanceRecord(
                sessionId: sessionId,
                status: status,
              ));
            }
          }
        });

        // Sort by sessionId ascending
        records.sort((a, b) => a.sessionId.compareTo(b.sessionId));
        return records;
      }
      return [];
    } catch (e) {
      throw Exception('Failed to load attendance: $e');
    }
  }

  // --- Performance Operations ---

  Future<List<AcademicPerformance>> getPerformanceForStudent(String studentId) async {
    try {
      final response = await _dio.get('/performance/student/$studentId');
      if (response.statusCode == 200) {
        final List data = response.data ?? [];
        return data.map((json) => AcademicPerformance.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to load academic performance: $e');
    }
  }
}
