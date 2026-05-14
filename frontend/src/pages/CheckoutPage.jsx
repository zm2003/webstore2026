import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';
import { getApiUrl } from '../utils/api.js';

/* ── Helper: load saved shipping info ── */
function loadShippingInfo() {
    try {
        const raw = localStorage.getItem('shippingInfo');
        if (raw) return JSON.parse(raw);
    } catch { /* ignore corrupt data */ }
    return { fullName: '', phone: '', email: '', address: '', city: '', state: '', zip: '', country: '' };
}

export default function CheckoutPage() {
    const { items, cartCount, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();

    const [form, setForm] = useState(loadShippingInfo);

    const [errors, setErrors] = useState({});

    // ── Persist shipping info to localStorage ──
    useEffect(() => {
        localStorage.setItem('shippingInfo', JSON.stringify(form));
    }, [form]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Clear error on change
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (!form.fullName.trim()) errs.fullName = 'Full name is required';
        if (!form.phone.trim()) errs.phone = 'Phone number is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
        if (!form.address.trim()) errs.address = 'Address is required';
        if (!form.city.trim()) errs.city = 'City is required';
        if (!form.state.trim()) errs.state = 'State is required';
        if (!form.zip.trim()) errs.zip = 'ZIP code is required';
        if (!form.country.trim()) errs.country = 'Country is required';
        return errs;
    };

    const [submitting, setSubmitting] = useState(false);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                customer: form,
                items: items.map(({ product, quantity }) => ({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity,
                    image: product.image,
                })),
                total: cartTotal,
            };

            const res = await fetch(getApiUrl('/api/orders'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            const { orderNumber } = await res.json();

            clearCart();
            navigate('/order-confirmation', {
                state: {
                    orderNumber,
                    customer: form,
                    items: payload.items,
                    total: cartTotal,
                },
            });
        } catch (err) {
            setErrors({ submit: err.message });
            setSubmitting(false);
        }
    };

    // Empty cart guard
    if (items.length === 0) {
        return (
            <div style={styles.page}>
                <div style={styles.empty}>
                    <p style={{ fontSize: '64px', margin: '0 0 12px' }}>🛒</p>
                    <h1 style={{ margin: '0 0 8px', color: '#1a202c', fontSize: '24px' }}>Your cart is empty</h1>
                    <p style={{ color: '#718096', margin: '0 0 28px' }}>Add some products before checking out.</p>
                    <Link to="/products" style={styles.shopLink}>← Browse Products</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* Breadcrumb */}
            <nav style={styles.breadcrumb}>
                <Link to="/" style={styles.bcLink}>Home</Link>
                <span style={styles.bcSep}>/</span>
                <Link to="/cart" style={styles.bcLink}>Cart</Link>
                <span style={styles.bcSep}>/</span>
                <span style={styles.bcCurrent}>Checkout</span>
            </nav>

            <h1 style={styles.title}>Checkout</h1>

            <form onSubmit={handlePlaceOrder} style={styles.layout}>
                {/* ── Left column: forms ── */}
                <div style={styles.formCol}>

                    {/* Customer Information */}
                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>👤 Customer Information</h2>
                        <div style={styles.fieldGroup}>
                            <Field label="Full Name" name="fullName" value={form.fullName} error={errors.fullName}
                                placeholder="John Doe" onChange={handleChange} />
                            <Field label="Phone Number" name="phone" value={form.phone} error={errors.phone}
                                placeholder="+1 (555) 123-4567" type="tel" onChange={handleChange} />
                            <Field label="Email Address" name="email" value={form.email} error={errors.email}
                                placeholder="john@example.com" type="email" onChange={handleChange} />
                        </div>
                    </section>

                    {/* Shipping Address */}
                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>📦 Shipping Address</h2>
                        <div style={styles.fieldGroup}>
                            <Field label="Street Address" name="address" value={form.address} error={errors.address}
                                placeholder="123 Main St, Apt 4B" onChange={handleChange} fullWidth />
                            <div style={styles.row}>
                                <Field label="City" name="city" value={form.city} error={errors.city}
                                    placeholder="New York" onChange={handleChange} />
                                <Field label="State / Province" name="state" value={form.state} error={errors.state}
                                    placeholder="NY" onChange={handleChange} />
                            </div>
                            <div style={styles.row}>
                                <Field label="ZIP / Postal Code" name="zip" value={form.zip} error={errors.zip}
                                    placeholder="10001" onChange={handleChange} />
                                <Field label="Country" name="country" value={form.country} error={errors.country}
                                    placeholder="United States" onChange={handleChange} />
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── Right column: order summary ── */}
                <div style={styles.summaryCol}>
                    <div style={styles.summaryCard}>
                        <h2 style={styles.summaryTitle}>🧾 Order Summary</h2>

                        {/* Items */}
                        <div style={styles.itemsList}>
                            {items.map(({ product, quantity }) => (
                                <div key={product.id} style={styles.summaryItem}>
                                    <img src={product.image} alt={product.name} style={styles.summaryImg} />
                                    <div style={styles.summaryItemInfo}>
                                        <p style={styles.summaryItemName}>{product.name}</p>
                                        <p style={styles.summaryItemMeta}>Qty: {quantity} × ${product.price.toFixed(2)}</p>
                                    </div>
                                    <p style={styles.summaryItemTotal}>${(product.price * quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>

                        <div style={styles.divider} />

                        <div style={styles.summaryRow}>
                            <span>Items ({cartCount})</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>Shipping</span>
                            <span style={{ color: '#38a169', fontWeight: '600' }}>Free</span>
                        </div>
                        <div style={styles.divider} />
                        <div style={{ ...styles.summaryRow, fontSize: '20px', fontWeight: '800' }}>
                            <span>Total</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>

                        {errors.submit && (
                            <p style={{ color: '#e53e3e', fontSize: '14px', fontWeight: '600', textAlign: 'center', margin: 0 }}>
                                ⚠️ {errors.submit}
                            </p>
                        )}

                        <button type="submit" style={{
                            ...styles.placeOrderBtn,
                            ...(submitting ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                        }}
                            disabled={submitting}
                            onMouseEnter={e => !submitting && (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {submitting ? 'Placing Order...' : 'Place Order'}
                        </button>

                        <Link to="/cart" style={styles.backLink}>← Back to Cart</Link>
                    </div>
                </div>
            </form>
        </div>
    );
}

/* ── Reusable field component ── */
function Field({ label, name, value, error, placeholder, type = 'text', onChange, fullWidth }) {
    return (
        <div style={{ flex: fullWidth ? '1 1 100%' : '1 1 220px', minWidth: '180px' }}>
            <label style={styles.label}>{label}</label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                type={type}
                placeholder={placeholder}
                style={error ? { ...styles.input, borderColor: '#e53e3e' } : styles.input}
            />
            {error && <p style={styles.errorText}>{error}</p>}
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#f7f8fc',
        fontFamily: "'Segoe UI', sans-serif",
        padding: '32px 24px 64px',
    },

    /* Empty */
    empty: { textAlign: 'center', padding: '120px 20px' },
    shopLink: {
        display: 'inline-block', padding: '14px 32px', fontSize: '15px', fontWeight: '700',
        color: '#fff', background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
        borderRadius: '12px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
    },

    /* Breadcrumb */
    breadcrumb: { maxWidth: '1100px', margin: '0 auto 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
    bcLink: { color: '#3182ce', textDecoration: 'none', fontWeight: '500' },
    bcSep: { color: '#a0aec0' },
    bcCurrent: { color: '#4a5568', fontWeight: '600' },

    title: { maxWidth: '1100px', margin: '0 auto 32px', fontSize: '32px', fontWeight: '800', color: '#1a202c' },

    /* Layout */
    layout: { maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' },
    formCol: { flex: '1 1 560px', display: 'flex', flexDirection: 'column', gap: '24px' },

    /* Sections */
    section: {
        backgroundColor: '#fff', borderRadius: '16px', padding: '28px 28px 32px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    },
    sectionTitle: { margin: '0 0 20px', fontSize: '20px', fontWeight: '700', color: '#1a202c' },
    fieldGroup: { display: 'flex', flexWrap: 'wrap', gap: '16px' },
    row: { display: 'flex', gap: '16px', flex: '1 1 100%', flexWrap: 'wrap' },

    /* Fields */
    label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a5568', marginBottom: '6px' },
    input: {
        width: '100%', padding: '12px 14px', fontSize: '15px', fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none',
        backgroundColor: '#fff', color: '#1a202c', boxSizing: 'border-box',
        transition: 'border-color 0.2s ease',
    },
    errorText: { margin: '4px 0 0', fontSize: '12px', color: '#e53e3e', fontWeight: '500' },

    /* Summary */
    summaryCol: { flex: '0 0 380px', minWidth: '300px' },
    summaryCard: {
        backgroundColor: '#fff', borderRadius: '16px', padding: '28px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'sticky', top: '24px',
        display: 'flex', flexDirection: 'column', gap: '14px',
    },
    summaryTitle: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#1a202c' },

    itemsList: { display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' },
    summaryItem: { display: 'flex', alignItems: 'center', gap: '12px' },
    summaryImg: { width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 },
    summaryItemInfo: { flex: 1, minWidth: 0 },
    summaryItemName: { margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a202c', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    summaryItemMeta: { margin: '2px 0 0', fontSize: '12px', color: '#718096' },
    summaryItemTotal: { margin: 0, fontSize: '14px', fontWeight: '700', color: '#2d3748', flexShrink: 0 },

    divider: { height: '1px', backgroundColor: '#e2e8f0' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#4a5568' },

    placeOrderBtn: {
        marginTop: '8px', padding: '16px', fontSize: '17px', fontWeight: '700',
        color: '#fff', background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
        border: 'none', borderRadius: '12px', cursor: 'pointer',
        boxShadow: '0 6px 24px rgba(99,102,241,0.4)', transition: 'transform 0.2s ease',
        fontFamily: "'Segoe UI', sans-serif", width: '100%',
    },
    backLink: { textAlign: 'center', color: '#3182ce', fontSize: '14px', fontWeight: '600', textDecoration: 'none' },
};
