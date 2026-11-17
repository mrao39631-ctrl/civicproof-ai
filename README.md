# CivicProof AI 🛡️
> **AI-Powered Independent Verification of Civic Complaints**  
> *A civic complaint should never be marked as resolved just because a contractor or official uploads a photo.*

---

## 🏛️ Obsidian Dark & Amber Enterprise Command-Center Architecture
CivicProof AI has been designed with an enterprise command-center aesthetic:
- **Obsidian Dark & Amber Palette:** `#0B0F17` background, `#131926` command cards, `#F59E0B` primary gold/amber accents, with subtle cyan telemetry highlights (`#38BDF8`).
- **Single Top Command Navigation Bar:** The left sidebar has been eliminated in favor of a clean, persistent top command header with role indicator badges, portal-specific center tab pills, logged-in Indian user profiles, and a quick **"Logout / Switch Role"** button.
- **Entry Access Portal:** Centered authentication card with **"Continue with Google (Instant OAuth)"**, Sign In / Register toggle, and 3 glowing role cards:
  1. **Citizen / Resident** (`Aarav Sharma`)
  2. **Field Contractor / Fixer** (`Rajesh Verma · Squad-07`)
  3. **Municipal Auditor / Admin** (`Dr. Ananya Roy`)

---

## 👥 Three Dedicated Municipal Operating Portals

### 1. Citizen Integrity Portal (2-Column Split Layout)
- **Top KPI Strip:** Total Logged, Pending Repair, AI Verified Fixed, Disputed Repairs.
- **Left Column ("Report a Civic Defect"):**
  * Selectable dark icon category cards: **Street Light**, **Pothole / Road Damage**, **Water Leakage**, **Garbage Overflow**.
  * Landmark & location input with a 1-click **"Detect GPS"** button pre-populated with Raipur coordinates.
  * Drag-and-drop BEFORE photo uploader with clickable **"Load Sample Defect Photo"** buttons (*Pothole*, *Garbage*, *Water Leak*, *Street Light*).
  * Real-time auto-generated **SHA-256 evidence hash preview**.
  * Full-width amber button: **"Submit Defect with SHA-256 Anchor"**.
- **Right Column ("My Complaint & Verification History"):**
  * Live status progression stepper: `REPORTED` ➔ `ASSIGNED` ➔ `AFTER PHOTO UPLOADED` ➔ `AI VERIFIED / DISPUTED`.
  * **"Inspect & Verify"** modal displaying side-by-side Before/After comparison, Gemini 2.5 Flash spatial scores, and the **Citizen Approval Gate** (*Approve & Close Defect* or *Dispute & Escalate to Auditor*).

### 2. Field Contractor Terminal (Field Terminal Layout)
- **Squad-07 Unit Banner:** Displays Squad ID (`RAIPUR-MC-SQ07-2026`), Assigned Zone (`Zone 4 - Telibandha & Shankar Nagar`), Dual-Band Satellite Telemetry status, and Active Work Orders count.
- **Assigned Work Orders Grid:** Defect cards featuring original citizen BEFORE photos, location directives, and spatial landmark guidance.
- **"Upload AFTER Repair Evidence" Modal:**
  * Clickable simulated field samples (*Verified Cleanup*, *Partial Patch Attempt*, *Valve Sealed*).
  * Real-time simulated multimodal AI spatial & landmark pre-check before submission.
  * Submits repair notes and transitions status for AI verification.

### 3. Municipal Auditor Command Center
- **Top 5 KPI Cards:** Total Logged, Disputed / Flagged, AI Verification Accuracy (94.6%), Avg Resolution Time (18.4 hrs), Active Contractors (12 Squads).
- **Middle 2-Column Analytical Section:**
  * **Left: "AI Spatial Before-vs-After Verification Inspector"**: Side-by-side images, landmark correlation score (94.2%), curb alignment checks, surface flush grading, and cryptographic non-tampering certificate (`SHA-256 Match: VERIFIED NON-TAMPERED`).
  * **Right: "Tamper-Evident SHA-256 Audit Trail"**: Live stream of cryptographic state changes with timestamps, actor IDs, and immutable block hashes.
- **Bottom Full-Width Dispute Management Table:** Searchable & filterable table with one-click **Approve** and **Reject** adjudication actions with required audit notes.

---

## 📍 Pre-Loaded Raipur (C.G.) Civic Dataset
CivicProof AI comes pre-seeded with realistic civic complaints set across Raipur landmarks:
1. **Case CP-2026-101:** *"Severe 14-Inch Asphalt Crater near Telibandha Lake Promenade"* (GE Road, Raipur) — Status: `DISPUTED` (Awaiting Auditor Adjudication).
2. **Case CP-2026-102:** *"Commercial Waste Overflow at Shankar Nagar Main Market"* (Sector 2, Raipur) — Status: `REPAIR_SUBMITTED` (Ready for Citizen Inspect & Verify).
3. **Case CP-2026-103:** *"High-Pressure Municipal Pipeline Burst near Marine Drive"* (Marine Drive, Raipur) — Status: `CLOSED_VERIFIED` (Repaired & Citizen Confirmed).
4. **Case CP-2026-104:** *"Flickering High-Mast Street Light near AIIMS Junction"* (GE Road Tatibandh, Raipur) — Status: `SUBMITTED` (Assigned to Squad-07).

---

## 🚀 Live Demo & Access URLs

- **Primary Application URL:** **[http://localhost:3000](http://localhost:3000)**
- **Alternative 127.0.0.1 URL:** **[http://127.0.0.1:3000](http://127.0.0.1:3000)**
- **Local Wi-Fi Network URL:** **[http://192.168.1.8:3000](http://192.168.1.8:3000)**
- **Backend API & Swagger Docs:** **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

### Pre-Configured Demo Credentials:
- **Citizen / Resident:** `citizen` / `citizen123` (`Aarav Sharma`)
- **Field Contractor:** `fixer` / `fixer123` (`Rajesh Verma · Squad-07`)
- **Municipal Auditor:** `admin` / `admin123` (`Dr. Ananya Roy`)
