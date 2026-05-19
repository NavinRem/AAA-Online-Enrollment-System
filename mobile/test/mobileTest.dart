import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import '../lib/models/models.dart';
import '../lib/services/apiService.dart';
import '../lib/services/authService.dart';
import '../lib/views/loginView.dart';

void main() {
  group('1. Data Model Deserialization Tests', () {
    test('Student model JSON deserialization', () {
      final json = {
        'id': 'stud-123',
        'parentId': 'parent-456',
        'name': 'Alex Johnson',
        'dob': '2018-05-15',
        'age': 8,
        'profileURL': 'https://example.com/alex.jpg',
        'status': 'active'
      };

      final student = Student.fromJson(json);

      expect(student.id, 'stud-123');
      expect(student.parentId, 'parent-456');
      expect(student.name, 'Alex Johnson');
      expect(student.dob, '2018-05-15');
      expect(student.age, 8);
      expect(student.profileURL, 'https://example.com/alex.jpg');
      expect(student.status, 'active');
    });

    test('Enrollment model JSON deserialization', () {
      final json = {
        'id': 'enroll-789',
        'studentId': 'stud-123',
        'parentId': 'parent-456',
        'classId': 'class-1',
        'amount': 250.00,
        'status': 'active',
        'paymentStatus': 'paid',
        'program': {'name': 'Youth Basketball Academy'},
        'class': {
          'name': 'Monday Class A',
          'schedule': {'timeslot': '4:00 PM - 5:00 PM', 'day': 'Monday'}
        }
      };

      final enrollment = Enrollment.fromJson(json);

      expect(enrollment.id, 'enroll-789');
      expect(enrollment.programName, 'Youth Basketball Academy');
      expect(enrollment.className, 'Monday Class A');
      expect(enrollment.day, 'Monday');
      expect(enrollment.timeslot, '4:00 PM - 5:00 PM');
      expect(enrollment.amount, 250.00);
      expect(enrollment.paymentStatus, 'paid');
    });

    test('AcademicPerformance model JSON deserialization', () {
      final json = {
        'id': 'perf-999',
        'studentId': 'stud-123',
        'classId': 'class-1',
        'termId': 'term-4',
        'studentName': 'Alex Johnson',
        'className': 'Youth Basketball Academy',
        'termName': 'Spring 2026',
        'skillsMastered': ['Dribbling', 'Chest Pass', 'Layup'],
        'overallGrade': 'Outstanding',
        'teacherRemarks': 'Great team player! Excellent progress.',
        'evaluationDate': '2026-05-19T02:00:00Z'
      };

      final performance = AcademicPerformance.fromJson(json);

      expect(performance.id, 'perf-999');
      expect(performance.skillsMastered, contains('Chest Pass'));
      expect(performance.overallGrade, 'Outstanding');
      expect(performance.teacherRemarks, contains('Great team player'));
    });
  });

  group('2. API Logic Verification', () {
    test('ApiService smart base URL transformation', () {
      final url = ApiService.baseUrl;
      expect(url, isNotEmpty);
      // Ensure it contains default address
      expect(url.contains('aaa-online-registration-e3833'), isTrue);
    });
  });

  group('3. UI Rendering & Widget Verification', () {
    testWidgets('LoginView rendering validation', (WidgetTester tester) async {
      // Build LoginView within a MaterialApp and Provider
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider(
            create: (_) => AuthService(),
            child: const Scaffold(
              body: LoginView(),
            ),
          ),
        ),
      );

      // Verify page titles and structures render successfully
      expect(find.text('AAA Portal Login'), findsOneWidget);
      expect(find.byIcon(Icons.school_rounded), findsOneWidget);
      expect(find.text('Email Address'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Sign In'), findsOneWidget);
      expect(find.text("Don't have an account? Register Profile"), findsOneWidget);
    });
  });
}
