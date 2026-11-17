import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime
from backend.app.config import DATABASE_PATH

_local = threading.local()

def get_connection():
    """Get a thread-local SQLite connection with foreign keys enabled."""
    if not hasattr(_local, "connection") or _local.connection is None:
        conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")
        _local.connection = conn
    return _local.connection

@contextmanager
def get_db():
    """Context manager for database transactions."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise

def init_db():
    """Create all required tables with indexes and constraints."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('citizen', 'fixer', 'admin')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 2. Complaints Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_code TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('Garbage', 'Road Damage', 'Pothole / Road', 'Water Leakage', 'Street Light')),
            location TEXT NOT NULL,
            latitude REAL DEFAULT 21.2514,
            longitude REAL DEFAULT 81.6296,
            citizen_id INTEGER NOT NULL REFERENCES users(id),
            fixer_id INTEGER REFERENCES users(id),
            status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN (
                'SUBMITTED', 
                'ASSIGNED',
                'IN_PROGRESS', 
                'REPAIR_SUBMITTED', 
                'AI_VERIFIED_FIXED', 
                'AI_NOT_VERIFIED', 
                'AI_INSUFFICIENT_EVIDENCE', 
                'CLOSED_VERIFIED', 
                'DISPUTED', 
                'ADMIN_APPROVED', 
                'ADMIN_REJECTED'
            )),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Migration helper for complaints table columns
        try:
            cursor.execute("ALTER TABLE complaints ADD COLUMN latitude REAL DEFAULT 21.2514;")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE complaints ADD COLUMN longitude REAL DEFAULT 81.6296;")
        except Exception:
            pass

        # 3. Evidence Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
            uploader_id INTEGER NOT NULL REFERENCES users(id),
            evidence_type TEXT NOT NULL CHECK(evidence_type IN ('BEFORE', 'AFTER')),
            file_path TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            sha256_hash TEXT NOT NULL,
            notes TEXT,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 4. Verification Results Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS verification_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
            verdict TEXT NOT NULL CHECK(verdict IN ('VERIFIED_FIXED', 'NOT_VERIFIED', 'INSUFFICIENT_EVIDENCE')),
            confidence_score REAL NOT NULL,
            location_match INTEGER NOT NULL,
            landmarks_match INTEGER NOT NULL,
            problem_still_visible INTEGER NOT NULL,
            repair_complete INTEGER NOT NULL,
            image_clarity_sufficient INTEGER NOT NULL,
            explanation TEXT NOT NULL,
            evidence_comparison TEXT NOT NULL,
            human_review_recommended INTEGER NOT NULL,
            raw_response TEXT,
            is_demo_mode INTEGER NOT NULL DEFAULT 0,
            disclaimer TEXT NOT NULL,
            geo_fence_distance REAL DEFAULT 0.0,
            fraud_detected INTEGER DEFAULT 0,
            fraud_reason TEXT DEFAULT '',
            verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Migration helpers for verification_results
        try:
            cursor.execute("ALTER TABLE verification_results ADD COLUMN geo_fence_distance REAL DEFAULT 0.0;")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE verification_results ADD COLUMN fraud_detected INTEGER DEFAULT 0;")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE verification_results ADD COLUMN fraud_reason TEXT DEFAULT '';")
        except Exception:
            pass

        # 5. Reporter Decisions Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reporter_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
            reporter_id INTEGER NOT NULL REFERENCES users(id),
            decision TEXT NOT NULL CHECK(decision IN ('AGREED_FIXED', 'DISAGREED_STILL_EXISTS')),
            feedback_comments TEXT,
            decided_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 6. Audit Logs Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
            actor_id INTEGER REFERENCES users(id),
            actor_name TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            action TEXT NOT NULL,
            old_status TEXT,
            new_status TEXT,
            details TEXT NOT NULL,
            evidence_hash TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Indexes for fast lookup
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_complaints_code ON complaints(complaint_code);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON complaints(citizen_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_evidence_complaint ON evidence(complaint_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_verifications_complaint ON verification_results(complaint_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_complaint ON audit_logs(complaint_id);")
