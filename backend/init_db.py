"""
init_db.py  –  Initialize the SQLite database for the Web Store backend.

Run this script once to create the products.db file and set up the table:

    cd backend
    python init_db.py
"""

import sqlite3  # Python's built-in library for working with SQLite databases
import os       # Used to check if the database file was created successfully

# ------------------------------------------------------------------
# 1. Connect to (or create) the database file
# ------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_filename = os.environ.get("DB_NAME", "products.db")
DATABASE = os.path.join(BASE_DIR, db_filename)
connection = sqlite3.connect(DATABASE)

# A "cursor" lets us execute SQL commands on the database
cursor = connection.cursor()

# ------------------------------------------------------------------
# 2. Create the products table (only if it doesn't already exist)
#    This ensures running the script multiple times is safe.
# ------------------------------------------------------------------
cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        price       REAL    NOT NULL,
        image       TEXT,
        category    TEXT,
        stock       INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        featured    INTEGER NOT NULL DEFAULT 0,
        onSale      INTEGER NOT NULL DEFAULT 0,
        salePercent INTEGER NOT NULL DEFAULT 0
    )
""")

# ------------------------------------------------------------------
# 2b. Create the orders table
# ------------------------------------------------------------------
cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName    TEXT    NOT NULL,
        phone       TEXT,
        email       TEXT,
        address     TEXT,
        city        TEXT,
        state       TEXT,
        zip         TEXT,
        country     TEXT,
        total       REAL    NOT NULL,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
""")

# ------------------------------------------------------------------
# 2c. Create the order_items table
# ------------------------------------------------------------------
cursor.execute("""
    CREATE TABLE IF NOT EXISTS order_items (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id    INTEGER NOT NULL REFERENCES orders(id),
        product_id  INTEGER NOT NULL,
        name        TEXT    NOT NULL,
        price       REAL    NOT NULL,
        quantity    INTEGER NOT NULL,
        image       TEXT
    )
""")

# ------------------------------------------------------------------
# 2d. Create the users table
# ------------------------------------------------------------------
cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        email       TEXT    UNIQUE,
        name        TEXT,
        role        TEXT    NOT NULL
    )
""")

# Insert default admin user if not exists
cursor.execute("SELECT id FROM users WHERE email = 'bellemeng@gmail.com'")
if not cursor.fetchone():
    cursor.execute(
        "INSERT INTO users (email, name, role) VALUES (?, ?, ?)",
        ("bellemeng@gmail.com", "Admin", "admin")
    )

# ------------------------------------------------------------------
# 3. Save (commit) the changes and close the connection
# ------------------------------------------------------------------
connection.commit()
connection.close()

# ------------------------------------------------------------------
# 4. Confirm that the database was created successfully
# ------------------------------------------------------------------
if os.path.exists(DATABASE):
    print(f"✅ {DATABASE} created successfully!")
else:
    print(f"❌ Something went wrong – {DATABASE} was not found.")
