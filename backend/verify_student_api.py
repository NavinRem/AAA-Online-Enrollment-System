import requests
import json
import sys

BASE_URL = "https://api-tyweqke5oa-uc.a.run.app"
PARENT_ID = "test-parent-12345"
STUDENT_NAME = "Test Student Python"
DOB = "2015-01-01"

def log(msg):
    print(f"[TEST] {msg}")

def run_tests():
    session = requests.Session()

    # 1. Create Student
    log("1. Creating Student...")
    payload = {
        "parentID": PARENT_ID,
        "fullname": STUDENT_NAME,
        "dob": DOB,
        "medical_note": "None"
    }
    response = session.post(f"{BASE_URL}/students", json=payload)
    if response.status_code != 201:
        log(f"FAILED: Create Student - {response.status_code} {response.text}")
        sys.exit(1)
    
    student_id = response.json().get("id")
    log(f"SUCCESS: Created Student ID: {student_id}")

    # 2. Get Student
    log(f"2. Getting Student {student_id}...")
    response = session.get(f"{BASE_URL}/students/{student_id}")
    if response.status_code != 200:
        log(f"FAILED: Get Student - {response.status_code}")
        sys.exit(1)
    
    data = response.json()
    if data.get("fullname") != STUDENT_NAME:
        log(f"FAILED: Name mismatch. Expected {STUDENT_NAME}, got {data.get('fullname')}")
        sys.exit(1)
    log("SUCCESS: Student data verified.")

    # 3. Update Medical Note
    log("3. Updating Medical Note...")
    new_note = "Allergic to Peanuts"
    response = session.put(f"{BASE_URL}/students/{student_id}/medical", json={"medical_note": new_note})
    if response.status_code != 200:
        log(f"FAILED: Update Medical - {response.status_code}")
        sys.exit(1)
    log("SUCCESS: Medical note updated.")

    # 4. Verify Update
    log("4. Verifying Medical Note Update...")
    response = session.get(f"{BASE_URL}/students/{student_id}")
    if response.json().get("medical_note") != new_note:
        log(f"FAILED: Note mismatch. Expected {new_note}")
        sys.exit(1)
    log("SUCCESS: Medical note verified.")

    # 5. Get All Students (Admin)
    log("5. Getting ALL Students (Admin check)...")
    response = session.get(f"{BASE_URL}/students")
    if response.status_code != 200:
        log(f"FAILED: Get All Students - {response.status_code}")
        sys.exit(1)
    
    all_students = response.json()
    found = any(s['id'] == student_id for s in all_students)
    if not found:
        log("FAILED: Created student not found in ALL list")
        sys.exit(1)
    log(f"SUCCESS: Found student in list of {len(all_students)} students.")

    # 6. Get Students by Parent
    log(f"6. Getting Students for Parent {PARENT_ID}...")
    response = session.get(f"{BASE_URL}/students/parent/{PARENT_ID}")
    if response.status_code != 200:
        log(f"FAILED: Get Parent Students - {response.status_code}")
        sys.exit(1)
    
    parent_students = response.json()
    found_p = any(s['id'] == student_id for s in parent_students)
    if not found_p:
        log("FAILED: Created student not found in PARENT list")
        sys.exit(1)
    log(f"SUCCESS: Found student in parent list.")

    log("\nALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
