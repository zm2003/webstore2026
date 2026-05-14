import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './CartContext.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductStorePage from './pages/ProductStorePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import POSPage from './pages/POSPage.jsx';
import OrderHistoryPage from './pages/OrderHistoryPage.jsx';
import Navbar from './components/Navbar.jsx';
import RouterPage from './pages/RouterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { AuthProvider } from './AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<RouterPage />} />
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/shop" element={<ProductStorePage />} />
                        <Route path="/products" element={<ProductStorePage />} />
                        <Route path="/products/:id" element={<ProductDetailPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                        <Route path="/admin" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/pos" element={
                            <ProtectedRoute requiredRoles={['admin', 'cashier']}>
                                <POSPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/orders" element={<OrderHistoryPage />} />
                        <Route path="*" element={<div style={{ textAlign: 'center', padding: '50px', fontSize: '20px' }}>404 - Page Not Found</div>} />
                    </Routes>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
