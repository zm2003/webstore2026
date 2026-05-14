import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
    const { cartCount } = useCart();
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <nav style={styles.navbar}>
            <Link to="/" style={styles.logo}>🛍️ TechStore</Link>
            <div style={styles.navLinks}>
                <Link to="/" style={location.pathname === '/' ? styles.navLinkActive : styles.navLink}>Directory</Link>
                <Link to="/home" style={location.pathname === '/home' ? styles.navLinkActive : styles.navLink}>Home</Link>
                <Link to="/products" style={location.pathname === '/products' ? styles.navLinkActive : styles.navLink}>Products</Link>
                <Link to="/cart" style={location.pathname === '/cart' ? styles.navLinkActive : styles.navLink}>
                    Cart {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
                </Link>
                <Link to="/checkout" style={location.pathname === '/checkout' ? styles.navLinkActive : styles.navLink}>Checkout</Link>
                {user?.role === 'admin' && (
                    <Link to="/admin" style={location.pathname === '/admin' ? styles.navLinkActive : styles.navLink}>Admin</Link>
                )}
                {(user?.role === 'admin' || user?.role === 'cashier') && (
                    <Link to="/pos" style={location.pathname === '/pos' ? styles.navLinkActive : styles.navLink}>POS</Link>
                )}
                <Link to="/orders" style={location.pathname === '/orders' ? styles.navLinkActive : styles.navLink}>Orders</Link>

                {user ? (
                    <button
                        onClick={() => {
                            logout();
                            window.location.href = '/login';
                        }}
                        style={styles.logoutBtn}
                    >
                        Logout
                    </button>
                ) : (
                    <Link to="/login" style={location.pathname === '/login' ? styles.navLinkActive : styles.navLink}>Login</Link>
                )}
            </div>
        </nav>
    );
}

const styles = {
    navbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 32px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
    },
    logo: {
        fontSize: '22px',
        fontWeight: '800',
        color: '#1a202c',
        textDecoration: 'none',
        letterSpacing: '-0.5px',
    },
    navLinks: {
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
    },
    navLink: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#4a5568',
        textDecoration: 'none',
    },
    navLinkActive: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#3182ce',
        textDecoration: 'none',
    },
    cartBadge: {
        backgroundColor: '#e53e3e',
        color: '#fff',
        fontSize: '11px',
        fontWeight: '700',
        padding: '2px 7px',
        borderRadius: '50px',
        minWidth: '18px',
        textAlign: 'center',
        marginLeft: '4px',
    },
    logoutBtn: {
        background: 'transparent',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        color: '#e53e3e',
        fontSize: '14px',
        fontWeight: '700',
        padding: '6px 12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    }
};
