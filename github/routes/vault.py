from flask import Blueprint, request, abort
from ..db import get_db
from ..crypto import derive_kek, encrypt_gcm, decrypt_gcm
from ..security import limiter
import secrets

vault_bp = Blueprint("vault", __name__)

RUNNING = {"sealed": True, "kek": None}

@vault_bp.post("/init")
def init():
    mp = request.form.get("mp", "")
    salt = secrets.token_bytes(16)
    kek = derive_kek(mp, salt)

    conn = get_db()
    conn.execute(
        "INSERT INTO vault_meta (id, salt_hex, verifier_hex) VALUES (1, ?, ?)",
        (salt.hex(), kek.hex())
    )
    conn.commit()
    conn.close()

    return {"status": "initialized"}

@vault_bp.post("/unseal")
def unseal():
    mp = request.form.get("mp", "")
    conn = get_db()
    row = conn.execute("SELECT salt_hex, verifier_hex FROM vault_meta WHERE id=1").fetchone()
    conn.close()

    if not row:
        abort(400)

    salt = bytes.fromhex(row[0])
    kek = derive_kek(mp, salt)

    if kek.hex() == row[1]:
        RUNNING["sealed"] = False
        RUNNING["kek"] = kek
        return {"status": "unsealed"}

    abort(403)

@vault_bp.post("/w")
@limiter.limit("10/minute")
def write():
    if RUNNING["sealed"]:
        abort(401)

    p = request.form["p"]
    d = request.form["d"]

    enc = encrypt_gcm(d, RUNNING["kek"])

    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO vault_storage VALUES (?, ?, ?, ?)",
        (p, enc["nonce"], enc["ciphertext"], enc["tag"])
    )
    conn.commit()
    conn.close()

    return {"status": "written"}

@vault_bp.post("/r")
def read():
    if RUNNING["sealed"]:
        abort(401)

    p = request.form["p"]

    conn = get_db()
    row = conn.execute(
        "SELECT nonce, ciphertext, tag FROM vault_storage WHERE path=?",
        (p,)
    ).fetchone()
    conn.close()

    if not row:
        abort(404)

    return {
        "data": decrypt_gcm(row[0], row[1], row[2], RUNNING["kek"])
    }