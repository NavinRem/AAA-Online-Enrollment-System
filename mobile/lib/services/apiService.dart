import 'dart:io';
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
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
          // Verify Firebase has a default app initialized
          Firebase.app();
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
  bool _isFirebaseInitialized() {
    try {
      Firebase.app();
      return true;
    } catch (_) {
      return false;
    }
  }

  // --- Student Operations ---

  Future<List<Student>> getStudents(String parentId) async {
    try {
      if (!_isFirebaseInitialized()) {
        return _getMockStudents(parentId);
      }
      final response = await _dio.get('/students/parent/$parentId');
      if (response.statusCode == 200) {
        final List data = response.data ?? [];
        return data.map((json) => Student.fromJson(json)).toList();
      }
      return _getMockStudents(parentId);
    } catch (e) {
      debugPrint('Error loading students from API, using mock data: $e');
      return _getMockStudents(parentId);
    }
  }

  List<Student> _getMockStudents(String parentId) {
    return [
      Student(
        id: 'mock-student-1',
        parentId: parentId.isNotEmpty ? parentId : 'mock-parent-1',
        name: 'Jimmy Doe',
        dob: '2016-08-15',
        age: 9,
        status: 'active',
      ),
      Student(
        id: 'mock-student-2',
        parentId: parentId.isNotEmpty ? parentId : 'mock-parent-1',
        name: 'Janey Doe',
        dob: '2018-04-20',
        age: 8,
        status: 'active',
      ),
    ];
  }

  // --- Enrollment Operations ---

  Future<List<Enrollment>> getEnrollments(String parentId) async {
    try {
      if (!_isFirebaseInitialized()) {
        return _getMockEnrollments(parentId);
      }
      final response = await _dio.get('/enrollments/parent/$parentId');
      if (response.statusCode == 200) {
        final List data = response.data['data'] ?? [];
        return data.map((json) => Enrollment.fromJson(json)).toList();
      }
      return _getMockEnrollments(parentId);
    } catch (e) {
      debugPrint('Error loading enrollments from API, using mock data: $e');
      return _getMockEnrollments(parentId);
    }
  }

  List<Enrollment> _getMockEnrollments(String parentId) {
    return [
      Enrollment(
        id: 'mock-enroll-1',
        studentId: 'mock-student-1',
        parentId: parentId.isNotEmpty ? parentId : 'mock-parent-1',
        classId: 'mock-class-1',
        programId: 'mock-prog-1',
        programName: 'Coding for Kids',
        className: 'Scratch Beginners (Tue)',
        timeslot: '16:00 - 17:30',
        day: 'Tuesday',
        amount: 250.0,
        status: 'active',
        paymentStatus: 'paid',
      ),
      Enrollment(
        id: 'mock-enroll-2',
        studentId: 'mock-student-2',
        parentId: parentId.isNotEmpty ? parentId : 'mock-parent-1',
        classId: 'mock-class-2',
        programId: 'mock-prog-2',
        programName: 'Python for Beginners',
        className: 'Python Intro (Thu)',
        timeslot: '16:00 - 17:30',
        day: 'Thursday',
        amount: 300.0,
        status: 'active',
        paymentStatus: 'paid',
      ),
    ];
  }

  // --- Attendance Operations ---

  Future<List<AttendanceRecord>> getAttendanceForClass(String classId, String studentId) async {
    try {
      if (!_isFirebaseInitialized()) {
        return _getMockAttendance(classId, studentId);
      }
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
      return _getMockAttendance(classId, studentId);
    } catch (e) {
      debugPrint('Error loading attendance from API, using mock data: $e');
      return _getMockAttendance(classId, studentId);
    }
  }

  List<AttendanceRecord> _getMockAttendance(String classId, String studentId) {
    return [
      AttendanceRecord(sessionId: 1, status: 'present'),
      AttendanceRecord(sessionId: 2, status: 'present'),
      AttendanceRecord(sessionId: 3, status: 'absent'),
      AttendanceRecord(sessionId: 4, status: 'present'),
      AttendanceRecord(sessionId: 5, status: 'present'),
      AttendanceRecord(sessionId: 6, status: 'present'),
    ];
  }

  // --- Performance Operations ---

  Future<List<AcademicPerformance>> getPerformanceForStudent(String studentId) async {
    try {
      if (!_isFirebaseInitialized()) {
        return _getMockPerformance(studentId);
      }
      final response = await _dio.get('/performance/student/$studentId');
      if (response.statusCode == 200) {
        final List data = response.data ?? [];
        return data.map((json) => AcademicPerformance.fromJson(json)).toList();
      }
      return _getMockPerformance(studentId);
    } catch (e) {
      debugPrint('Error loading academic performance from API, using mock data: $e');
      return _getMockPerformance(studentId);
    }
  }

  List<AcademicPerformance> _getMockPerformance(String studentId) {
    final bool isJimmy = studentId == 'mock-student-1';
    return [
      AcademicPerformance(
        id: 'mock-perf-1',
        studentId: studentId,
        classId: isJimmy ? 'mock-class-1' : 'mock-class-2',
        termId: 'term-active',
        studentName: isJimmy ? 'Jimmy Doe' : 'Janey Doe',
        className: isJimmy ? 'Scratch Beginners (Tue)' : 'Python Intro (Thu)',
        termName: 'Active Summer Term',
        skillsMastered: isJimmy 
            ? ['Sequential Logic', 'Loops', 'Variables & States', 'Conditional Logic'] 
            : ['Basic Syntax', 'Variables', 'Conditional Statements', 'Functions'],
        overallGrade: 'Excellent',
        teacherRemarks: isJimmy 
            ? 'Jimmy has shown outstanding logical thinking skills. He is highly engaged and helps his peers during group exercises.' 
            : 'Janey grasps coding syntax concepts very quickly and asks insightful questions. Keep up the great work!',
        evaluationDate: DateTime.now().subtract(const Duration(days: 3)),
      ),
    ];
  }
}
