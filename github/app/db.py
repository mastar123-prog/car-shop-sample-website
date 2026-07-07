import sqlite3
import os

DB_PATH = os.getenv("CYBEROVEN_DB_PATH", "cyberoven.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS vault_meta (
        id INTEGER PRIMARY KEY,
        salt_hex TEXT,
        verifier_hex TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS vault_storage (
        path TEXT PRIMARY KEY,
        nonce TEXT,
        ciphertext TEXT,
        tag TEXT
    )
    """)

    conn.commit()
    conn.close()