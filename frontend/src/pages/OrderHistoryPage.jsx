import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { getApiUrl } from '../utils/api.js';

export default function OrderHistoryPage() {
    const { user } = useAuth();

    // For guests: let them type their email
    const [guestEmail, setGuestEmail] = useState('');
    const [emailSubmitted, setEmailSubmitted] = useState(false);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Logged-in users fetch immediately on mount
    useEffect(() => {
        if (user?.token) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async (overrideEmail) => {
        setLoading(true);
        setError('');
        try {
            let url = getApiUrl('/api/orders');
            const headers = {};

            if (user?.token) {
                // Logged-in: pass JWT, backend filters by role/email automatically
                headers['Authorization'] = `Bearer ${user.token}`;
            } else {
                // Guest: pass email as query param
                const email = overrideEmail || guestEmail;
                if (!email.trim()) {
                    setError('Please enter your email address.');
                    setLoading(false);
                    return;
                }
                url += `?email=${encodeURIComponent(email.trim())}`;
            }

            const res = await fetch(url, { headers });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || data.error || `HTTP ${res.status}`);
            }

            setOrders(data);
            setEmailSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLookup = (e) => {
        e.preventDefault();
        fetchOrders(guestEmail);
    };

    // ── Guest view: email input form ──
    if (!user) {
        return (
            <div style={styles.page}>
                <div style={styles.header}>
                    <h1 style={styles.title}>📦 Order History</h1>
                    <p style={styles.subtitle}>Look up your past orders by email</p>
                </div>

                <div style={styles.container}>
                    <div style={styles.guestCard}>
                        <form onSubmit={handleGuestLookup} style={styles.guestForm}>
                            <label style={styles.label}>Email address used at checkout:</label>
                            <input
                                type="email"
                                required
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                                placeholder="john@example.com"
                                style={styles.input}
                            />
                            {error && <p style={styles.errorText}>⚠️ {error}</p>}
                            <button type="submit" style={styles.lookupBtn} disabled={loading}>
                                {loading ? 'Searching...' : 'Look Up My Orders'}
                            </button>
                        </form>

                        {emailSubmitted && !loading && !error && (
                            <OrderList orders={orders} isAdmin={false} />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Logged-in view ──
    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>📦 Order History</h1>
                <p style={styles.subtitle}>
                    {user.role === 'admin'
                        ? 'Viewing all store orders (Admin Access)'
                        : 'Viewing your past orders'}
                </p>
            </div>

            <div style={styles.container}>
                {loading && <div style={styles.centerMessage}>Loading orders...</div>}
                {error && <div style={styles.centerMessage}>Error: {error}</div>}
                {!loading && !error && <OrderList orders={orders} isAdmin={user.role === 'admin'} />}
            </div>
        </div>
    );
}

// ── Shared order list component ──
function OrderList({ orders }) {
    if (orders.length === 0) {
        return (
            <div style={styles.emptyState}>
                <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📝</p>
                <h3 style={{ margin: '0 0 8px', color: '#1a202c' }}>No orders found</h3>
                <p style={{ margin: 0, color: '#718096' }}>No orders were found for this account.</p>
            </div>
        );
    }

    return (
        <div style={styles.orderList}>
            {orders.map(order => (
                <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                        <div style={styles.orderInfo}>
                            <span style={styles.orderNumber}>Order #ORD-{order.id.toString().padStart(5, '0')}</span>
                            <span style={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</span>
                        </div>
                        <div style={styles.orderTotal}>${order.total.toFixed(2)}</div>
                    </div>

                    <div style={styles.customerInfo}>
                        <p><strong>Customer:</strong> {order.fullName || 'Walk-in Customer'}
                            {order.email ? ` (${order.email})` : ''}</p>
                        {(order.address || order.city) && (
                            <p><strong>Shipping:</strong> {order.address}, {order.city}, {order.state} {order.zip}</p>
                        )}
                    </div>

                    <div style={styles.itemsList}>
                        {order.items && order.items.map(item => (
                            <div key={item.id} style={styles.itemRow}>
                                <div style={styles.itemDetails}>
                                    <img
                                        src={item.image || 'https://placehold.co/40x40'}
                                        alt={item.name}
                                        style={styles.itemImg}
                                    />
                                    <span style={styles.itemName}>{item.name}</span>
                                </div>
                                <div style={styles.itemMeta}>
                                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                                    <strong style={{ marginLeft: 12, color: '#2d3748' }}>
                                        = ${(item.quantity * item.price).toFixed(2)}
                                    </strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#f7f8fc',
        fontFamily: "'Segoe UI', sans-serif",
        padding: '40px 24px',
    },
    header: {
        maxWidth: '900px',
        margin: '0 auto 32px',
        textAlign: 'center',
    },
    title: {
        margin: '0 0 8px',
        fontSize: '32px',
        fontWeight: '800',
        color: '#1a202c',
    },
    subtitle: {
        margin: 0,
        fontSize: '16px',
        color: '#718096',
    },
    container: {
        maxWidth: '900px',
        margin: '0 auto',
    },
    centerMessage: {
        textAlign: 'center',
        padding: '60px',
        fontSize: '18px',
        color: '#4a5568',
    },
    // Guest form
    guestCard: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    },
    guestForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        maxWidth: '440px',
        margin: '0 auto 32px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#4a5568',
    },
    input: {
        padding: '12px 14px',
        borderRadius: '10px',
        border: '2px solid #e2e8f0',
        fontSize: '15px',
        outline: 'none',
    },
    errorText: {
        margin: 0,
        fontSize: '13px',
        color: '#e53e3e',
        fontWeight: '500',
    },
    lookupBtn: {
        padding: '14px',
        backgroundColor: '#3182ce',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
    },
    // Order list
    emptyState: {
        textAlign: 'center',
        padding: '64px 20px',
    },
    orderList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    },
    orderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
    },
    orderInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    orderNumber: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#2d3748',
    },
    orderDate: {
        fontSize: '13px',
        color: '#718096',
    },
    orderTotal: {
        fontSize: '22px',
        fontWeight: '800',
        color: '#2b6cb0',
    },
    customerInfo: {
        padding: '14px 24px',
        borderBottom: '1px solid #edf2f7',
        fontSize: '14px',
        color: '#4a5568',
        lineHeight: '1.6',
    },
    itemsList: {
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    itemRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px dashed #edf2f7',
    },
    itemDetails: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    itemImg: {
        width: '40px',
        height: '40px',
        objectFit: 'cover',
        borderRadius: '6px',
        border: '1px solid #edf2f7',
    },
    itemName: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#2d3748',
    },
    itemMeta: {
        fontSize: '14px',
        color: '#718096',
        fontWeight: '500',
    },
};
