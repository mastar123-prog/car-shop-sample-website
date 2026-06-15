from csv import DictReader, DictWriter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

DB_PATH = Path(__file__).with_name("DB.csv")
ORDERS_PATH = Path(__file__).with_name("orders.csv")
USER_FIELDNAMES = ["username", "name", "email", "password"]
ORDER_FIELDNAMES = [
    "tracking_id",
    "username",
    "item",
    "price",
    "shipping_method",
    "address",
    "card_last4",
    "status",
    "created_at",
    "estimated_delivery",
]
SHIPPING_DAYS = {
    "One and Done": 1,
    "Urgent": 3,
    "Expedited": 5,
    "Standard Free": 7,
    "Economy Delay": 10,
}


def ensure_csv_exists(path, fieldnames):
    if not path.exists():
        with path.open("w", newline="", encoding="utf-8") as file:
            writer = DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()


def load_users():
    ensure_csv_exists(DB_PATH, USER_FIELDNAMES)
    with DB_PATH.open(newline="", encoding="utf-8") as file:
        return list(DictReader(file))


def save_user(user):
    ensure_csv_exists(DB_PATH, USER_FIELDNAMES)
    with DB_PATH.open("a", newline="", encoding="utf-8") as file:
        writer = DictWriter(file, fieldnames=USER_FIELDNAMES)
        writer.writerow(user)


def load_orders():
    ensure_csv_exists(ORDERS_PATH, ORDER_FIELDNAMES)
    with ORDERS_PATH.open(newline="", encoding="utf-8") as file:
        return list(DictReader(file))


def save_order(order):
    ensure_csv_exists(ORDERS_PATH, ORDER_FIELDNAMES)
    with ORDERS_PATH.open("a", newline="", encoding="utf-8") as file:
        writer = DictWriter(file, fieldnames=ORDER_FIELDNAMES)
        writer.writerow(order)


def normalize(value):
    return (value or "").strip().lower()


def public_order(order):
    return {
        "tracking_id": order.get("tracking_id", ""),
        "username": order.get("username", ""),
        "item": order.get("item", ""),
        "price": order.get("price", ""),
        "shipping_method": order.get("shipping_method", ""),
        "status": order.get("status", ""),
        "created_at": order.get("created_at", ""),
        "estimated_delivery": order.get("estimated_delivery", ""),
    }


def find_user(login_id, password):
    login_id = normalize(login_id)
    for user in load_users():
        email_matches = normalize(user.get("email")) == login_id
        username_matches = normalize(user.get("username")) == login_id
        password_matches = (user.get("password") or "").strip() == password

        if (email_matches or username_matches) and password_matches:
            return user

    return None


@app.route("/")
def home():
    return send_from_directory(app.root_path, "index.htm")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(app.root_path, filename)


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

    user = find_user(login_id, password)
    if user:
        return jsonify({
            "message": "Login successful!",
            "user": user.get("username", ""),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
        }), 200

    return jsonify({"error": "Invalid email/username or password"}), 401


@app.route("/orders", methods=["POST"])
def create_order():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    item = (data.get("item") or "").strip()
    price = str(data.get("price") or "").strip()
    shipping_method = (data.get("shipping_method") or "Standard Free").strip()
    address = (data.get("address") or "").strip()
    card_number = "".join(char for char in str(data.get("card_number") or "") if char.isdigit())

    if not username or not password or not item or not price or not address or not card_number:
        return jsonify({"error": "Please complete every order field"}), 400

    if len(card_number) < 12:
        return jsonify({"error": "Please enter a valid card number"}), 400

    user = find_user(username, password)
    if not user:
        return jsonify({"error": "Account username or password is incorrect"}), 401

    now = datetime.now(timezone.utc)
    delivery_days = SHIPPING_DAYS.get(shipping_method, SHIPPING_DAYS["Standard Free"])
    tracking_id = f"MCA-{uuid4().hex[:8].upper()}"
    order = {
        "tracking_id": tracking_id,
        "username": user.get("username", username),
        "item": item,
        "price": price,
        "shipping_method": shipping_method,
        "address": address,
        "card_last4": card_number[-4:],
        "status": "Processing",
        "created_at": now.date().isoformat(),
        "estimated_delivery": (now + timedelta(days=delivery_days)).date().isoformat(),
    }
    save_order(order)

    return jsonify({
        "message": "Order placed successfully!",
        "order": public_order(order),
    }), 201


@app.route("/orders/<tracking_id>", methods=["GET"])
def track_order(tracking_id):
    requested_id = normalize(tracking_id)
    for order in load_orders():
        if normalize(order.get("tracking_id")) == requested_id:
            return jsonify({"order": public_order(order)}), 200

    return jsonify({"error": "Tracking number not found"}), 404


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
