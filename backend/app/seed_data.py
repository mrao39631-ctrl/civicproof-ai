import hashlib
import shutil
import os
from pathlib import Path
from PIL import Image, ImageDraw
from backend.app.database import get_db, init_db
from backend.app.config import UPLOADS_DIR, SAMPLE_IMAGES_DIR, ROOT_DIR
from backend.app.auth import hash_password

def create_sample_image(
    file_path: Path,
    title: str,
    badge_text: str,
    badge_bg: tuple[int, int, int],
    elements: list[str],
    gps_text: str,
    bg_gradient: tuple[int, int, int]
) -> tuple[str, str, int]:
    """Generates a civic evidence sample image file on disk and returns (public_path, sha256_hash, file_size)."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    width, height = 700, 480
    image = Image.new("RGB", (width, height), bg_gradient)
    draw = ImageDraw.Draw(image)

    # Simulated street/environment backdrop
    draw.rectangle([0, 0, width, 180], fill=(22, 28, 42))  # Obsidian dark ambient skyline
    draw.rectangle([0, 180, width, 240], fill=(130, 140, 155)) # Sidewalk curb
    draw.rectangle([0, 240, width, height], fill=(45, 50, 60))   # Asphalt roadway

    # Road marking lines
    draw.line([0, 360, width, 360], fill=(245, 158, 11), width=6) # Amber center marking
    draw.line([50, 180, 650, 180], fill=(220, 220, 230), width=4)

    # Specific defect or repair elements
    for elem in elements:
        if elem == "garbage_pile":
            draw.ellipse([200, 220, 480, 340], fill=(60, 45, 35), outline=(30, 20, 15), width=3)
            draw.rectangle([230, 230, 310, 290], fill=(35, 110, 70))
            draw.rectangle([320, 220, 420, 280], fill=(160, 120, 75))
            draw.ellipse([370, 260, 470, 330], fill=(25, 25, 30))
            draw.rectangle([140, 160, 210, 260], fill=(30, 70, 120))
        elif elem == "clean_curb":
            draw.rectangle([140, 160, 210, 260], fill=(25, 120, 75))
            draw.rectangle([215, 230, 490, 330], fill=(55, 60, 70))
            for i in range(5):
                draw.arc([230 + (i * 50), 250, 280 + (i * 50), 300], 0, 180, fill=(80, 90, 100), width=2)
        elif elem == "deep_pothole":
            draw.ellipse([220, 260, 460, 380], fill=(25, 25, 30), outline=(180, 50, 50), width=4)
            draw.ellipse([250, 280, 430, 350], fill=(12, 12, 15))
            draw.line([220, 320, 160, 340], fill=(15, 15, 18), width=3)
            draw.line([460, 300, 530, 280], fill=(15, 15, 18), width=3)
            draw.line([340, 380, 370, 430], fill=(15, 15, 18), width=3)
        elif elem == "partial_pothole_patch":
            draw.ellipse([220, 260, 460, 380], fill=(40, 42, 48), outline=(245, 158, 11), width=2)
            draw.ellipse([260, 285, 410, 345], fill=(30, 32, 36))
            draw.arc([220, 260, 460, 380], 45, 200, fill=(15, 15, 18), width=3)
        elif elem == "water_leak_flood":
            draw.ellipse([180, 240, 520, 420], fill=(35, 80, 140), outline=(56, 189, 248), width=4)
            draw.ellipse([320, 270, 380, 320], fill=(190, 220, 250))
        elif elem == "dry_water_valve":
            draw.rectangle([280, 260, 420, 360], fill=(65, 70, 80), outline=(245, 158, 11), width=3)
            draw.ellipse([330, 290, 370, 330], fill=(190, 150, 40))
        elif elem == "illuminated_street_light":
            # Bright yellow/white illumination cone
            draw.polygon([(350, 100), (150, 480), (550, 480)], fill=(255, 245, 180, 80))
            draw.rectangle([344, 80, 356, 480], fill=(120, 130, 145))
            draw.ellipse([330, 60, 370, 95], fill=(255, 255, 210))

    # Header Banner - Obsidian Dark
    draw.rectangle([0, 0, width, 56], fill=(11, 15, 23))
    draw.text((20, 16), title, fill=(245, 158, 11))
    
    # Badge (BEFORE / AFTER)
    draw.rectangle([width - 160, 12, width - 20, 44], fill=badge_bg)
    draw.text((width - 145, 18), badge_text, fill=(255, 255, 255))

    # Bottom Metadata Overlay
    draw.rectangle([0, height - 44, width, height], fill=(11, 15, 23))
    draw.text((15, height - 32), gps_text, fill=(245, 158, 11))
    draw.text((width - 200, height - 32), "CIVICPROOF SHA-256 SECURED", fill=(16, 185, 129))

    image.save(file_path, "JPEG", quality=90)
    
    with open(file_path, "rb") as f:
        data = f.read()
        sha256 = hashlib.sha256(data).hexdigest()
        size = len(data)
        
    return f"/uploads/{file_path.name}", sha256, size

def ensure_sample_images_and_sync_uploads() -> dict[str, dict]:
    """
    Ensures required demo images exist in sample_images/ and copies them into uploads/.
    Returns a dictionary of metadata (path, sha256, size) for all demo images.
    """
    SAMPLE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    # Sample images specification
    samples_spec = {
        "seed_pothole_before.jpg": {
            "title": "CASE #CP-2026-101: Ring Road No. 2 Asphalt Crater",
            "badge_text": "ORIGINAL BEFORE",
            "badge_bg": (220, 38, 38),
            "elements": ["deep_pothole"],
            "gps_text": "LAT: 21.2893 N | LON: 81.6439 E | RING ROAD NO. 2, RAIPUR",
            "bg_gradient": (19, 25, 38)
        },
        "seed_pothole_after.jpg": {
            "title": "CASE #CP-2026-101: Asphalt Compaction Patch",
            "badge_text": "REPAIR AFTER",
            "badge_bg": (245, 158, 11),
            "elements": ["partial_pothole_patch"],
            "gps_text": "LAT: 21.2893 N | LON: 81.6439 E | RING ROAD NO. 2, RAIPUR",
            "bg_gradient": (19, 25, 38)
        },
        "seed_water_before.jpg": {
            "title": "CASE #CP-2026-102: Telibandha Lake Pipeline Burst",
            "badge_text": "ORIGINAL BEFORE",
            "badge_bg": (220, 38, 38),
            "elements": ["water_leak_flood"],
            "gps_text": "LAT: 21.2415 N | LON: 81.6580 E | TELIBANDHA, RAIPUR",
            "bg_gradient": (19, 25, 38)
        },
        "seed_water_after.jpg": {
            "title": "CASE #CP-2026-102: Brass Valve Replaced & Sealed",
            "badge_text": "REPAIR AFTER",
            "badge_bg": (16, 185, 129),
            "elements": ["dry_water_valve"],
            "gps_text": "LAT: 21.2415 N | LON: 81.6580 E | TELIBANDHA, RAIPUR",
            "bg_gradient": (19, 25, 38)
        },
        "seed_light_before.jpg": {
            "title": "CASE #CP-2026-103: VIP Road High-Mast Fixture Failure",
            "badge_text": "ORIGINAL BEFORE",
            "badge_bg": (220, 38, 38),
            "elements": [],
            "gps_text": "LAT: 21.2350 N | LON: 81.6820 E | VIP ROAD, RAIPUR",
            "bg_gradient": (19, 25, 38)
        },
        "seed_light_after.jpg": {
            "title": "CASE #CP-2026-103: LED Luminaire Restored & Operational",
            "badge_text": "REPAIR AFTER",
            "badge_bg": (16, 185, 129),
            "elements": ["illuminated_street_light"],
            "gps_text": "LAT: 21.2350 N | LON: 81.6820 E | VIP ROAD, RAIPUR",
            "bg_gradient": (19, 25, 38)
        },
        "seed_garbage_before.jpg": {
            "title": "TEST DEFECT: Commercial Waste Overflow",
            "badge_text": "SAMPLE BEFORE",
            "badge_bg": (220, 38, 38),
            "elements": ["garbage_pile"],
            "gps_text": "LAT: 21.2542 N | LON: 81.6661 E | RAIPUR",
            "bg_gradient": (19, 25, 38)
        },
        "seed_garbage_after.jpg": {
            "title": "TEST REPAIR: Waste Cleared & Swept",
            "badge_text": "SAMPLE AFTER",
            "badge_bg": (16, 185, 129),
            "elements": ["clean_curb"],
            "gps_text": "LAT: 21.2542 N | LON: 81.6661 E | RAIPUR",
            "bg_gradient": (19, 25, 38)
        }
    }

    results = {}

    for filename, spec in samples_spec.items():
        sample_path = SAMPLE_IMAGES_DIR / filename
        upload_path = UPLOADS_DIR / filename

        # 1. Ensure sample image exists in SAMPLE_IMAGES_DIR
        if not sample_path.exists():
            if upload_path.exists():
                shutil.copy2(upload_path, sample_path)
            else:
                create_sample_image(
                    sample_path,
                    spec["title"],
                    spec["badge_text"],
                    spec["badge_bg"],
                    spec["elements"],
                    spec["gps_text"],
                    spec["bg_gradient"]
                )

        # 2. Copy from sample_images/ into uploads/ so uploads/ always has fresh, clean copies in production
        if not upload_path.exists() or upload_path.stat().st_size != sample_path.stat().st_size:
            shutil.copy2(sample_path, upload_path)

        # 3. Compute real SHA-256 and byte size
        with open(upload_path, "rb") as f:
            data = f.read()
            sha256 = hashlib.sha256(data).hexdigest()
            size = len(data)

        results[filename] = {
            "url": f"/uploads/{filename}",
            "sha256": sha256,
            "size": size
        }

    return results

def seed_demo_data(force: bool = False):
    """
    Initializes database and seeds exactly 3 realistic demo reports associated with Aarav Sharma (citizen).
    IDEMPOTENT: Only seeds when complaints table has 0 complaints (or when force=True).
    """
    init_db()
    images = ensure_sample_images_and_sync_uploads()

    with get_db() as conn:
        cursor = conn.cursor()

        # Seed or ensure default user accounts exist
        users = [
            ("citizen", "aarav.sharma@civicproof.in", "Aarav Sharma", "citizen123", "citizen"),
            ("fixer", "rajesh.verma@civicproof.in", "Rajesh Verma (Lead Contractor, Squad-07)", "fixer123", "fixer"),
            ("admin", "ananya.roy@civicproof.in", "Dr. Ananya Roy (Chief Municipal Auditor)", "admin123", "admin"),
        ]

        user_ids = {}
        for username, email, full_name, password, role in users:
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            row = cursor.fetchone()
            if not row:
                pwd_hash, salt = hash_password(password)
                cursor.execute(
                    """
                    INSERT INTO users (username, email, password_hash, salt, full_name, role)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (username, email, pwd_hash, salt, full_name, role)
                )
                user_ids[role] = cursor.lastrowid
            else:
                user_ids[role] = row[0]

        # Check existing complaints count for idempotency
        cursor.execute("SELECT COUNT(*) FROM complaints")
        complaints_count = cursor.fetchone()[0]

        if not force and complaints_count > 0:
            print(f" Database already contains {complaints_count} complaints. Skipping demo report seeding (idempotent).")
            return

        if force:
            cursor.execute("DELETE FROM audit_logs")
            cursor.execute("DELETE FROM reporter_decisions")
            cursor.execute("DELETE FROM verification_results")
            cursor.execute("DELETE FROM evidence")
            cursor.execute("DELETE FROM complaints")

        print(" Seeding 3 realistic demo reports for Aarav Sharma (Raipur context)...")

        # =========================================================================
        # Report 1 (Pending Contractor Action - ASSIGNED)
        # Category: Pothole / Road | Ring Road No. 2, Raipur (21.2893° N, 81.6439° E)
        # =========================================================================
        pothole_img = images["seed_pothole_before.jpg"]
        cursor.execute(
            """
            INSERT INTO complaints (complaint_code, title, description, category, location, latitude, longitude, citizen_id, fixer_id, status)
            VALUES ('CP-2026-101', 
                    'Deep 16-inch asphalt crater near Ring Road No. 2 service lane',
                    '16-inch deep structural asphalt pavement fracture near Ring Road No. 2 service lane causing severe vehicle axle damage and immediate hazard to two-wheelers during evening rush hour.',
                    'Pothole / Road', 
                    'Ring Road No. 2, Raipur', 
                    21.2893, 
                    81.6439, 
                    ?, 
                    ?, 
                    'ASSIGNED')
            """,
            (user_ids["citizen"], user_ids["fixer"])
        )
        c1_id = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO evidence (complaint_id, uploader_id, evidence_type, file_path, filename, file_size, mime_type, sha256_hash, notes)
            VALUES (?, ?, 'BEFORE', ?, 'seed_pothole_before.jpg', ?, 'image/jpeg', ?, 'Original 16-inch road crater photographed by citizen Aarav Sharma')
            """,
            (c1_id, user_ids["citizen"], pothole_img["url"], pothole_img["size"], pothole_img["sha256"])
        )

        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details, evidence_hash)
            VALUES (?, ?, 'Aarav Sharma', 'citizen', 'COMPLAINT_FILED', NULL, 'SUBMITTED', 'Citizen reported asphalt crater with cryptographic SHA-256 BEFORE anchor.', ?)
            """,
            (c1_id, user_ids["citizen"], pothole_img["sha256"])
        )

        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details)
            VALUES (?, ?, 'Raipur Municipal Dispatch', 'admin', 'FIELD_ORDER_ASSIGNED', 'SUBMITTED', 'ASSIGNED', 'Work order assigned to Contractor Squad-07 (Rajesh Verma). Awaiting field repair completion and photographic proof.')
            """,
            (c1_id, user_ids["admin"])
        )

        # =========================================================================
        # Report 2 (Awaiting Auditor Adjudication - DISPUTED / AFTER_UPLOADED)
        # Category: Water Leakage | Telibandha Lake Square, Raipur (21.2415° N, 81.6580° E)
        # =========================================================================
        water_b = images["seed_water_before.jpg"]
        water_a = images["seed_water_after.jpg"]
        cursor.execute(
            """
            INSERT INTO complaints (complaint_code, title, description, category, location, latitude, longitude, citizen_id, fixer_id, status)
            VALUES ('CP-2026-102', 
                    'Main municipal pipeline burst near Telibandha Lake square',
                    'High-pressure potable feeder water main ruptured at valve junction, flooding the recreational promenade and lowering residential water pressure across Telibandha ward.',
                    'Water Leakage', 
                    'Telibandha Lake Square, Raipur', 
                    21.2415, 
                    81.6580, 
                    ?, 
                    ?, 
                    'DISPUTED')
            """,
            (user_ids["citizen"], user_ids["fixer"])
        )
        c2_id = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO evidence (complaint_id, uploader_id, evidence_type, file_path, filename, file_size, mime_type, sha256_hash, notes)
            VALUES (?, ?, 'BEFORE', ?, 'seed_water_before.jpg', ?, 'image/jpeg', ?, 'Potable feeder main eruption documented by citizen')
            """,
            (c2_id, user_ids["citizen"], water_b["url"], water_b["size"], water_b["sha256"])
        )

        cursor.execute(
            """
            INSERT INTO evidence (complaint_id, uploader_id, evidence_type, file_path, filename, file_size, mime_type, sha256_hash, notes)
            VALUES (?, ?, 'AFTER', ?, 'seed_water_after.jpg', ?, 'image/jpeg', ?, 'Contractor Squad-07 replaced main union valve with heavy-duty brass fitting')
            """,
            (c2_id, user_ids["fixer"], water_a["url"], water_a["size"], water_a["sha256"])
        )

        cursor.execute(
            """
            INSERT INTO verification_results (
                complaint_id, verdict, confidence_score, location_match, landmarks_match,
                problem_still_visible, repair_complete, image_clarity_sufficient,
                explanation, evidence_comparison, human_review_recommended, is_demo_mode, disclaimer, geo_fence_distance
            ) VALUES (?, 'NOT_VERIFIED', 92.4, 1, 1, 1, 0, 1,
                      'AI spatial alignment detected pipeline excavation backfill and replacement fitting at Telibandha Lake square. Defect flagged for Chief Municipal Auditor final adjudication.',
                      'BEFORE: High-pressure potable water stream inundating promenade roadway.\nAFTER: Excavation backfilled with replacement brass valve assembly. Surface moisture still visible.',
                      1, 1, 'AI verification flagged for municipal auditor review.', 18.2)
            """,
            (c2_id,)
        )

        cursor.execute(
            """
            INSERT INTO reporter_decisions (complaint_id, reporter_id, decision, feedback_comments)
            VALUES (?, ?, 'DISAGREED_STILL_EXISTS', 'Contractor replaced the main valve, but pipeline joint is still seeping water onto Telibandha promenade walkway. Escalated to Municipal Auditor.')
            """,
            (c2_id, user_ids["citizen"])
        )

        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details, evidence_hash)
            VALUES (?, ?, 'Aarav Sharma', 'citizen', 'COMPLAINT_FILED', NULL, 'SUBMITTED', 'Citizen filed potable water pipeline failure with cryptographic BEFORE hash.', ?)
            """,
            (c2_id, user_ids["citizen"], water_b["sha256"])
        )

        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details, evidence_hash)
            VALUES (?, ?, 'Rajesh Verma', 'fixer', 'REPAIR_EVIDENCE_SUBMITTED', 'IN_PROGRESS', 'REPAIR_SUBMITTED', 'Contractor Squad-07 uploaded AFTER proof photo of brass valve replacement.', ?)
            """,
            (c2_id, user_ids["fixer"], water_a["sha256"])
        )

        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details)
            VALUES (?, ?, 'Aarav Sharma', 'citizen', 'AI_VERIFICATION_EVALUATED', 'REPAIR_SUBMITTED', 'AI_NOT_VERIFIED', '[DEMO SIMULATION] AI multimodal verdict: NOT_VERIFIED (Confidence: 92.4%, Geo-distance: 18.2m).')
            """,
            (c2_id, user_ids["citizen"])
        )

        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details)
            VALUES (?, ?, 'Aarav Sharma', 'citizen', 'REPORTER_DISPUTED_RESOLUTION', 'AI_NOT_VERIFIED', 'DISPUTED', 'Citizen disputed repair quality. Escalated to Chief Municipal Auditor queue for final adjudication.')
            """,
            (c2_id, user_ids["citizen"])
        )

        # =========================================================================
        # Report 3 (Completed & Verified - CLOSED - VERIFIED FIXED)
        # Category: Street Light | VIP Road, Raipur (21.2350° N, 81.6820° E)
        # =========================================================================
        light_b = images["seed_light_before.jpg"]
        light_a = images["seed_light_after.jpg"]
        cursor.execute(
            """
            INSERT INTO complaints (complaint_code, title, description, category, location, latitude, longitude, citizen_id, fixer_id, status)
            VALUES ('CP-2026-103', 
                    'High-mast LED streetlight failure near VIP Road crossing',
                    'High-mast lighting fixture #18 at VIP Road intersection failure, leaving active multi-lane pedestrian crossing in complete darkness.',
                    'Street Light', 
                    'VIP Road, Raipur', 
                    21.2350, 
                    81.6820, 
                    ?, 
                    ?, 
                    'CLOSED_VERIFIED')
            """,
            (user_ids["citizen"], user_ids["fixer"])
        )
        c3_id = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO evidence (complaint_id, uploader_id, evidence_type, file_path, filename, file_size, mime_type, sha256_hash, notes)
            VALUES (?, ?, 'BEFORE', ?, 'seed_light_before.jpg', ?, 'image/jpeg', ?, 'Non-functional high-mast pole at VIP Road intersection')
            """,
            (c3_id, user_ids["citizen"], light_b["url"], light_b["size"], light_b["sha256"])
        )

        cursor.execute(
            """
            INSERT INTO evidence (complaint_id, uploader_id, evidence_type, file_path, filename, file_size, mime_type, sha256_hash, notes)
            VALUES (?, ?, 'AFTER', ?, 'seed_light_after.jpg', ?, 'image/jpeg', ?, 'New 150W high-mast LED fixture installed and illuminated by Squad-07')
            """,
            (c3_id, user_ids["fixer"], light_a["url"], light_a["size"], light_a["sha256"])
        )

        cursor.execute(
            """
            INSERT INTO verification_results (
                complaint_id, verdict, confidence_score, location_match, landmarks_match,
                problem_still_visible, repair_complete, image_clarity_sufficient,
                explanation, evidence_comparison, human_review_recommended, is_demo_mode, disclaimer, geo_fence_distance
            ) VALUES (?, 'VERIFIED_FIXED', 96.5, 1, 1, 0, 1, 1,
                      'Location confirmed via VIP Road intersection curb geometry. Defective high-mast wiring fully overhauled, new LED luminaire installed and operating at standard luminosity.',
                      'BEFORE: Dark intersection with non-operational fixture.\nAFTER: High-mast fixture operational with full ground illumination.',
                      0, 1, 'AI verification verified with non-repudiation audit trail.', 8.5)
            """,
            (c3_id,)
        )

        cursor.execute(
            """
            INSERT INTO reporter_decisions (complaint_id, reporter_id, decision, feedback_comments)
            VALUES (?, ?, 'AGREED_FIXED', 'High-mast LED fixture #18 verified fully operational and illuminated across VIP Road crossing.')
            """,
            (c3_id, user_ids["citizen"])
        )

        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details, evidence_hash)
            VALUES (?, ?, 'Aarav Sharma', 'citizen', 'COMPLAINT_FILED', NULL, 'SUBMITTED', 'Citizen reported electrical outage on high-mast fixture #18.', ?)
            """,
            (c3_id, user_ids["citizen"], light_b["sha256"])
        )

        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details, evidence_hash)
            VALUES (?, ?, 'Rajesh Verma', 'fixer', 'REPAIR_EVIDENCE_SUBMITTED', 'IN_PROGRESS', 'REPAIR_SUBMITTED', 'Contractor Squad-07 uploaded AFTER photo of new 150W LED luminaire.', ?)
            """,
            (c3_id, user_ids["fixer"], light_a["sha256"])
        )

        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details)
            VALUES (?, ?, 'Aarav Sharma', 'citizen', 'AI_VERIFICATION_EVALUATED', 'REPAIR_SUBMITTED', 'AI_VERIFIED_FIXED', '[DEMO SIMULATION] AI multimodal verdict: VERIFIED_FIXED (Confidence: 96.5%, Geo-distance: 8.5m).')
            """,
            (c3_id, user_ids["citizen"])
        )

        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details)
            VALUES (?, ?, 'Aarav Sharma', 'citizen', 'REPORTER_CONFIRMED_FIX', 'AI_VERIFIED_FIXED', 'CLOSED_VERIFIED', 'Citizen approved resolution. Case permanently verified and sealed with SHA-256 proof.')
            """,
            (c3_id, user_ids["citizen"])
        )

        print(" Successfully seeded 3 realistic demo reports! All sample images synchronized to uploads/.")

if __name__ == "__main__":
    seed_demo_data(force=True)
