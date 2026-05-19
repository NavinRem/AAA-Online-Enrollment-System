import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/apiService.dart';
import '../models/models.dart';

class StudentDetailsView extends StatefulWidget {
  final Student student;

  const StudentDetailsView({super.key, required this.student});

  @override
  State<StudentDetailsView> createState() => _StudentDetailsViewState();
}

class _StudentDetailsViewState extends State<StudentDetailsView> {
  final ApiService _apiService = ApiService();
  late Future<List<Enrollment>> _enrollmentsFuture;
  late Future<List<AcademicPerformance>> _performanceFuture;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  void _refreshData() {
    setState(() {
      _enrollmentsFuture = _apiService.getEnrollments(widget.student.parentId).then((list) {
        // Filter in-memory for this student's enrollments only
        return list.where((e) => e.studentId == widget.student.id).toList();
      });
      _performanceFuture = _apiService.getPerformanceForStudent(widget.student.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: Colors.grey[50],
        appBar: AppBar(
          title: Text(widget.student.name),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.class_outlined), text: "Enrollments"),
              Tab(icon: Icon(Icons.calendar_today_outlined), text: "Attendance"),
              Tab(icon: Icon(Icons.assessment_outlined), text: "Performance"),
            ],
          ),
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            _refreshData();
          },
          child: TabBarView(
            children: [
              _buildEnrollmentsTab(),
              _buildAttendanceTab(),
              _buildPerformanceTab(),
            ],
          ),
        ),
      ),
    );
  }

  // --- 1. Enrollments Tab ---
  Widget _buildEnrollmentsTab() {
    return FutureBuilder<List<Enrollment>>(
      future: _enrollmentsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text("Error: ${snapshot.error}", style: const TextStyle(color: Colors.red)));
        }

        final enrollments = snapshot.data ?? [];
        if (enrollments.isEmpty) {
          return const Center(child: Text("No active class enrollments found."));
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: enrollments.length,
          itemBuilder: (context, index) {
            final enrollment = enrollments[index];
            final isPaid = enrollment.paymentStatus.toLowerCase() == 'paid';

            return Card(
              elevation: 1,
              color: Colors.white,
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            enrollment.programName,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isPaid ? Colors.green.shade50 : Colors.red.shade50,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: isPaid ? Colors.green.shade100 : Colors.red.shade100),
                          ),
                          child: Text(
                            enrollment.paymentStatus.toUpperCase(),
                            style: TextStyle(
                              color: isPaid ? Colors.green.shade800 : Colors.red.shade800,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      children: [
                        const Icon(Icons.schedule_rounded, size: 16, color: Colors.grey),
                        const SizedBox(width: 8),
                        Text(
                          "${enrollment.day} | ${enrollment.timeslot}",
                          style: TextStyle(color: Colors.grey[700], fontSize: 13),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.attach_money_rounded, size: 16, color: Colors.grey),
                        const SizedBox(width: 8),
                        Text(
                          "\$${enrollment.amount.toStringAsFixed(2)} total term fee",
                          style: TextStyle(color: Colors.grey[700], fontSize: 13),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  // --- 2. Attendance Tab ---
  Widget _buildAttendanceTab() {
    return FutureBuilder<List<Enrollment>>(
      future: _enrollmentsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final enrollments = snapshot.data ?? [];
        if (enrollments.isEmpty) {
          return const Center(child: Text("No enrollments to track attendance."));
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: enrollments.length,
          itemBuilder: (context, index) {
            final enrollment = enrollments[index];
            return _buildClassAttendanceCard(enrollment);
          },
        );
      },
    );
  }

  Widget _buildClassAttendanceCard(Enrollment enrollment) {
    return Card(
      elevation: 1,
      color: Colors.white,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              enrollment.programName,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            Text(
              enrollment.className,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            const Divider(height: 24),
            
            // Fetch and render actual attendance sessions
            FutureBuilder<List<AttendanceRecord>>(
              future: _apiService.getAttendanceForClass(enrollment.classId, widget.student.id),
              builder: (context, attendanceSnap) {
                if (attendanceSnap.connectionState == ConnectionState.waiting) {
                  return const SizedBox(height: 40, child: Center(child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))));
                }
                final records = attendanceSnap.data ?? [];
                if (records.isEmpty) {
                  return Text("No attendance registered for this class yet.", style: TextStyle(color: Colors.grey[500], fontSize: 13));
                }

                // Grid mapping out visual badges matching Web system tokens
                return Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: records.map((record) {
                    Color bgColor = Colors.grey.shade100;
                    Color textColor = Colors.grey.shade700;
                    String statusLabel = 'N';

                    switch (record.status.toLowerCase()) {
                      case 'p':
                        bgColor = Colors.green.shade50;
                        textColor = Colors.green.shade700;
                        statusLabel = 'PRESENT';
                        break;
                      case 'a':
                        bgColor = Colors.red.shade50;
                        textColor = Colors.red.shade700;
                        statusLabel = 'ABSENT';
                        break;
                      case 'l':
                        bgColor = Colors.amber.shade50;
                        textColor = Colors.amber.shade800;
                        statusLabel = 'LATE';
                        break;
                    }

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: bgColor == Colors.grey.shade100 ? Colors.grey.shade200 : Colors.transparent),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            "Session ${record.sessionId}",
                            style: TextStyle(fontSize: 10, color: Colors.grey[700]),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            statusLabel,
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColor),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  // --- 3. Performance Tab ---
  Widget _buildPerformanceTab() {
    return FutureBuilder<List<AcademicPerformance>>(
      future: _performanceFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text("Error: ${snapshot.error}", style: const TextStyle(color: Colors.red)));
        }

        final reports = snapshot.data ?? [];
        if (reports.isEmpty) {
          return const Center(child: Text("No academic evaluations registered for this student yet."));
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: reports.length,
          itemBuilder: (context, index) {
            final report = reports[index];
            final dateStr = DateFormat('MMM dd, yyyy').format(report.evaluationDate);

            return Card(
              elevation: 1,
              color: Colors.white,
              margin: const EdgeInsets.only(bottom: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                report.className,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                              ),
                              Text(
                                "Evaluation: $dateStr",
                                style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.blue.shade100),
                          ),
                          child: Text(
                            report.overallGrade.toUpperCase(),
                            style: TextStyle(
                              color: Colors.blue.shade800,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    const Text(
                      "Skills & Techniques Mastered:",
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black54),
                    ),
                    const SizedBox(height: 6),
                    if (report.skillsMastered.isEmpty)
                      const Text("No skills reported yet.")
                    else
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: report.skillsMastered.map((skill) {
                          return Chip(
                            label: Text(skill, style: const TextStyle(fontSize: 11)),
                            visualDensity: VisualDensity.compact,
                            backgroundColor: Colors.grey.shade50,
                          );
                        }).toList(),
                      ),
                    if (report.teacherRemarks.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const Text(
                        "Teacher Remarks:",
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black54),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade100),
                        ),
                        child: Text(
                          report.teacherRemarks,
                          style: TextStyle(color: Colors.grey[700], fontSize: 13, fontStyle: FontStyle.italic),
                        ),
                      ),
                    ]
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
