import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';

export default function CartPage() {
    const { items, addToCart, removeFromCart, deleteFromCart, clearCart, cartCount, cartTotal } = useCart();

    if (items.length === 0) {
        return (
            <div style={styles.page}>
                <div style={styles.empty}>
                    <p style={{ fontSize: '64px', margin: '0 0 12px' }}>🛒</p>
                    <h1 style={{ margin: '0 0 8px', color: '#1a202c', fontSize: '28px' }}>Your Cart is Empty</h1>
                    <p style={{ color: '#718096', margin: '0 0 28px', fontSize: '16px' }}>Looks like you haven't added anything yet.</p>
                    <Link to="/products" style={styles.shopLink}>← Continue Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* ── Breadcrumb ── */}
            <nav style={styles.breadcrumb}>
                <Link to="/" style={styles.breadcrumbLink}>Home</Link>
                <span style={styles.breadcrumbSep}>/</span>
                <span style={styles.breadcrumbCurrent}>Cart ({cartCount})</span>
            </nav>

            <h1 style={styles.title}>Shopping Cart</h1>

            <div style={styles.layout}>
                {/* ── Line items ── */}
                <div style={styles.itemsCol}>
                    {items.map(({ product, quantity }) => {
                        // Stock helpers
                        let stockLabel, stockColor;
                        if (product.stock === 0) { stockLabel = 'Out of Stock'; stockColor = '#e53e3e'; }
                        else if (product.stock < 10) { stockLabel = 'Low Stock'; stockColor = '#dd6b20'; }
                        else { stockLabel = 'In Stock'; stockColor = '#38a169'; }

                        return (
                            <div key={product.id} style={styles.item}>
                                <Link to={`/products/${product.id}`}>
                                    <img src={product.image} alt={product.name} style={styles.itemImage} />
                                </Link>
                                <div style={styles.itemInfo}>
                                    <Link to={`/products/${product.id}`} style={styles.itemName}>{product.name}</Link>
                                    <span style={styles.itemCategory}>{product.category}</span>
                                    <p style={{ ...styles.itemStock, color: stockColor }}>● {stockLabel}</p>
                                </div>
                                <div style={styles.itemPrice}>${product.price.toFixed(2)}</div>
                                <div style={styles.qtyControls}>
                                    <button style={styles.qtyBtn} onClick={() => removeFromCart(product.id)}>−</button>
                                    <span style={styles.qtyValue}>{quantity}</span>
                                    <button style={styles.qtyBtn} onClick={() => addToCart(product)}>+</button>
                                </div>
                                <div style={styles.lineTotal}>${(product.price * quantity).toFixed(2)}</div>
                                <button style={styles.removeBtn} onClick={() => deleteFromCart(product.id)} title="Remove">✕</button>
                            </div>
                        );
                    })}
                </div>

                {/* ── Summary sidebar ── */}
                <div style={styles.summary}>
                    <h2 style={styles.summaryTitle}>Order Summary</h2>
                    <div style={styles.summaryRow}>
                        <span>Items</span><span>{cartCount}</span>
                    </div>
                    <div style={styles.summaryRow}>
                        <span>Subtotal</span><span style={{ fontWeight: '800' }}>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div style={styles.summaryDivider} />
                    <div style={{ ...styles.summaryRow, fontSize: '20px', fontWeight: '800' }}>
                        <span>Total</span><span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <Link to="/checkout" style={styles.checkoutBtn}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Proceed to Checkout
                    </Link>
                    <Link to="/products" style={styles.continueLink}>← Continue Shopping</Link>
                    <button style={styles.clearBtn} onClick={clearCart}>Clear Cart</button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#f7f8fc',
        fontFamily: "'Segoe UI', sans-serif",
        padding: '32px 24px',
    },

    /* Empty state */
    empty: {
        textAlign: 'center',
        padding: '120px 20px',
    },
    shopLink: {
        display: 'inline-block',
        padding: '14px 32px',
        fontSize: '15px',
        fontWeight: '700',
        color: '#fff',
        background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
        borderRadius: '12px',
        textDecoration: 'none',
        boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
    },

    /* Breadcrumb */
    breadcrumb: {
        maxWidth: '1100px',
        margin: '0 auto 20px',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    breadcrumbLink: { color: '#3182ce', textDecoration: 'none', fontWeight: '500' },
    breadcrumbSep: { color: '#a0aec0' },
    breadcrumbCurrent: { color: '#4a5568', fontWeight: '600' },

    title: {
        maxWidth: '1100px',
        margin: '0 auto 32px',
        fontSize: '32px',
        fontWeight: '800',
        color: '#1a202c',
    },

    /* Layout */
    layout: {
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'flex',
        gap: '32px',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
    },
    itemsCol: {
        flex: '1 1 600px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },

    /* Single item row */
    item: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        backgroundColor: '#fff',
        borderRadius: '14px',
        padding: '16px 20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        flexWrap: 'wrap',
    },
    itemImage: {
        width: '80px',
        height: '80px',
        objectFit: 'cover',
        borderRadius: '10px',
        display: 'block',
    },
    itemInfo: {
        flex: '1 1 160px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: '120px',
    },
    itemName: {
        margin: 0,
        fontSize: '15px',
        fontWeight: '700',
        color: '#1a202c',
        textDecoration: 'none',
        lineHeight: '1.3',
    },
    itemCategory: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#3182ce',
        backgroundColor: '#ebf4ff',
        padding: '2px 8px',
        borderRadius: '20px',
        width: 'fit-content',
        textTransform: 'capitalize',
    },
    itemStock: {
        margin: 0,
        fontSize: '12px',
        fontWeight: '600',
    },
    itemPrice: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#4a5568',
        minWidth: '80px',
        textAlign: 'right',
    },
    qtyControls: {
        display: 'flex',
        alignItems: 'center',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
    },
    qtyBtn: {
        width: '36px',
        height: '36px',
        border: 'none',
        backgroundColor: '#f7fafc',
        fontSize: '18px',
        fontWeight: '700',
        cursor: 'pointer',
        color: '#2d3748',
    },
    qtyValue: {
        width: '36px',
        textAlign: 'center',
        fontSize: '15px',
        fontWeight: '700',
        color: '#1a202c',
    },
    lineTotal: {
        fontSize: '17px',
        fontWeight: '800',
        color: '#1a202c',
        minWidth: '90px',
        textAlign: 'right',
    },
    removeBtn: {
        width: '32px',
        height: '32px',
        border: 'none',
        backgroundColor: '#fed7d7',
        color: '#e53e3e',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    /* Summary */
    summary: {
        flex: '0 0 320px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '28px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'sticky',
        top: '24px',
    },
    summaryTitle: {
        margin: 0,
        fontSize: '20px',
        fontWeight: '800',
        color: '#1a202c',
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '15px',
        color: '#4a5568',
    },
    summaryDivider: {
        height: '1px',
        backgroundColor: '#e2e8f0',
    },
    checkoutBtn: {
        marginTop: '8px',
        padding: '16px',
        fontSize: '16px',
        fontWeight: '700',
        color: '#fff',
        background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
        transition: 'transform 0.2s ease',
        fontFamily: "'Segoe UI', sans-serif",
        textDecoration: 'none',
        textAlign: 'center',
        display: 'block',
    },
    continueLink: {
        textAlign: 'center',
        color: '#3182ce',
        fontSize: '14px',
        fontWeight: '600',
        textDecoration: 'none',
    },
    clearBtn: {
        padding: '10px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#e53e3e',
        backgroundColor: 'transparent',
        border: '1px solid #fed7d7',
        borderRadius: '8px',
        cursor: 'pointer',
        fontFamily: "'Segoe UI', sans-serif",
    },
};
