# TechStore

A modern, responsive e-commerce web application designed for students to purchase campus tech. The application features a React frontend and a robust Flask + SQLite backend. It includes core shopping functionalities such as a dynamic product catalog, shopping cart, and secure checkout. Additionally, the platform supports role-based access control (RBAC) via Google OAuth and JWTs, enabling an Admin Dashboard for inventory management, a Point of Sale (POS) system with bulk discount capabilities, and comprehensive order history tracking.

## Live Deployment

- **Frontend URL**: `[Insert Vercel URL here]`
- **Backend URL**: `[Insert PythonAnywhere URL here]`

## Screenshot

![TechStore Screenshot](https://i.imgur.com/525ULJF.png)

## How to Run Locally

Follow these steps to clone the repository and run the application on your local machine using three chained commands:

```bash
# 1. Clone the repository and enter the directory
git clone https://github.com/zm2003/webstore2026.git && cd webstore2026

# 2. Install backend dependencies and start the Flask API in the background (runs on port 5001)
pip install -r backend/requirements.txt && python backend/app.py &

# 3. Navigate to the frontend, install dependencies, and start the React app
cd frontend && npm install && npm run dev
```

*(Note: Ensure you have Python and Node.js installed. For better visibility, you may run the backend and frontend commands in separate terminal windows by omitting the `&` at the end of command 2).*

## Feature Extensions Completed

- **Backend Search**: Real-time filtering via `GET /api/products?q=keyword`.
- **Cart Persistence**: The cart survives page refreshes using `localStorage` (Front-end easy path).
- **Order CSV Export**: Admins can download all historical orders as a `.csv` file.
- **Admin Dashboard Charts**: Visualizes sales and revenue over time using `Chart.js`.
- **Bulk POS Discount**: Custom backend endpoint allowing Admins to apply percentage discounts dynamically during POS checkout.
