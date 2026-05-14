import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';
import { getApiUrl } from '../utils/api.js';

export default function ProductDetailPage() {
    const { id } = useParams();
    const { addToCart, cartCount } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    // ── Fetch product from API ──
    useEffect(() => {
        fetch(getApiUrl(`/api/products/${id}`))
            .then((res) => {
                if (!res.ok) throw new Error(res.status === 404 ? 'not_found' : `HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setProduct(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    // ── Loading state ──
    if (loading) {
        return (
            <div style={styles.page}>
                <div style={{ textAlign: 'center', padding: '200px 20px' }}>
                    <p style={{ fontSize: '48px', margin: '0 0 16px' }}>⏳</p>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#4a5568' }}>Loading product...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div style={styles.page}>
                <div style={styles.notFound}>
                    <p style={{ fontSize: '64px', margin: '0 0 16px' }}>😕</p>
                    <h1 style={{ margin: '0 0 8px', color: '#1a202c' }}>Product not found or unavailable</h1>
                    <p style={{ color: '#718096', margin: '0 0 24px' }}>
                        {error === 'not_found' ? "The product you're looking for doesn't exist." : "There was a problem loading this product. The backend may be unavailable."}
                    </p>
                    <Link to="/products" style={styles.backLink}>← Back to Products</Link>
                </div>
            </div>
        );
    }

    // Stock logic
    let stockLabel, stockColor;
    if (product.stock === 0) {
        stockLabel = 'Out of Stock'; stockColor = '#e53e3e';
    } else if (product.stock < 5) {
        stockLabel = 'Low Stock'; stockColor = '#dd6b20';
    } else {
        stockLabel = 'In Stock'; stockColor = '#38a169';
    }

    const handleAdd = () => {
        for (let i = 0; i < qty; i++) addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <div style={styles.page}>
            {/* ── Removed Cart badge (top-right) in favor of global Navbar ── */}

            {/* ── Breadcrumb ── */}
            <nav style={styles.breadcrumb}>
                <Link to="/" style={styles.breadcrumbLink}>Home</Link>
                <span style={styles.breadcrumbSep}>/</span>
                <Link to="/products" style={styles.breadcrumbLink}>Products</Link>
                <span style={styles.breadcrumbSep}>/</span>
                <span style={styles.breadcrumbCurrent}>{product.name}</span>
            </nav>

            {/* ── Product layout ── */}
            <div style={styles.container}>
                {/* Left: Image */}
                <div style={styles.imageWrapper}>
                    {product.onSale && <span style={styles.saleBadge}>{product.salePercent ? `${product.salePercent}% OFF` : 'Sale!'}</span>}
                    <img src={product.image} alt={product.name} style={styles.image} />
                </div>

                {/* Right: Details */}
                <div style={styles.details}>
                    <span style={styles.categoryBadge}>{product.category}</span>
                    <h1 style={styles.name}>{product.name}</h1>
                    <p style={styles.price}>${product.price.toFixed(2)}</p>
                    <p style={{ ...styles.stock, color: stockColor }}>● {stockLabel}</p>
                    <p style={styles.description}>{product.description}</p>

                    {/* Quantity + Add to cart */}
                    {product.stock > 0 ? (
                        <div style={styles.actions}>
                            <div style={styles.qtyRow}>
                                <button style={styles.qtyBtn} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                                <span style={styles.qtyValue}>{qty}</span>
                                <button style={styles.qtyBtn} onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>+</button>
                            </div>
                            <button style={added ? { ...styles.addBtn, ...styles.addBtnSuccess } : styles.addBtn} onClick={handleAdd}>
                                {added ? '✓ Added!' : 'Add to Cart'}
                            </button>
                        </div>
                    ) : (
                        <button style={styles.unavailableBtn} disabled>Unavailable</button>
                    )}
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

    /* Cart badge */
    cartBadge: {
        position: 'fixed',
        top: '20px',
        right: '24px',
        fontSize: '24px',
        textDecoration: 'none',
        zIndex: 100,
        backgroundColor: '#fff',
        padding: '10px 16px',
        borderRadius: '50px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    cartCount: {
        backgroundColor: '#e53e3e',
        color: '#fff',
        fontSize: '12px',
        fontWeight: '700',
        padding: '2px 8px',
        borderRadius: '50px',
        minWidth: '20px',
        textAlign: 'center',
    },

    /* Not found */
    notFound: {
        textAlign: 'center',
        padding: '120px 20px',
    },
    backLink: {
        color: '#3182ce',
        fontWeight: '600',
        fontSize: '15px',
        textDecoration: 'none',
    },

    /* Breadcrumb */
    breadcrumb: {
        maxWidth: '1100px',
        margin: '0 auto 28px',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
    },
    breadcrumbLink: {
        color: '#3182ce',
        textDecoration: 'none',
        fontWeight: '500',
    },
    breadcrumbSep: {
        color: '#a0aec0',
    },
    breadcrumbCurrent: {
        color: '#4a5568',
        fontWeight: '600',
    },

    /* Layout */
    container: {
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'flex',
        gap: '48px',
        flexWrap: 'wrap',
    },

    /* Image */
    imageWrapper: {
        position: 'relative',
        flex: '1 1 480px',
        minWidth: '300px',
    },
    image: {
        width: '100%',
        height: '500px',
        objectFit: 'cover',
        borderRadius: '16px',
        display: 'block',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    },
    saleBadge: {
        position: 'absolute',
        top: '16px',
        right: '16px',
        backgroundColor: '#e53e3e',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 'bold',
        padding: '6px 16px',
        borderRadius: '20px',
        zIndex: 1,
    },

    /* Details */
    details: {
        flex: '1 1 400px',
        minWidth: '280px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingTop: '8px',
    },
    categoryBadge: {
        display: 'inline-block',
        backgroundColor: '#ebf4ff',
        color: '#3182ce',
        fontSize: '12px',
        fontWeight: '600',
        padding: '4px 14px',
        borderRadius: '20px',
        textTransform: 'capitalize',
        width: 'fit-content',
    },
    name: {
        margin: 0,
        fontSize: '32px',
        fontWeight: '800',
        color: '#1a202c',
        lineHeight: '1.2',
    },
    price: {
        margin: 0,
        fontSize: '28px',
        fontWeight: '800',
        color: '#2d3748',
    },
    stock: {
        margin: 0,
        fontSize: '15px',
        fontWeight: '600',
    },
    description: {
        margin: '8px 0 0',
        fontSize: '16px',
        color: '#4a5568',
        lineHeight: '1.8',
    },

    /* Actions */
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginTop: '16px',
        flexWrap: 'wrap',
    },
    qtyRow: {
        display: 'flex',
        alignItems: 'center',
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden',
    },
    qtyBtn: {
        width: '44px',
        height: '44px',
        border: 'none',
        backgroundColor: '#f7fafc',
        fontSize: '20px',
        fontWeight: '700',
        cursor: 'pointer',
        color: '#2d3748',
    },
    qtyValue: {
        width: '48px',
        textAlign: 'center',
        fontSize: '17px',
        fontWeight: '700',
        color: '#1a202c',
    },
    addBtn: {
        padding: '14px 36px',
        fontSize: '16px',
        fontWeight: '700',
        color: '#fff',
        background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
        transition: 'all 0.2s ease',
        fontFamily: "'Segoe UI', sans-serif",
    },
    addBtnSuccess: {
        background: 'linear-gradient(90deg, #38a169 0%, #48bb78 100%)',
        boxShadow: '0 4px 16px rgba(56,161,105,0.35)',
    },
    unavailableBtn: {
        marginTop: '16px',
        padding: '14px 36px',
        fontSize: '16px',
        fontWeight: '700',
        color: '#a0aec0',
        backgroundColor: '#edf2f7',
        border: 'none',
        borderRadius: '12px',
        cursor: 'not-allowed',
        fontFamily: "'Segoe UI', sans-serif",
    },
};
