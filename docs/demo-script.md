# 5-Minute Hackathon Demo Script

Follow this step-by-step walkthrough during live presentation or judging:

---

### Step 1: Student Login & Issue Submission (60s)
1. Open web application at `http://localhost:5173`.
2. Click **Instant Demo Accounts -> Student** (`student1@vynk.local`).
3. Note how the student's allocated location is automatically recognized:
   - **Aryabhata Boys Hostel • Block A • Room 204**.
4. Click **Report New Issue**.
5. Fill in:
   - **Title**: `Water leaking near socket in room 204`
   - **Description**: `Active ceiling drip right next to the study table power plug. Sparks could occur.`
   - (Optional) Attach a sample image.
6. Click **Submit Complaint**.
   - Notice the immediate `201` response: the student instantly sees "Submitted", while the Gemini AI pipeline runs asynchronously.

---

### Step 2: Automated AI Triage & SLA Initialization (45s)
1. Observe the live update via WebSocket:
   - Status changes to `AI Triaged` / `Assigned`.
   - **Category**: Plumbing → Water Leakage.
   - **Severity**: Elevated to **CRITICAL** due to electrical hazard detection.
   - **Priority Score**: Calculated using `severity_weight + safety_flag`.
   - **Assigned Team**: Automatically routed to **Plumbing & Water Services** (technician: Ramesh Kumar).
   - **SLA Countdown**: 4-hour critical resolution timer started.

---

### Step 3: Duplicate Detection (45s)
1. Switch to demo student 2 (**Rohan Verma**, roommate in Room 204) using the top-bar demo selector.
2. Submit a similar complaint:
   - **Title**: `Ceiling dripping water on desk`
   - **Description**: `Pls fix, water dropping near plug point.`
3. Observe AI Duplicate Detection:
   - System flags similarity with > 85% embedding cosine similarity in the same room/hostel.
   - Links as duplicate under parent complaint.
   - Bumps parent ticket priority.
   - Student receives notification: *"Your issue was identified as a duplicate and linked for priority tracking."*

---

### Step 4: Maintenance Workload & Live Resolution (60s)
1. Use top-bar demo selector to switch to **Maintenance Staff** (`tech.plumbing@vynk.local`).
2. Go to **Task Queue**:
   - The ticket appears in the queue with Critical badge.
3. Click **Start Work** → status updates to `IN_PROGRESS`.
   - The student's dashboard in any open browser updates in real time via Socket.IO!
4. Click **Mark Resolved** and enter resolution note:
   - `Repaired upper pipe joint and sealed drywall.`
5. Click **Confirm Resolved**.

---

### Step 5: Student Verification & 5-Star Feedback (45s)
1. Switch back to **Student** account.
2. Open the complaint details:
   - Status is now `RESOLVED`.
3. Fill out the rating form:
   - Select **5 Stars** and type *"Fast repair, thank you!"*.
4. Submit: Complaint transitions to `CLOSED`.

---

### Step 6: Admin Dashboard & Gemini Operational Insights (45s)
1. Switch to **Warden / Admin** account (`admin@vynk.local`).
2. View **Overview Dashboard**:
   - Live KPI counters: Total, Active Open, Critical, SLA Breaches, Average Resolution Hours, Student Satisfaction.
   - Recharts visualisations for category distributions and hostel breakdown.
3. Show **Gemini AI Operational Insights** banner:
   - Plain-language insight generated from recurring issues:
   - *"Aryabhata Boys Hostel (Block B, Floor 2) has recorded 7 plumbing complaints over the last 14 days... Preventive inspection recommended."*
4. Click **Refresh AI Insight** to re-analyze on demand.

---

### Step 7: SLA Escalations & Cryptographic Audit Trail (30s)
1. Navigate to **Audit Trail**:
   - Show the immutable, append-only chronological log of all transitions (`SUBMITTED`, `AI_TRIAGE`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
2. Point out escalation rules:
   - 80% time warning to technician.
   - 100% SLA breach → Level 1 escalation to Team Head.
   - 200% SLA breach → Level 2 escalation directly to Hostel Warden.
