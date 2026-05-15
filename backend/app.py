"""
app.py  –  Flask API backend for the Web Store.

== Setup ==
  cd backend
  pip install flask flask-cors
  python init_db.py          # create the database
  python seed_products.py    # populate with sample data

== Run ==
  python app.py

The server will start on http://localhost:5000

== Endpoints ==
  GET  /api/health          → {"status": "ok"}
  GET  /api/products        → JSON list of all products from the database
  GET  /api/products/<id>   → JSON object for one product (or 404 if not found)
  POST /api/orders          → Create a new order and return its id
  GET  /api/orders          → List orders (admin sees all; customers see own)

NOTE: Port 5001 is used because macOS AirPlay Receiver occupies port 5000.
"""

import os
from dotenv import load_dotenv

import sqlite3
import json
import csv
import io
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from flask_jwt_extended import JWTManager, create_access_token, verify_jwt_in_request, get_jwt_identity, get_jwt
from functools import wraps

load_dotenv()

app = Flask(__name__)

# Setup JWT manager
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback-secret-if-missing")
jwt = JWTManager(app)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Allow cross-origin requests
# In production, set ALLOWED_ORIGINS in your .env to your Vercel frontend URL.
# Example: ALLOWED_ORIGINS=https://your-app.vercel.app
# For local dev the default covers Vite's dev server.
_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS = _origins_env.split(",") if _origins_env != "*" else "*"
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# Path to the SQLite database file
# You can change this in your .env file via DB_NAME=Product.db
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_filename = os.getenv("DB_NAME", "products.db")
DATABASE = os.path.join(BASE_DIR, db_filename)


# ------------------------------------------------------------------
# Helper: connect to the database and return rows as dictionaries
# ------------------------------------------------------------------
def get_db_connection():
    """
    Open a connection to the SQLite database.
    row_factory = sqlite3.Row lets us access columns by name (like a dict).
    """
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row  # so rows behave like dictionaries
    return connection


def row_to_dict(row):
    """
    Convert a sqlite3.Row into a regular Python dict so Flask can jsonify it.
    Also converts 'featured' and 'onSale' from integers (0/1) to booleans.
    """
    d = dict(row)
    d["featured"] = bool(d.get("featured", 0))
    d["onSale"] = bool(d.get("onSale", 0))
    return d


# ------------------------------------------------------------------
# Auth Routes
# ------------------------------------------------------------------

@app.route("/api/auth/google-login", methods=["POST"])
def google_login():
    """Verify Google token and issue JWT."""
    data = request.get_json()
    token = data.get("credential")
    if not token:
        return jsonify({"error": "Missing credential"}), 400

    try:
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo.get("email")
        name = idinfo.get("name")

        connection = get_db_connection()
        user = connection.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        if not user:
            # Create new user as customer
            cursor = connection.cursor()
            cursor.execute(
                "INSERT INTO users (email, name, role) VALUES (?, ?, ?)",
                (email, name, "customer")
            )
            connection.commit()
            user_id = cursor.lastrowid
            role = "customer"
        else:
            # User exists
            user_id = dict(user)["id"]
            role = dict(user)["role"]

        connection.close()

        # Generate JWT token
        # identity must be a string in flask-jwt-extended v4+;
        # store role and email in additional_claims instead.
        access_token = create_access_token(
            identity=str(user_id),
            additional_claims={"email": email, "role": role}
        )
        return jsonify({"token": access_token}), 200

    except ValueError:
        # Invalid token
        return jsonify({"error": "Invalid token"}), 401


def require_role(role):
    """Decorator to require a specific role in the JWT."""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if not claims or claims.get("role") != role:
                return jsonify({"error": "Forbidden"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    """Health-check endpoint – always returns ok."""
    return jsonify({"status": "ok"})


@app.route("/api/products", methods=["GET"])
def get_products():
    """Return products from the database.

    Optional query param:
      ?q=keyword  — filters by name OR description using SQL LIKE (case-insensitive).
                    Returns all products when omitted.

    Example:
      GET /api/products          → all products
      GET /api/products?q=laptop → products where name or description contains "laptop"
    """
    q = request.args.get("q", "").strip()

    connection = get_db_connection()
    if q:
        pattern = f"%{q}%"
        rows = connection.execute(
            "SELECT * FROM products WHERE name LIKE ? OR description LIKE ?",
            (pattern, pattern)
        ).fetchall()
    else:
        rows = connection.execute("SELECT * FROM products").fetchall()
    connection.close()

    products = [row_to_dict(row) for row in rows]
    return jsonify(products)


@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    """Return ONE product by its id, or a 404 error if not found."""
    connection = get_db_connection()
    row = connection.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    connection.close()

    # If no product was found, return a 404 JSON error
    if row is None:
        return jsonify({"error": f"Product with id {product_id} not found"}), 404

    return jsonify(row_to_dict(row))


@app.route("/api/orders", methods=["POST"])
def create_order():
    """
    Create a new order.

    Expected JSON body:
    {
        "customer": { "fullName", "phone", "email", "address", "city", "state", "zip", "country" },
        "items": [ { "id", "name", "price", "quantity", "image" }, ... ],
        "total": 123.45
    }

    If the user sends a valid JWT (logged-in), their verified JWT email is used as the
    stored order email so that GET /api/orders can reliably match it.
    Guests fall back to the email they typed in the checkout form.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    customer = data.get("customer", {})
    items = data.get("items", [])
    total = data.get("total", 0)

    if not customer.get("fullName") or not items:
        return jsonify({"error": "Customer name and at least one item are required"}), 400

    # Optional JWT — use the verified email from the token for logged-in users
    verify_jwt_in_request(optional=True)
    claims = get_jwt()  # empty dict if no JWT present
    jwt_email = claims.get("email")
    order_email = jwt_email if jwt_email else customer.get("email", "")

    connection = get_db_connection()
    try:
        cursor = connection.cursor()

        # Insert order header — use verified JWT email for logged-in users
        cursor.execute(
            """INSERT INTO orders (fullName, phone, email, address, city, state, zip, country, total)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                customer.get("fullName", ""),
                customer.get("phone", ""),
                order_email,
                customer.get("address", ""),
                customer.get("city", ""),
                customer.get("state", ""),
                customer.get("zip", ""),
                customer.get("country", ""),
                total,
            ),
        )
        order_id = cursor.lastrowid

        # Insert order items
        for item in items:
            cursor.execute(
                """INSERT INTO order_items (order_id, product_id, name, price, quantity, image)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    order_id,
                    item.get("id", 0),
                    item.get("name", ""),
                    item.get("price", 0),
                    item.get("quantity", 1),
                    item.get("image", ""),
                ),
            )

        connection.commit()
        return jsonify({"orderId": order_id, "orderNumber": f"ORD-{order_id:05d}"}), 201

    except sqlite3.Error as e:
        connection.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()


@app.route("/api/orders", methods=["GET"])
def get_orders():
    """
    Return orders based on authentication status:
    - Admin (JWT): returns ALL orders
    - Logged-in customer (JWT): returns orders matching their JWT email
    - Guest (no JWT): requires ?email=... query param, returns matching orders only
    """
    # Optional auth — won't raise an error if no JWT is present
    verify_jwt_in_request(optional=True)
    claims = get_jwt()  # empty dict if no JWT

    role = claims.get("role")
    jwt_email = claims.get("email")

    connection = get_db_connection()
    try:
        if role == "admin":
            # Admins see everything
            rows = connection.execute(
                "SELECT * FROM orders ORDER BY created_at DESC"
            ).fetchall()
        elif jwt_email:
            # Logged-in customer: filter by their email from JWT
            rows = connection.execute(
                "SELECT * FROM orders WHERE email = ? ORDER BY created_at DESC",
                (jwt_email,)
            ).fetchall()
        else:
            # Guest: require email query parameter
            guest_email = request.args.get("email", "").strip()
            if not guest_email:
                return jsonify({"error": "Please provide your email address to look up orders."}), 400
            rows = connection.execute(
                "SELECT * FROM orders WHERE email = ? ORDER BY created_at DESC",
                (guest_email,)
            ).fetchall()

        orders = []
        for row in rows:
            order = dict(row)
            items = connection.execute(
                "SELECT * FROM order_items WHERE order_id = ?",
                (order["id"],)
            ).fetchall()
            order["items"] = [dict(item) for item in items]
            orders.append(order)

        return jsonify(orders)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        connection.close()


@app.route("/api/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    """
    Update one product by its id.

    Accepts a JSON body with any combination of:
        name, price, stock, category, description, featured, onSale, salePercent

    Returns the updated product or 404 if not found.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    connection = get_db_connection()
    # Check the product exists
    existing = connection.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    if existing is None:
        connection.close()
        return jsonify({"error": f"Product with id {product_id} not found"}), 404

    # Build SET clause dynamically from provided fields
    allowed = ["name", "price", "stock", "category", "description",
               "featured", "onSale", "salePercent"]
    updates = []
    values = []
    for field in allowed:
        if field in data:
            updates.append(f"{field} = ?")
            values.append(data[field])

    if not updates:
        connection.close()
        return jsonify({"error": "No valid fields to update"}), 400

    values.append(product_id)
    sql = f"UPDATE products SET {', '.join(updates)} WHERE id = ?"

    try:
        connection.execute(sql, values)
        connection.commit()
        updated = connection.execute(
            "SELECT * FROM products WHERE id = ?", (product_id,)
        ).fetchone()
        connection.close()
        return jsonify(row_to_dict(updated))
    except sqlite3.Error as e:
        connection.close()
        return jsonify({"error": str(e)}), 500


@app.route("/api/products/<int:product_id>/stock", methods=["PATCH"])
def adjust_stock(product_id):
    """
    Quick stock adjustment (relative).

    Expects JSON: { "delta": 1 }  or  { "delta": -1 }
    Adds delta to the current stock value (will not go below 0).
    """
    data = request.get_json()
    if not data or "delta" not in data:
        return jsonify({"error": "JSON body with 'delta' is required"}), 400

    delta = int(data["delta"])

    connection = get_db_connection()
    row = connection.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    if row is None:
        connection.close()
        return jsonify({"error": f"Product with id {product_id} not found"}), 404

    new_stock = max(0, dict(row)["stock"] + delta)

    try:
        connection.execute(
            "UPDATE products SET stock = ? WHERE id = ?", (new_stock, product_id)
        )
        connection.commit()
        updated = connection.execute(
            "SELECT * FROM products WHERE id = ?", (product_id,)
        ).fetchone()
        connection.close()
        return jsonify(row_to_dict(updated))
    except sqlite3.Error as e:
        connection.close()
        return jsonify({"error": str(e)}), 500


@app.route("/api/products/<int:product_id>/stock", methods=["PUT"])
@require_role("admin")
def set_stock(product_id):
    """
    Set stock to an absolute value (admin restock).

    Expects JSON: { "stock": 25 }
    Updates the stock column directly to the given value.
    Returns the updated product as JSON.
    Returns 400 for invalid/missing data, 404 if product not found.
    """
    # --- 1. Read and validate the request body ---
    data = request.get_json()
    if not data or "stock" not in data:
        return jsonify({"error": "JSON body with 'stock' is required"}), 400

    # Make sure stock is a non-negative integer
    try:
        new_stock = int(data["stock"])
        if new_stock < 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "stock must be a non-negative integer"}), 400

    # --- 2. Check the product exists ---
    connection = get_db_connection()
    row = connection.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    if row is None:
        connection.close()
        return jsonify({"error": f"Product with id {product_id} not found"}), 404

    # --- 3. Update the stock value ---
    try:
        connection.execute(
            "UPDATE products SET stock = ? WHERE id = ?", (new_stock, product_id)
        )
        connection.commit()

        # Fetch the updated product to return it
        updated = connection.execute(
            "SELECT * FROM products WHERE id = ?", (product_id,)
        ).fetchone()
        connection.close()
        return jsonify(row_to_dict(updated))
    except sqlite3.Error as e:
        connection.close()
        return jsonify({"error": str(e)}), 500


# ------------------------------------------------------------------
# Feature: Order Export to CSV  (Admin only)
# ------------------------------------------------------------------

@app.route("/api/orders/export", methods=["GET"])
def export_orders_csv():
    """Stream all orders + line items as a downloadable CSV file.

    Admin-only: requires a valid JWT with role == 'admin'.

    Columns:
      Order ID, Date, Customer Name, Email, Phone,
      Address, Total, Product Name, Qty, Unit Price, Line Total

    Teaches: io.StringIO, csv.writer, Flask Response streaming.
    """
    # ── Auth: admin only ────────────────────────────────────────────
    verify_jwt_in_request(optional=False)
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Forbidden: admin access required"}), 403

    connection = get_db_connection()
    try:
        # Single query: join orders → order_items for all rows
        rows = connection.execute("""
            SELECT
                o.id          AS order_id,
                o.created_at  AS date,
                o.fullName    AS customer_name,
                o.email,
                o.phone,
                o.address,
                o.city,
                o.state,
                o.zip,
                o.country,
                o.total       AS order_total,
                oi.name       AS product_name,
                oi.quantity,
                oi.price      AS unit_price
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            ORDER BY o.created_at DESC, o.id, oi.id
        """).fetchall()
    finally:
        connection.close()

    # ── Build CSV in memory ─────────────────────────────────────────
    buf = io.StringIO()
    writer = csv.writer(buf)

    # Header row
    writer.writerow([
        "Order ID", "Date", "Customer Name", "Email", "Phone",
        "Address", "City", "State", "ZIP", "Country",
        "Order Total", "Product", "Qty", "Unit Price", "Line Total"
    ])

    # Data rows
    for r in rows:
        qty        = r["quantity"] or 0
        unit_price = r["unit_price"] or 0
        writer.writerow([
            r["order_id"],
            r["date"],
            r["customer_name"] or "",
            r["email"]         or "",
            r["phone"]         or "",
            r["address"]       or "",
            r["city"]          or "",
            r["state"]         or "",
            r["zip"]           or "",
            r["country"]       or "",
            f"${r['order_total']:.2f}",
            r["product_name"]  or "",
            qty,
            f"${unit_price:.2f}",
            f"${qty * unit_price:.2f}",
        ])

    csv_output = buf.getvalue()
    buf.close()

    return Response(
        csv_output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders_export.csv"}
    )


# ------------------------------------------------------------------
# Main guard
# ------------------------------------------------------------------

if __name__ == "__main__":
    # Use port 5001 because macOS AirPlay Receiver occupies port 5000
    app.run(host="127.0.0.1", port=5001, debug=True)
