"""
Seed script — creates sample SOP text files for demo upload.
Run: python scripts/seed_data.py
"""
import os

SAMPLE_SOPS = {
    "patient_admission_sop.txt": """PATIENT ADMISSION SOP v2.1
Department: All Wards | Author: Dr. Kapoor

1. Receive patient at reception and verify identity documents.
2. Register patient in HMS and generate Patient ID.
3. Conduct initial triage and assign urgency category (1-5).
4. Assign ward and bed based on diagnosis and availability.
5. Notify attending physician within 10 minutes of assignment.
6. Complete consent forms and admission paperwork.
7. Conduct nursing assessment: vitals, allergies, medical history within 30 minutes.
8. Brief patient on hospital rules, meal schedule, and daily routines.
Compliance: All admissions documented in HMS within 1 hour.
""",
    "patient_discharge_sop.txt": """PATIENT DISCHARGE PROTOCOL v1.8
Department: All Wards | Author: Dr. Mehta

1. Verify discharge order signed by attending physician.
2. Review all pending lab results and imaging reports.
3. Prepare comprehensive discharge summary.
4. Obtain billing clearance from finance department.
5. Prepare discharge prescriptions — minimum 7-day supply.
6. Educate patient and family on home care and red flag symptoms.
7. Complete HMS discharge documentation.
8. Arrange transport for elderly or mobility-impaired patients.
""",
    "infection_control_sop.txt": """INFECTION CONTROL AND PREVENTION SOP v3.2
Department: ICU and All Wards | Author: Dr. Priya S.

1. Isolate patient in single-occupancy or negative-pressure room within 15 minutes.
2. Don full PPE: N95 mask, gloves, gown, face shield before entering.
3. Notify Infection Control Officer within 30 minutes.
4. Collect specimens BEFORE initiating antibiotic therapy.
5. Implement contact/droplet/airborne precautions as applicable.
6. Log all contacts within 48 hours for tracing.
7. Place infection precaution signage on room door.
8. Decontaminate room with hospital-approved disinfectants.
""",
    "emergency_code_blue.txt": """EMERGENCY CODE BLUE PROTOCOL v4.0
Department: Emergency | Author: Dr. Rao

1. Announce Code Blue on PA system with exact location immediately.
2. Begin CPR within 30 seconds: 30:2 ratio, 100-120/min, depth >= 5cm.
3. Crash cart must arrive within 2 minutes.
4. Assign roles: Team Leader, Compressor, Airway, IV Nurse, Recorder.
5. Defibrillate at 200J if VF or pulseless VT.
6. Administer Epinephrine 1mg IV every 3-5 minutes.
7. Advanced airway management after 2 CPR cycles.
8. Notify ICU and cardiologist simultaneously.
""",
    "ppe_guidelines.txt": """PPE USAGE GUIDELINES v2.1
Department: All Departments | Author: Infection Control Team

1. Assess patient risk and transmission route before selecting PPE.
2. Standard precautions: surgical mask and gloves for ALL patient contact.
3. High-risk: Add N95 respirator, face shield, and isolation gown.
4. Donning: Gown → N95 → Goggles → Gloves.
5. Doffing: Gloves → Goggles → Gown → Mask.
6. Hand hygiene before AND after all PPE use.
7. N95 requires annual fit testing and seal check before every use.
8. Dispose in labeled biohazard waste containers only.
"""
}

os.makedirs("./sample_sops", exist_ok=True)
for filename, content in SAMPLE_SOPS.items():
    path = f"./sample_sops/{filename}"
    with open(path, "w") as f:
        f.write(content)
    print(f"Created: {path}")

print("\nDone! Upload these via the web UI or POST /api/v1/sops/")
