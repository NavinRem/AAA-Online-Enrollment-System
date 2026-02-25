import requests
import json
import sys
import time

BASE_URL = "https://api-tyweqke5oa-uc.a.run.app"
PARENT_ID = "test-parent-123"
STUDENT_ID = "test-student-456"
COURSE_ID = "test-course-789"
SESSION_ID = "test-session-101"
ENROLLMENT_ID = "test-enrollment-202"

def log(msg):
    print(f"[TEST] {msg}")

def fail(msg, res=None):
    print(f"[FAILED] {msg}")
    if res:
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
    sys.exit(1)

def run_tests():
    session = requests.Session()

    print("=== STARTING API VERIFICATION ===")

    # --- 1. Course Management (Update/Delete) ---
    log("1. Testing Course Management...")
    # Create a temp course first
    c_res = session.post(f"{BASE_URL}/courses", json={
        "title": "Temp Course", "price": 100
    })
    if c_res.status_code != 201: fail("Create Course", c_res)
    temp_course_id = c_res.json()['id']

    # Update
    u_res = session.put(f"{BASE_URL}/courses/{temp_course_id}", json={"title": "Updated Course"})
    if u_res.status_code != 200: fail("Update Course", u_res)
    
    # Verify Update
    g_res = session.get(f"{BASE_URL}/courses/{temp_course_id}")
    if g_res.json()['title'] != "Updated Course": fail("Verify Course Update", g_res)

    # Delete
    d_res = session.delete(f"{BASE_URL}/courses/{temp_course_id}")
    if d_res.status_code != 200: fail("Delete Course", d_res)
    log("SUCCESS: Course Management APIs")


    # --- 2. Session Management ---
    log("2. Testing Session Management...")
    # Create temp session
    s_res = session.post(f"{BASE_URL}/sessions", json={
        "course_id": COURSE_ID, "capacity": 10
    })
    if s_res.status_code != 201: fail("Create Session", s_res)
    temp_session_id = s_res.json()['id']

    # Assign Instructor
    instructors = [{"id": "instr-1", "role": "Lead"}]
    i_res = session.put(f"{BASE_URL}/sessions/{temp_session_id}/instructor", json={"instructors": instructors})
    if i_res.status_code != 200: fail("Assign Instructor", i_res)

    # Get Roster
    r_res = session.get(f"{BASE_URL}/sessions/{temp_session_id}/roster")
    if len(r_res.json()) != 1: fail("Get Roster", r_res)

    # Sync Counts
    sc_res = session.post(f"{BASE_URL}/sessions/sync-counts", json={"sessionId": temp_session_id})
    if sc_res.status_code != 200: fail("Sync Counts", sc_res)
    log("SUCCESS: Session Management APIs")


    # --- 2.5 Create Student and Enrollment for Payment Test ---
    log("2.5 Creating Prerequisites (Student & Enrollment)...")
    
    # Create Student
    stu_res = session.post(f"{BASE_URL}/students", json={
        "parent_id": PARENT_ID, "fullname": "Payment Test Kid", "dob": "2015-01-01"
    })
    if stu_res.status_code != 201: fail("Create Student", stu_res)
    real_student_id = stu_res.json()['id']

    # Create Enrollment
    # We need the temp_session_id and temp_course_id from previous steps
    # But those variables are local to the previous blocks.
    # PROPOSE: Move temp_course_id and temp_session_id to be accessible/reused.
    # OR: just re-use the ones created above if they are in scope.
    # Python variables in a function are scoped to the function, so they ARE available here if defined above.
    
    e_res = session.post(f"{BASE_URL}/registrations/createEnrollment", json={
        "studentId": real_student_id,
        "courseId": temp_course_id, # Reusing from Step 1
        "sessionId": temp_session_id # Reusing from Step 2
    })
    
    # Note: createEnrollment might fail if session full or something, but we set capacity=10 in Step 2.
    if e_res.status_code not in [200, 201]: fail("Create Enrollment", e_res)
    # The API might return { message: "..." } or id? 
    # Let's check registrationService.createEnrollment... it returns message.
    # It doesn't return ID! (Wait, let me check registrationService.js... Steps 154X...)
    # Actually, createEnrollment in step 1551 (viewed content) showed:
    # return { message: "Enrollment created successfully" };
    # It DOES NOT return the ID. This is a gap.
    # I can't get the ID easily unless I query for it.
    
    # ALTERNATIVE: Use the manual "initiatePayment" with a fake ID, but update paymentService to NOT fail if enrollment missing?
    # No, we want to test the full flow.
    # Let's update `createEnrollment` to return the ID first? That's better for the API anyway.
    
    # HOLD ON.
    # I will stick to fixing the test script first. 
    # I can query registrations by studentId to get the ID.
    
    ge_res = session.get(f"{BASE_URL}/registrations") # Admin get all?
    # Or implement getRegistrationsByStudent...
    # For now, let's just use `getAllRegistrations` (Step 76 in service) which returns all.
    if ge_res.status_code != 200: fail("Get All Registrations", ge_res)
    all_regs = ge_res.json()
    my_reg = next((r for r in all_regs if r['student_id'] == real_student_id), None)
    if not my_reg: fail("Could not find created enrollment")
    real_enrollment_id = my_reg['id']
    log(f"SUCCESS: Prerequisites created (Enrollment ID: {real_enrollment_id})")

    # --- 3. Payment API ---
    log("3. Testing Payment API...")
    # Initiate
    p_res = session.post(f"{BASE_URL}/payments/initiate", json={
        "enrollmentId": ENROLLMENT_ID, "amount": 50
    })
    if p_res.status_code != 200: fail("Initiate Payment", p_res)
    txn_id = p_res.json()['transactionId']

    # Verify
    v_res = session.post(f"{BASE_URL}/payments/verify", json={"transactionId": txn_id})
    if v_res.status_code != 200: fail("Verify Payment", v_res)

    # History
    h_res = session.get(f"{BASE_URL}/payments/history/{PARENT_ID}")
    if h_res.status_code != 200: fail("Payment History", h_res)
    log("SUCCESS: Payment APIs")


    # --- 4. Attendance API ---
    log("4. Testing Attendance API...")
    # Check In
    ci_res = session.post(f"{BASE_URL}/attendance/check-in", json={
        "studentId": STUDENT_ID, "sessionId": SESSION_ID
    })
    if ci_res.status_code != 200: fail("Check-In", ci_res)

    # Check Out
    co_res = session.post(f"{BASE_URL}/attendance/check-out", json={
        "studentId": STUDENT_ID, "sessionId": SESSION_ID
    })
    if co_res.status_code != 200: fail("Check-Out", co_res)

    # History & Logs
    ah_res = session.get(f"{BASE_URL}/attendance/student/{STUDENT_ID}")
    if ah_res.status_code != 200: fail("Attendance History", ah_res)
    
    al_res = session.get(f"{BASE_URL}/attendance/session/{SESSION_ID}")
    if al_res.status_code != 200: fail("Attendance Logs", al_res)

    # Make-up Request
    mu_res = session.post(f"{BASE_URL}/attendance/make-up", json={
        "studentId": STUDENT_ID, "reason": "Sick"
    })
    if mu_res.status_code != 200: fail("Make-up Request", mu_res)
    log("SUCCESS: Attendance APIs")


    # --- 5. Registration Cancel ---
    log("5. Testing Cancel Registration...")
    # Mocking this one might fail if ID doesn't exist, so we expect 404 or 200
    # Let's just hit the endpoint to see if it's reachable
    cr_res = session.post(f"{BASE_URL}/registrations/cancel", json={"enrollmentId": "non-existent"})
    if cr_res.status_code not in [200, 404]: fail(f"Cancel Registration (Got {cr_res.status_code})", cr_res)
    log("SUCCESS: Cancel Registration API (Reachable)")


    # --- 6. Progress API ---
    log("6. Testing Student Progress...")
    pr_res = session.get(f"{BASE_URL}/progress/{STUDENT_ID}")
    if pr_res.status_code != 200: fail("Get Student Progress", pr_res)
    if pr_res.json()['studentId'] != STUDENT_ID: fail("Progress Data Mismatch")
    log("SUCCESS: Progress API")

    print("\n=== ALL SYSTEM TESTS PASSED ===")

if __name__ == "__main__":
    run_tests()
