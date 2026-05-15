# TechStore

A modern, responsive e-commerce web application designed for students to purchase campus tech. The application features a React frontend and a robust Flask + SQLite backend. It includes core shopping functionalities such as a dynamic product catalog, shopping cart, and secure checkout. Additionally, the platform supports role-based access control (RBAC) via Google OAuth and JWTs, enabling an Admin Dashboard for inventory management, a Point of Sale (POS) system with bulk discount capabilities, and comprehensive order history tracking.

## Live Deployment

- **Frontend URL**: `[Insert Vercel URL here]`
- **Backend URL**: `[Insert PythonAnywhere URL here]`

## Screenshot

![TechStore Screenshot](https://i.imgur.com/525ULJF.png)

## How to Run Locally

Run the following three commands from the project root to start both the backend and frontend:

```bash
# 1. Start the Flask backend (runs on port 5001)
python backend/app.py &

# 2. Install frontend dependencies
cd frontend && npm install

# 3. Start the Vite frontend dev server
npm run dev
```

*(Note: Make sure you have Python and Node.js installed. If you prefer to run them in separate terminals, run `python backend/app.py` in one terminal, and `cd frontend && npm run dev` in another.)*

## Feature Extensions Completed

- **Backend Search**: Real-time filtering via `GET /api/products?q=keyword`.
- **Cart Persistence**: The cart survives page refreshes using `localStorage` (Front-end easy path).
- **Order CSV Export**: Admins can download all historical orders as a `.csv` file.
- **Admin Dashboard Charts**: Visualizes sales and revenue over time using `Chart.js`.
- **Bulk POS Discount**: Custom backend endpoint allowing Admins to apply percentage discounts dynamically during POS checkout.
