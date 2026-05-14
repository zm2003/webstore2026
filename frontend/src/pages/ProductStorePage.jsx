import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard.jsx';
import ProductGrid from './ProductGrid.jsx';
import { useCart } from '../CartContext.jsx';
import useProducts from '../hooks/useProducts.js';
import '../slider.css';

export default function ProductStorePage() {
    // Use the cached hook instead of raw fetch
    const { products, loading, error, refresh } = useProducts();

    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortBy, setSortBy] = useState('default');
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(0);
    const inputRef = useRef(null);
    const { cartCount } = useCart();

    // ── Initialize price range when products load ──
    useEffect(() => {
        if (products.length > 0 && priceMin === 0 && priceMax === 0) {
            setPriceMin(Math.floor(Math.min(...products.map((p) => p.price))));
            setPriceMax(Math.ceil(Math.max(...products.map((p) => p.price))));
        }
    }, [products]);

    // Computed price boundaries (for slider min/max)
    const PRICE_MIN = useMemo(
        () => (products.length ? Math.floor(Math.min(...products.map((p) => p.price))) : 0),
        [products]
    );
    const PRICE_MAX = useMemo(
        () => (products.length ? Math.ceil(Math.max(...products.map((p) => p.price))) : 0),
        [products]
    );

    // Extract unique categories from fetched data
    const allCategories = useMemo(
        () => [...new Set(products.map((p) => p.category))],
        [products]
    );

    // ── Debounce: update results as user types, with a small delay ──
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 250);
        return () => clearTimeout(timer);
    }, [searchText]);

    // ── Filter + Sort logic ──
    const filteredProducts = useMemo(() => {
        let result = products;

        // Search filter
        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.category.toLowerCase().includes(q) ||
                    (p.description || '').toLowerCase().includes(q)
            );
        }

        // Category filter
        if (activeFilter !== 'all') {
            result = result.filter((p) => p.category === activeFilter);
        }

        // Price range filter
        if (PRICE_MIN > 0 || PRICE_MAX > 0) {
            result = result.filter((p) => p.price >= priceMin && p.price <= priceMax);
        }

        // Sorting
        switch (sortBy) {
            case 'name-asc':
                result = [...result].sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price-asc':
                result = [...result].sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result = [...result].sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                result = [...result].sort((a, b) => b.id - a.id);
                break;
            default:
                break;
        }

        return result;
    }, [products, debouncedSearch, activeFilter, priceMin, priceMax, sortBy, PRICE_MIN, PRICE_MAX]);

    const scrollToProducts = () => {
        document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => inputRef.current?.focus(), 600);
    };

    const isSearching = debouncedSearch.trim().length > 0;
    const isFiltered = isSearching || activeFilter !== 'all' || priceMin > PRICE_MIN || priceMax < PRICE_MAX;

    // ── Loading state ──
    if (loading) {
        return (
            <div style={styles.page}>
                <div style={{ textAlign: 'center', padding: '200px 20px' }}>
                    <p style={{ fontSize: '48px', margin: '0 0 16px' }}>⏳</p>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#4a5568' }}>Loading products...</p>
                </div>
            </div>
        );
    }

    // ── Error state ──
    if (error) {
        return (
            <div style={styles.page}>
                <div style={{ textAlign: 'center', padding: '200px 20px' }}>
                    <p style={{ fontSize: '48px', margin: '0 0 16px' }}>⚠️</p>
                    <h2 style={{ margin: '0 0 8px', color: '#e53e3e' }}>Failed to load products</h2>
                    <p style={{ color: '#718096', margin: '0 0 16px' }}>{error}</p>
                    <button style={styles.tryAgainBtn} onClick={refresh}>Try again</button>
                    <p style={{ color: '#718096', fontSize: '14px', marginTop: '16px' }}>Make sure the backend is running: <code>cd backend && python app.py</code></p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>

            {/* ── Removed Floating cart badge in favor of global Navbar ── */}

            {/* ── Hero Section ── */}
            <section style={styles.hero}>
                <div style={styles.heroOverlay} />
                <div style={styles.heroContent}>
                    <p style={styles.heroEyebrow}>🔥 New Arrivals · Limited Stock</p>
                    <h1 style={styles.heroTitle}>
                        The Best Tech,<br />Right at Your Fingertips.
                    </h1>
                    <p style={styles.heroSubtitle}>
                        Laptops, tablets, audio gear, and accessories — curated for students and professionals.
                    </p>
                    <button style={styles.heroBtn} onClick={scrollToProducts}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Shop Now ↓
                    </button>
                </div>
            </section>

            {/* ── Products Section ── */}
            <main id="products-grid" style={styles.section}>
                <h2 style={styles.sectionTitle}>All Products</h2>
                <p style={styles.sectionSub}>{products.length} items available</p>

                {/* ── Search Bar ── */}
                <div style={styles.searchWrapper}>
                    <div style={styles.searchContainer}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search products by name, category, or description…"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={styles.searchInput}
                            id="search-input"
                        />
                        {searchText && (
                            <button
                                style={styles.clearSearchBtn}
                                onClick={() => { setSearchText(''); inputRef.current?.focus(); }}
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Price Range Slider ── */}
                {PRICE_MAX > 0 && (
                    <div style={styles.priceSliderWrapper}>
                        <div style={styles.priceSliderRow}>
                            <span style={styles.priceLabel}>💰 Price Range:</span>
                            <span style={styles.priceDisplay}>${priceMin} — ${priceMax}</span>
                        </div>
                        <div style={styles.sliderContainer}>
                            <input
                                type="range"
                                className="price-slider"
                                min={PRICE_MIN}
                                max={PRICE_MAX}
                                value={priceMin}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    if (v <= priceMax) setPriceMin(v);
                                }}
                                id="price-min-slider"
                            />
                            <input
                                type="range"
                                className="price-slider"
                                min={PRICE_MIN}
                                max={PRICE_MAX}
                                value={priceMax}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    if (v >= priceMin) setPriceMax(v);
                                }}
                                id="price-max-slider"
                            />
                        </div>
                    </div>
                )}

                {/* ── Sort + Category Filter Row ── */}
                <div style={styles.controlsRow}>
                    <div style={styles.filterBar}>
                        <button
                            key="all"
                            style={activeFilter === 'all' ? { ...styles.filterPill, ...styles.filterPillActive } : styles.filterPill}
                            onClick={() => setActiveFilter('all')}
                        >
                            All
                        </button>
                        {allCategories.map((cat) => (
                            <button
                                key={cat}
                                style={activeFilter === cat ? { ...styles.filterPill, ...styles.filterPillActive } : styles.filterPill}
                                onClick={() => setActiveFilter(cat)}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={styles.sortSelect}
                        id="sort-select"
                    >
                        <option value="default">Sort: Default</option>
                        <option value="name-asc">Name (A → Z)</option>
                        <option value="price-asc">Price (Low → High)</option>
                        <option value="price-desc">Price (High → Low)</option>
                        <option value="newest">Newest First</option>
                    </select>
                </div>

                {/* ── Results summary ── */}
                {isFiltered && (
                    <p style={styles.resultsSummary}>
                        {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
                        {isSearching && <> for "<strong>{debouncedSearch}</strong>"</>}
                        {activeFilter !== 'all' && <> in <strong>{activeFilter}</strong></>}
                    </p>
                )}

                {/* ── Product Grid ── */}
                {filteredProducts.length > 0 ? (
                    <ProductGrid products={filteredProducts} />
                ) : (
                    <div style={styles.noResults}>
                        <p style={styles.noResultsEmoji}>😕</p>
                        <p style={styles.noResultsText}>No products found</p>
                        <p style={styles.noResultsHint}>Try adjusting your filters or search term</p>
                        <button
                            style={styles.resetBtn}
                            onClick={() => { setSearchText(''); setActiveFilter('all'); setPriceMin(PRICE_MIN); setPriceMax(PRICE_MAX); setSortBy('default'); }}
                        >
                            Reset All Filters
                        </button>
                    </div>
                )}
            </main>

        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#f7f8fc',
        fontFamily: "'Segoe UI', sans-serif",
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

    /* Hero */
    hero: {
        position: 'relative',
        minHeight: '92vh',
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
        maxWidth: '760px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
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
        fontSize: 'clamp(36px, 6vw, 64px)',
        fontWeight: '900',
        color: '#fff',
        lineHeight: '1.15',
        margin: 0,
        letterSpacing: '-1px',
    },
    heroSubtitle: {
        fontSize: '18px',
        color: '#cbd5e0',
        maxWidth: '520px',
        lineHeight: '1.7',
        margin: 0,
    },
    heroBtn: {
        marginTop: '12px',
        padding: '16px 48px',
        fontSize: '17px',
        fontWeight: '700',
        color: '#fff',
        background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        boxShadow: '0 8px 28px rgba(99,102,241,0.45)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },

    /* Products section */
    section: {
        padding: '64px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    sectionTitle: {
        fontSize: '28px',
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

    /* Search */
    searchWrapper: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px',
    },
    searchContainer: {
        position: 'relative',
        width: '100%',
        maxWidth: '560px',
    },
    searchIcon: {
        position: 'absolute',
        left: '18px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '18px',
        pointerEvents: 'none',
    },
    searchInput: {
        width: '100%',
        padding: '16px 48px 16px 50px',
        fontSize: '16px',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0',
        borderRadius: '14px',
        outline: 'none',
        backgroundColor: '#fff',
        color: '#1a202c',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxSizing: 'border-box',
    },
    clearSearchBtn: {
        position: 'absolute',
        right: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: '#e2e8f0',
        border: 'none',
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        fontSize: '13px',
        color: '#4a5568',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
    },

    /* Price range slider */
    priceSliderWrapper: {
        maxWidth: '560px',
        margin: '0 auto 24px',
        backgroundColor: '#fff',
        borderRadius: '14px',
        padding: '18px 24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    priceSliderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
    },
    priceLabel: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#4a5568',
    },
    priceDisplay: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#3182ce',
        backgroundColor: '#ebf4ff',
        padding: '4px 14px',
        borderRadius: '20px',
    },
    sliderContainer: {
        position: 'relative',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
    },

    /* Controls row: filter pills + sort */
    controlsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '28px',
        flexWrap: 'wrap',
    },

    /* Filter pills */
    filterBar: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        flex: '1 1 auto',
    },
    filterPill: {
        padding: '9px 22px',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0',
        borderRadius: '50px',
        backgroundColor: '#fff',
        color: '#4a5568',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    filterPillActive: {
        backgroundColor: '#3182ce',
        borderColor: '#3182ce',
        color: '#fff',
        boxShadow: '0 4px 14px rgba(49,130,206,0.35)',
    },

    /* Sort dropdown */
    sortSelect: {
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        backgroundColor: '#fff',
        color: '#4a5568',
        cursor: 'pointer',
        outline: 'none',
        flexShrink: 0,
    },

    /* Results summary */
    resultsSummary: {
        textAlign: 'center',
        fontSize: '14px',
        color: '#718096',
        marginBottom: '24px',
    },

    /* No results */
    noResults: {
        textAlign: 'center',
        padding: '64px 20px',
    },
    tryAgainBtn: {
        padding: '10px 24px',
        backgroundColor: '#3182ce',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    noResultsEmoji: {
        fontSize: '48px',
        margin: '0 0 8px',
    },
    noResultsText: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#2d3748',
        margin: '0 0 6px',
    },
    noResultsHint: {
        fontSize: '15px',
        color: '#718096',
        margin: '0 0 24px',
    },
    resetBtn: {
        padding: '10px 28px',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
        color: '#fff',
        backgroundColor: '#6366f1',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
};
