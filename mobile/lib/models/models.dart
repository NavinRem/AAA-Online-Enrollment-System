class Student {
  final String id;
  final String parentId;
  final String name;
  final String dob;
  final int age;
  final String? profileURL;
  final String status;

  Student({
    required this.id,
    required this.parentId,
    required this.name,
    required this.dob,
    required this.age,
    this.profileURL,
    required this.status,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] ?? '',
      parentId: json['parentId'] ?? '',
      name: json['name'] ?? '',
      dob: json['dob'] ?? '',
      age: json['age'] ?? 0,
      profileURL: json['profileURL'],
      status: json['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parentId': parentId,
      'name': name,
      'dob': dob,
      'age': age,
      'profileURL': profileURL,
      'status': status,
    };
  }
}

class Enrollment {
  final String id;
  final String studentId;
  final String parentId;
  final String classId;
  final String programId;
  final String programName;
  final String className;
  final String timeslot;
  final String day;
  final double amount;
  final String status;
  final String paymentStatus;

  Enrollment({
    required this.id,
    required this.studentId,
    required this.parentId,
    required this.classId,
    required this.programId,
    required this.programName,
    required this.className,
    required this.timeslot,
    required this.day,
    required this.amount,
    required this.status,
    required this.paymentStatus,
  });

  factory Enrollment.fromJson(Map<String, dynamic> json) {
    final programData = json['program'] ?? {};
    final classData = json['class'] ?? {};
    final scheduleData = classData['schedule'] ?? {};

    return Enrollment(
      id: json['id'] ?? '',
      studentId: json['studentId'] ?? '',
      parentId: json['parentId'] ?? '',
      classId: json['classId'] ?? '',
      programId: json['programId'] ?? '',
      programName: programData['name'] ?? 'Program',
      className: classData['name'] ?? 'Class',
      timeslot: scheduleData['timeslot'] ?? 'TBD',
      day: scheduleData['day'] ?? 'TBD',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] ?? 'unpaid',
      paymentStatus: json['paymentStatus'] ?? 'unpaid',
    );
  }
}

class AttendanceRecord {
  final int sessionId;
  final String status;

  AttendanceRecord({
    required this.sessionId,
    required this.status,
  });
}

class AcademicPerformance {
  final String id;
  final String studentId;
  final String classId;
  final String termId;
  final String studentName;
  final String className;
  final String termName;
  final List<String> skillsMastered;
  final String overallGrade;
  final String teacherRemarks;
  final DateTime evaluationDate;

  AcademicPerformance({
    required this.id,
    required this.studentId,
    required this.classId,
    required this.termId,
    required this.studentName,
    required this.className,
    required this.termName,
    required this.skillsMastered,
    required this.overallGrade,
    required this.teacherRemarks,
    required this.evaluationDate,
  });

  factory AcademicPerformance.fromJson(Map<String, dynamic> json) {
    return AcademicPerformance(
      id: json['id'] ?? '',
      studentId: json['studentId'] ?? '',
      classId: json['classId'] ?? '',
      termId: json['termId'] ?? '',
      studentName: json['studentName'] ?? 'Student',
      className: json['className'] ?? 'Class',
      termName: json['termName'] ?? 'Term',
      skillsMastered: List<String>.from(json['skillsMastered'] ?? []),
      overallGrade: json['overallGrade'] ?? 'Satisfactory',
      teacherRemarks: json['teacherRemarks'] ?? '',
      evaluationDate: DateTime.parse(json['evaluationDate'] ?? DateTime.now().toIso8601String()),
    );
  }
}
