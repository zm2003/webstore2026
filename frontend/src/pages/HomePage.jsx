import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard.jsx';
import ProductGrid from './ProductGrid.jsx';
import { useCart } from '../CartContext.jsx';
import useProducts from '../hooks/useProducts.js';

const CATEGORIES = [
    { name: 'laptops', emoji: '💻', label: 'Laptops', color: '#3182ce', bg: '#ebf4ff' },
    { name: 'tablets', emoji: '📱', label: 'Tablets', color: '#805ad5', bg: '#faf5ff' },
    { name: 'audio', emoji: '🎧', label: 'Audio', color: '#d53f8c', bg: '#fff5f7' },
    { name: 'accessories', emoji: '⌨️', label: 'Accessories', color: '#dd6b20', bg: '#fffaf0' },
];

export default function HomePage() {
    const { products, loading } = useProducts();
    const { cartCount } = useCart();

    const featured = products.filter((p) => p.featured);

    return (
        <div style={styles.page}>

            {/* ── Removed Local Navbar in favor of global one ── */}

            {/* ── Hero Section ── */}
            <section style={styles.hero}>
                <div style={styles.heroOverlay} />
                <div style={styles.heroContent}>
                    <p style={styles.heroEyebrow}>🔥 Campus Tech · Student Deals</p>
                    <h1 style={styles.heroTitle}>
                        Your One-Stop<br />Campus Tech Store.
                    </h1>
                    <p style={styles.heroSubtitle}>
                        Laptops, tablets, audio gear, and accessories — curated for students and professionals.
                    </p>
                    <Link to="/products" style={styles.heroBtn}>Shop Now →</Link>
                </div>
            </section>

            {/* ── Featured Products ── */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>⭐ Featured Products</h2>
                <p style={styles.sectionSub}>Our handpicked favorites for you</p>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#718096' }}>Loading...</p>
                ) : (
                    <ProductGrid products={featured} />
                )}
            </section>

            {/* ── Categories ── */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>📂 Shop by Category</h2>
                <p style={styles.sectionSub}>Browse products across 4 categories</p>
                <div style={styles.catGrid}>
                    {CATEGORIES.map((cat) => {
                        const count = products.filter((p) => p.category === cat.name).length;
                        return (
                            <Link key={cat.name} to={`/products?category=${cat.name}`} style={{ textDecoration: 'none' }}>
                                <div style={{ ...styles.catCard, borderTop: `4px solid ${cat.color}`, backgroundColor: cat.bg }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <span style={{ fontSize: '36px' }}>{cat.emoji}</span>
                                    <h3 style={{ ...styles.catTitle, color: cat.color }}>{cat.label}</h3>
                                    <p style={styles.catCount}>{count} product{count !== 1 ? 's' : ''}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={styles.footer}>
                <p style={{ margin: 0, color: '#a0aec0' }}>© 2026 TechStore · COS108 Project</p>
            </footer>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#f7f8fc',
        fontFamily: "'Segoe UI', sans-serif",
    },

    /* Navbar */
    navbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 32px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
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
    cartLink: {
        fontSize: '20px',
        textDecoration: 'none',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
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
    },

    /* Hero */
    hero: {
        position: 'relative',
        minHeight: '70vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    heroOverlay: {
        position: 'absolute',
        inset: 0,
        background:
            'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.25) 0%, transparent 60%),' +
            'radial-gradient(ellipse at 80% 20%, rgba(49,130,206,0.2) 0%, transparent 50%)',
        pointerEvents: 'none',
    },
    heroContent: {
        position: 'relative',
        textAlign: 'center',
        padding: '0 24px',
        maxWidth: '700px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    heroEyebrow: {
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: '#a5b4fc',
        margin: 0,
    },
    heroTitle: {
        fontSize: 'clamp(32px, 5vw, 56px)',
        fontWeight: '900',
        color: '#fff',
        lineHeight: '1.15',
        margin: 0,
        letterSpacing: '-1px',
    },
    heroSubtitle: {
        fontSize: '17px',
        color: '#cbd5e0',
        maxWidth: '500px',
        lineHeight: '1.7',
        margin: 0,
    },
    heroBtn: {
        marginTop: '8px',
        padding: '14px 40px',
        fontSize: '16px',
        fontWeight: '700',
        color: '#fff',
        background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
        border: 'none',
        borderRadius: '50px',
        textDecoration: 'none',
        boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
        transition: 'transform 0.2s ease',
        display: 'inline-block',
    },

    /* Sections */
    section: {
        padding: '56px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    sectionTitle: {
        fontSize: '26px',
        fontWeight: '800',
        color: '#1a202c',
        margin: '0 0 4px',
        textAlign: 'center',
    },
    sectionSub: {
        fontSize: '15px',
        color: '#718096',
        margin: '0 0 32px',
        textAlign: 'center',
    },

    /* Categories grid */
    catGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        justifyContent: 'center',
    },
    catCard: {
        width: '220px',
        padding: '28px 24px',
        borderRadius: '14px',
        textAlign: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
    },
    catTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: '700',
    },
    catCount: {
        margin: 0,
        fontSize: '13px',
        color: '#718096',
    },

    /* Footer */
    footer: {
        textAlign: 'center',
        padding: '32px 24px',
        borderTop: '1px solid #e2e8f0',
        fontSize: '14px',
    },
};
