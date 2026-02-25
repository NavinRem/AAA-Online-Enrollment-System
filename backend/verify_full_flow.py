import requests
import json
import sys
import time

BASE_URL = "https://api-tyweqke5oa-uc.a.run.app"
PARENT_ID = "test-parent-integration-001"
STUDENT_NAME = "Integration Student"
DOB = "2016-06-01"

def log(msg):
    print(f"[TEST] {msg}")

def run_tests():
    session = requests.Session()
    
    # ---------------------------------------------------------
    # 1. Create Course (Admin Flow - usually restricted, but API might allow for now)
    # ---------------------------------------------------------
    log("1. Creating Course...")
    course_payload = {
        "title": "Integration Testing 101",
        "category": "Testing",
        "description": "A course for testing full flow",
        "price": 100,
        "number_session": 5,
        "level": "beginner"
    }
    # Note: Using /courses endpoint generally maps to courseController.createCourse
    resp = session.post(f"{BASE_URL}/courses", json=course_payload)
    if resp.status_code not in [200, 201]:
        log(f"FAILED: Create Course - {resp.status_code} {resp.text}")
        sys.exit(1)
    
    course_id = resp.json().get("id")
    log(f"SUCCESS: Created Course ID: {course_id}")

    # ---------------------------------------------------------
    # 2. Create Session (Admin Flow)
    # ---------------------------------------------------------
    log("2. Creating Session...")
    # Note: Updated to use courseID as per recent refactor
    session_payload = {
        "courseID": course_id, 
        "instructors": [],
        "schedule": {"day": "Monday", "timeslot": "10:00 AM"},
        "capacity": 10
    }
    resp = session.post(f"{BASE_URL}/sessions", json=session_payload)
    if resp.status_code not in [200, 201]:
        log(f"FAILED: Create Session - {resp.status_code} {resp.text}")
        sys.exit(1)
        
    session_id = resp.json().get("id")
    log(f"SUCCESS: Created Session ID: {session_id}")

    # ---------------------------------------------------------
    # 3. Create Student (Parent Flow)
    # ---------------------------------------------------------
    log("3. Creating Student...")
    # Note: Updated to use parentID as per recent refactor
    student_payload = {
        "parentID": PARENT_ID,
        "fullname": STUDENT_NAME,
        "dob": DOB,
        "medical_note": "None"
    }
    # Using the endpoint mapped in users.js: /users/:uid/registerStudentProfile
    resp = session.post(f"{BASE_URL}/users/{PARENT_ID}/registerStudentProfile", json=student_payload)
    if resp.status_code not in [200, 201]:
        log(f"FAILED: Create Student - {resp.status_code} {resp.text}")
        sys.exit(1)

    student_id = resp.json().get("id")
    log(f"SUCCESS: Created Student ID: {student_id}")

    # ---------------------------------------------------------
    # 4. Enroll Student (The Critical Test)
    # ---------------------------------------------------------
    log("4. Enrolling Student...")
    # This payload matches what Dashboard.vue now sends
    enroll_payload = {
        "studentID": student_id,
        "courseID": course_id,
        "sessionID": session_id
    }
    
    # Endpoint: /registrations/createEnrollment (from registrations.js)
    resp = session.post(f"{BASE_URL}/registrations/createEnrollment", json=enroll_payload)
    if resp.status_code not in [200, 201]:
        log(f"FAILED: Enroll Student - {resp.status_code} {resp.text}")
        sys.exit(1)
        
    log("SUCCESS: Enrollment Created!")

    # ---------------------------------------------------------
    # 5. Verify Enrollment Data
    # ---------------------------------------------------------
    log("5. Verifying Enrollment Data...")
    resp = session.get(f"{BASE_URL}/registrations")
    if resp.status_code != 200:
        log(f"FAILED: Get Registrations - {resp.status_code}")
        sys.exit(1)
    
    all_enrollments = resp.json()
    # Find our enrollment
    my_enrollment = next((e for e in all_enrollments if e.get("studentID") == student_id), None)
    
    if not my_enrollment:
        # Fallback: Check if keys are still old snake_case?
        my_enrollment = next((e for e in all_enrollments if e.get("student_id") == student_id), None)
        if my_enrollment:
             log("FAILED: Enrollment found but used OLD snake_case keys (student_id)!")
             sys.exit(1)
        log("FAILED: Enrollment NOT found in list.")
        sys.exit(1)
        
    # Check keys
    if "sessionID" not in my_enrollment or "courseID" not in my_enrollment:
        log(f"FAILED: Enrollment keys incorrect. Got: {my_enrollment.keys()}")
        sys.exit(1)
        
    log("SUCCESS: Enrollment Verified with correct camelCase keys.")
    log("\nALL INTEGRATION TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
