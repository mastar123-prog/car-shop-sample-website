import base64
import hashlib
from Crypto.Cipher import AES
import logging

def derive_kek(password, salt):
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310000, dklen=32)

def encrypt_gcm(text, key):
    try:
        cipher = AES.new(key, AES.MODE_GCM)
        ct, tag = cipher.encrypt_and_digest(text.encode())

        return {
            "nonce": base64.b64encode(cipher.nonce).decode(),
            "ciphertext": base64.b64encode(ct).decode(),
            "tag": base64.b64encode(tag).decode()
        }
    except Exception as e:
        logging.error(e)
        return None

def decrypt_gcm(nonce, ct, tag, key):
    try:
        cipher = AES.new(key, AES.MODE_GCM, nonce=base64.b64decode(nonce))
        return cipher.decrypt_and_verify(
            base64.b64decode(ct),
            base64.b64decode(tag)
        ).decode()
    except Exception:
        return "DECRYPTION_FAILED"