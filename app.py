from csv import DictReader, DictWriter
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

DB_PATH = Path(__file__).with_name("DB.csv")
FIELDNAMES = ["username", "name", "email", "password"]


def ensure_db_exists():
    if not DB_PATH.exists():
        with DB_PATH.open("w", newline="", encoding="utf-8") as file:
            writer = DictWriter(file, fieldnames=FIELDNAMES)
            writer.writeheader()


def load_users():
    ensure_db_exists()
    with DB_PATH.open(newline="", encoding="utf-8") as file:
        return list(DictReader(file))


def save_user(user):
    ensure_db_exists()
    with DB_PATH.open("a", newline="", encoding="utf-8") as file:
        writer = DictWriter(file, fieldnames=FIELDNAMES)
        writer.writerow(user)


def normalize(value):
    return (value or "").strip().lower()


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = normalize(data.get("email"))
    password = data.get("password") or ""
    username = (data.get("username") or email.split("@")[0]).strip()

    if not name or not email or not password:
        return jsonify({"error": "Please provide name, email, and password"}), 400

    users = load_users()
    username_exists = any(normalize(user.get("username")) == normalize(username) for user in users)
    email_exists = any(normalize(user.get("email")) == email for user in users)

    if username_exists or email_exists:
        return jsonify({"error": "An account with that email or username already exists"}), 409

    save_user({
        "username": username,
        "name": name,
        "email": email,
        "password": password,
    })

    return jsonify({"message": "Registration successful!"}), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    login_id = normalize(data.get("email") or data.get("username"))
    password = data.get("password") or ""

    if not login_id or not password:
        return jsonify({"error": "Please provide email/username and password"}), 400

    for user in load_users():
        email_matches = normalize(user.get("email")) == login_id
        username_matches = normalize(user.get("username")) == login_id
        password_matches = (user.get("password") or "").strip() == password

        if (email_matches or username_matches) and password_matches:
            return jsonify({
                "message": "Login successful!",
                "user": user.get("username", ""),
                "name": user.get("name", ""),
                "email": user.get("email", ""),
            }), 200

    return jsonify({"error": "Invalid email/username or password"}), 401


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
