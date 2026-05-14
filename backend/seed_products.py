"""
seed_products.py  –  Populate the products table with sample data.

Make sure you have already run init_db.py first to create products.db.

    cd backend
    python init_db.py          # create the database (if not done yet)
    python seed_products.py    # insert sample products
"""

import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_filename = os.environ.get("DB_NAME", "products.db")
DATABASE = os.path.join(BASE_DIR, db_filename)

# ------------------------------------------------------------------
# 1. Define sample products (18 products across 4 categories)
# ------------------------------------------------------------------
PRODUCTS = [
    # ── Laptops (5) ──
    {
        "name": "MacBook Pro 14-inch (M3)",
        "price": 1599.00,
        "image": "https://picsum.photos/seed/macbook/400/300",
        "category": "laptops",
        "stock": 12,
        "description": "The ultimate pro laptop with the M3 chip. Delivers game-changing performance and up to 22 hours of battery life.",
        "featured": 1,
        "onSale": 0,
        "salePercent": 0,
    },
    {
        "name": "Dell XPS 15",
        "price": 1299.00,
        "image": "https://picsum.photos/seed/dell/400/300",
        "category": "laptops",
        "stock": 8,
        "description": "A stunning 15-inch display combined with incredible power. Perfect for creators and students alike.",
        "featured": 0,
        "onSale": 1,
        "salePercent": 15,
    },
    {
        "name": "Lenovo ThinkPad X1 Carbon",
        "price": 1499.00,
        "image": "https://picsum.photos/seed/thinkpad/400/300",
        "category": "laptops",
        "stock": 5,
        "description": "Ultralight and ultra-powerful laptop designed for professionals. Features legendary keyboard comfort and robust security.",
        "featured": 0,
        "onSale": 0,
        "salePercent": 0,
    },
    {
        "name": "ASUS ROG Zephyrus G14",
        "price": 1399.00,
        "image": "https://picsum.photos/seed/rog/400/300",
        "category": "laptops",
        "stock": 6,
        "description": "A powerhouse gaming laptop that fits in your backpack. Features AMD Ryzen 9 and RTX 4060 for smooth gaming and multitasking.",
        "featured": 1,
        "onSale": 1,
        "salePercent": 10,
    },
    {
        "name": "HP Spectre x360",
        "price": 1249.00,
        "image": "https://picsum.photos/seed/hpspectre/400/300",
        "category": "laptops",
        "stock": 3,
        "description": "A sleek 2-in-1 convertible with a stunning OLED display. Perfect for note-taking in class and presentations.",
        "featured": 0,
        "onSale": 0,
        "salePercent": 0,
    },

    # ── Tablets (4) ──
    {
        "name": "iPad Air",
        "price": 599.00,
        "image": "https://picsum.photos/seed/ipad/400/300",
        "category": "tablets",
        "stock": 15,
        "description": "Lightweight and versatile with the M1 chip. Supports Apple Pencil for all your note-taking needs.",
        "featured": 1,
        "onSale": 0,
        "salePercent": 0,
    },
    {
        "name": "Samsung Galaxy Tab S9",
        "price": 799.00,
        "image": "https://picsum.photos/seed/samsungtab/400/300",
        "category": "tablets",
        "stock": 6,
        "description": "Experience vibrant colors on a stunning AMOLED display. Comes with the S Pen included.",
        "featured": 0,
        "onSale": 0,
        "salePercent": 0,
    },
    {
        "name": "iPad Mini",
        "price": 499.00,
        "image": "https://picsum.photos/seed/ipadmini/400/300",
        "category": "tablets",
        "stock": 10,
        "description": "The most portable iPad with A15 chip. Fits in one hand — perfect for reading and quick notes between classes.",
        "featured": 0,
        "onSale": 1,
        "salePercent": 12,
    },
    {
        "name": "Microsoft Surface Go 3",
        "price": 399.00,
        "image": "https://picsum.photos/seed/surfacego/400/300",
        "category": "tablets",
        "stock": 4,
        "description": "An affordable 2-in-1 running full Windows 11. Great for students who need a tablet and laptop in one device.",
        "featured": 0,
        "onSale": 0,
        "salePercent": 0,
    },

    # ── Audio (5) ──
    {
        "name": "Sony WH-1000XM5 Headphones",
        "price": 349.00,
        "image": "https://picsum.photos/seed/sony/400/300",
        "category": "audio",
        "stock": 20,
        "description": "Industry-leading noise cancellation to help you focus on studying. Exceptional sound quality and comfort.",
        "featured": 1,
        "onSale": 0,
        "salePercent": 0,
    },
    {
        "name": "AirPods Pro (2nd Generation)",
        "price": 249.00,
        "image": "https://picsum.photos/seed/airpods/400/300",
        "category": "audio",
        "stock": 18,
        "description": "Rich audio quality with intelligent noise cancellation. The perfect everyday companion for campus life.",
        "featured": 0,
        "onSale": 1,
        "salePercent": 20,
    },
    {
        "name": "JBL Flip 6 Bluetooth Speaker",
        "price": 129.00,
        "image": "https://picsum.photos/seed/jblflip/400/300",
        "category": "audio",
        "stock": 22,
        "description": "Portable waterproof speaker with bold JBL Original Pro Sound. Great for dorm rooms and outdoor hangouts.",
        "featured": 0,
        "onSale": 0,
        "salePercent": 0,
    },
    {
        "name": "Bose QuietComfort Earbuds II",
        "price": 279.00,
        "image": "https://picsum.photos/seed/boseqc/400/300",
        "category": "audio",
        "stock": 0,
        "description": "Personalized noise cancellation that adapts to your ear shape. Immersive sound for library study sessions.",
        "featured": 0,
        "onSale": 0,
        "salePercent": 0,
    },

    # ── Accessories (4) ──
    {
        "name": "Logitech MX Master 3S Mouse",
        "price": 99.00,
        "image": "https://picsum.photos/seed/logitech/400/300",
        "category": "accessories",
        "stock": 10,
        "description": "Advanced ergonomic mouse for ultimate comfort and productivity. Features ultra-fast scrolling and customizable buttons.",
        "featured": 0,
        "onSale": 0,
        "salePercent": 0,
    },
    {
        "name": "Anker 735 USB-C Charger (65W)",
        "price": 49.00,
        "image": "https://picsum.photos/seed/anker/400/300",
        "category": "accessories",
        "stock": 14,
        "description": "Compact and powerful charger for all your devices. Capable of charging laptops, phones, and tablets quickly.",
        "featured": 0,
        "onSale": 0,
        "salePercent": 0,
    },
    {
        "name": "Portable Monitor 15.6 inch",
        "price": 159.00,
        "image": "https://picsum.photos/seed/monitor/400/300",
        "category": "accessories",
        "stock": 11,
        "description": "Expand your workspace anywhere with this lightweight 1080p portable monitor. Connects easily via USB-C or HDMI.",
        "featured": 1,
        "onSale": 0,
        "salePercent": 0,
    },
    {
        "name": "Keychron K2 Mechanical Keyboard",
        "price": 89.00,
        "image": "https://picsum.photos/seed/keychron/400/300",
        "category": "accessories",
        "stock": 2,
        "description": "A compact wireless mechanical keyboard with RGB backlight. Satisfying typing experience for coding and essays.",
        "featured": 0,
        "onSale": 1,
        "salePercent": 10,
    },
]

# ------------------------------------------------------------------
# 2. Connect to the database and insert the products
# ------------------------------------------------------------------
try:
    connection = sqlite3.connect("products.db")
    cursor = connection.cursor()

    # Clear existing products to avoid duplicates
    cursor.execute("DELETE FROM products")

    # SQL statement with placeholders (? marks) for safe insertion
    sql = """
        INSERT INTO products (name, price, image, category, stock, description, featured, onSale, salePercent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    count = 0
    for product in PRODUCTS:
        cursor.execute(sql, (
            product["name"],
            product["price"],
            product["image"],
            product["category"],
            product["stock"],
            product["description"],
            product["featured"],
            product["onSale"],
            product["salePercent"],
        ))
        count += 1

    # Save all inserts to the database
    connection.commit()
    print(f"✅ Successfully inserted {count} products into products.db!")

except sqlite3.Error as e:
    print(f"❌ Database error: {e}")

finally:
    # Always close the connection, even if an error occurred
    connection.close()
