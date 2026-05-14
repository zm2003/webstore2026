import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';

export default function OrderConfirmationPage() {
    const location = useLocation();
    const order = location.state;

    // If user navigates here directly without order data, redirect to home
    if (!order) return <Navigate to="/" replace />;

    const { orderNumber, customer, items, total } = order;

    return (
        <div style={styles.page}>
            <div style={styles.container}>

                {/* ── Success header ── */}
                <div style={styles.successHeader}>
                    <div style={styles.checkCircle}>✓</div>
                    <h1 style={styles.title}>Order Placed Successfully!</h1>
                    <p style={styles.subtitle}>Thank you for your purchase, {customer.fullName}.</p>
                    <div style={styles.orderNumBox}>
                        <span style={styles.orderNumLabel}>Order Number</span>
                        <span style={styles.orderNum}>{orderNumber}</span>
                    </div>
                </div>

                {/* ── Two-column details ── */}
                <div style={styles.columns}>

                    {/* Customer & Shipping */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>📬 Delivery Details</h2>
                        <div style={styles.detailGroup}>
                            <p style={styles.detailLabel}>Name</p>
                            <p style={styles.detailValue}>{customer.fullName}</p>
                        </div>
                        <div style={styles.detailGroup}>
                            <p style={styles.detailLabel}>Email</p>
                            <p style={styles.detailValue}>{customer.email}</p>
                        </div>
                        <div style={styles.detailGroup}>
                            <p style={styles.detailLabel}>Phone</p>
                            <p style={styles.detailValue}>{customer.phone}</p>
                        </div>
                        <div style={styles.divider} />
                        <div style={styles.detailGroup}>
                            <p style={styles.detailLabel}>Shipping Address</p>
                            <p style={styles.detailValue}>
                                {customer.address}<br />
                                {customer.city}, {customer.state} {customer.zip}<br />
                                {customer.country}
                            </p>
                        </div>
                    </div>

                    {/* Order items */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>🧾 Order Summary</h2>
                        <div style={styles.itemsList}>
                            {items.map((item, i) => (
                                <div key={i} style={styles.item}>
                                    <img src={item.image} alt={item.name} style={styles.itemImg} />
                                    <div style={styles.itemInfo}>
                                        <p style={styles.itemName}>{item.name}</p>
                                        <p style={styles.itemMeta}>Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                                    </div>
                                    <p style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div style={styles.divider} />
                        <div style={styles.totalRow}>
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div style={styles.actions}>
                    <Link to="/products" style={styles.primaryBtn}>Continue Shopping</Link>
                    <Link to="/" style={styles.secondaryBtn}>Back to Home</Link>
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
        padding: '48px 24px 80px',
    },
    container: {
        maxWidth: '900px',
        margin: '0 auto',
    },

    /* Success header */
    successHeader: {
        textAlign: 'center',
        marginBottom: '40px',
    },
    checkCircle: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)',
        color: '#fff',
        fontSize: '40px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        boxShadow: '0 8px 28px rgba(56,161,105,0.35)',
    },
    title: {
        margin: '0 0 8px',
        fontSize: '32px',
        fontWeight: '800',
        color: '#1a202c',
    },
    subtitle: {
        margin: '0 0 20px',
        fontSize: '17px',
        color: '#718096',
    },
    orderNumBox: {
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#ebf8ff',
        padding: '12px 28px',
        borderRadius: '12px',
        gap: '4px',
    },
    orderNumLabel: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#3182ce',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        margin: 0,
    },
    orderNum: {
        fontSize: '20px',
        fontWeight: '800',
        color: '#2b6cb0',
        margin: 0,
        fontFamily: "'Courier New', monospace",
    },

    /* Columns */
    columns: {
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        marginBottom: '36px',
    },
    card: {
        flex: '1 1 380px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '28px 24px',
        boxShadow: '0 2px 14px rgba(0,0,0,0.06)',
    },
    cardTitle: {
        margin: '0 0 20px',
        fontSize: '18px',
        fontWeight: '700',
        color: '#1a202c',
    },

    /* Details */
    detailGroup: { marginBottom: '14px' },
    detailLabel: { margin: '0 0 2px', fontSize: '12px', fontWeight: '600', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px' },
    detailValue: { margin: 0, fontSize: '15px', color: '#2d3748', lineHeight: '1.5' },
    divider: { height: '1px', backgroundColor: '#e2e8f0', margin: '16px 0' },

    /* Items */
    itemsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    item: { display: 'flex', alignItems: 'center', gap: '12px' },
    itemImg: { width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 },
    itemInfo: { flex: 1, minWidth: 0 },
    itemName: { margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    itemMeta: { margin: '2px 0 0', fontSize: '12px', color: '#718096' },
    itemTotal: { margin: 0, fontSize: '14px', fontWeight: '700', color: '#2d3748', flexShrink: 0 },

    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '20px',
        fontWeight: '800',
        color: '#1a202c',
    },

    /* Actions */
    actions: {
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        flexWrap: 'wrap',
    },
    primaryBtn: {
        padding: '16px 36px',
        fontSize: '16px',
        fontWeight: '700',
        color: '#fff',
        background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
        border: 'none',
        borderRadius: '12px',
        textDecoration: 'none',
        boxShadow: '0 6px 24px rgba(99,102,241,0.35)',
        fontFamily: "'Segoe UI', sans-serif",
    },
    secondaryBtn: {
        padding: '16px 36px',
        fontSize: '16px',
        fontWeight: '700',
        color: '#4a5568',
        backgroundColor: '#fff',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        textDecoration: 'none',
        fontFamily: "'Segoe UI', sans-serif",
    },
};
