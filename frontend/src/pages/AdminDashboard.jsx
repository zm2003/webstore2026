import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import useProducts from '../hooks/useProducts.js';
import { useAuth } from '../AuthContext.jsx';
import { getApiUrl } from '../utils/api.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// ─────────────────────────────────────────────────────────
// AdminDashboard – inventory management page
// ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const { products, loading, error, refresh } = useProducts();
    const { user } = useAuth();

    // ── Local state ──
    const [stats, setStats] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');   // 'all' | 'low' | 'out'

    // Edit modal state
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // ── Derived data ──
    const categories = useMemo(
        () => [...new Set(products.map((p) => p.category))],
        [products]
    );

    const filteredProducts = useMemo(() => {
        let result = products;

        // Text search
        if (searchText.trim()) {
            const q = searchText.toLowerCase();
            result = result.filter((p) => p.name.toLowerCase().includes(q));
        }

        // Category filter
        if (categoryFilter !== 'all') {
            result = result.filter((p) => p.category === categoryFilter);
        }

        // Stock filter
        if (stockFilter === 'low') {
            result = result.filter((p) => p.stock > 0 && p.stock <= 5);
        } else if (stockFilter === 'out') {
            result = result.filter((p) => p.stock === 0);
        }

        return result;
    }, [products, searchText, categoryFilter, stockFilter]);

    // ── Summary counts ──
    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;
    const onSaleCount = products.filter((p) => p.onSale).length;

    // ── Fetch Stats ──
    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.token) return;
            try {
                const res = await fetch(getApiUrl('/api/orders/stats'), {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    // ── Chart Data ──
    const chartData = useMemo(() => {
        return {
            labels: stats.map(s => s.date),
            datasets: [
                {
                    label: 'Revenue ($)',
                    data: stats.map(s => s.revenue),
                    borderColor: '#3182ce',
                    backgroundColor: 'rgba(49, 130, 206, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4, // smooth curve
                }
            ]
        };
    }, [stats]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `Revenue: $${context.raw.toFixed(2)}`
                }
            }
        },
        scales: {
            y: { beginAtZero: true, ticks: { callback: (value) => '$' + value } }
        }
    };

    // ── API helpers ──
    const adjustStock = useCallback(async (id, delta) => {
        try {
            const res = await fetch(getApiUrl(`/api/products/${id}/stock`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delta }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await refresh();
        } catch (err) {
            alert('Failed to update stock: ' + err.message);
        }
    }, [refresh]);

    const toggleField = useCallback(async (product, field) => {
        try {
            const res = await fetch(getApiUrl(`/api/products/${product.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: product[field] ? 0 : 1 }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await refresh();
        } catch (err) {
            alert('Failed to update: ' + err.message);
        }
    }, [refresh]);

    const openEditModal = (product) => {
        setEditingProduct(product);
        setEditForm({
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category,
            description: product.description || '',
            featured: product.featured ? 1 : 0,
            onSale: product.onSale ? 1 : 0,
            salePercent: product.salePercent || 0,
        });
    };

    const saveEdit = async () => {
        setSaving(true);
        try {
            const res = await fetch(getApiUrl(`/api/products/${editingProduct.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await refresh();
            setEditingProduct(null);
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Stock styling helper ──
    const getStockStyle = (stock) => {
        if (stock === 0) return { backgroundColor: '#fed7d7', color: '#c53030' };
        if (stock <= 5) return { backgroundColor: '#fefcbf', color: '#975a16' };
        return {};
    };

    const getStockBadge = (stock) => {
        if (stock === 0) return '🔴 OUT';
        if (stock <= 5) return '🟡 LOW';
        return '🟢';
    };

    // ── Loading / Error states ──
    if (loading) {
        return (
            <div style={styles.page}>
                <div style={{ textAlign: 'center', padding: '200px 20px' }}>
                    <p style={{ fontSize: '48px', margin: '0 0 16px' }}>⏳</p>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#4a5568' }}>Loading inventory…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.page}>
                <div style={{ textAlign: 'center', padding: '200px 20px' }}>
                    <p style={{ fontSize: '48px', margin: '0 0 16px' }}>⚠️</p>
                    <h2 style={{ margin: '0 0 8px', color: '#e53e3e' }}>Failed to load products</h2>
                    <p style={{ color: '#718096', margin: '0 0 16px' }}>{error}</p>
                    <button style={styles.primaryBtn} onClick={refresh}>Try again</button>
                    <p style={{ color: '#718096', fontSize: '14px', marginTop: '16px' }}>
                        Make sure the backend is running: <code>cd backend && python app.py</code>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>

            {/* ── Header ── */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.title}>📦 Inventory Dashboard</h1>
                    <p style={styles.subtitle}>Manage your store products</p>
                </div>
                <div style={styles.headerRight}>
                    <Link to="/" style={styles.backLink}>← Back to Store</Link>
                    <button style={styles.refreshBtn} onClick={refresh}>🔄 Refresh</button>
                </div>
            </header>

            {/* ── Summary Cards ── */}
            <div style={styles.cardsRow}>
                <div style={{ ...styles.card, borderLeft: '4px solid #3182ce' }}>
                    <p style={styles.cardNumber}>{totalProducts}</p>
                    <p style={styles.cardLabel}>Total Products</p>
                </div>
                <div style={{ ...styles.card, borderLeft: '4px solid #ecc94b' }}>
                    <p style={styles.cardNumber}>{lowStockCount}</p>
                    <p style={styles.cardLabel}>Low Stock ⚠️</p>
                </div>
                <div style={{ ...styles.card, borderLeft: '4px solid #e53e3e' }}>
                    <p style={styles.cardNumber}>{outOfStockCount}</p>
                    <p style={styles.cardLabel}>Out of Stock 🔴</p>
                </div>
                <div style={{ ...styles.card, borderLeft: '4px solid #38a169' }}>
                    <p style={styles.cardNumber}>{onSaleCount}</p>
                    <p style={styles.cardLabel}>On Sale 🏷️</p>
                </div>
            </div>

            {/* ── Sales Chart ── */}
            <div style={styles.chartCard}>
                <h2 style={styles.chartTitle}>Revenue Over Time</h2>
                <div style={styles.chartContainer}>
                    {statsLoading ? (
                        <p style={{ textAlign: 'center', color: '#718096', marginTop: '100px' }}>Loading chart...</p>
                    ) : stats.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#718096', marginTop: '100px' }}>No sales data available yet.</p>
                    ) : (
                        <Line data={chartData} options={chartOptions} />
                    )}
                </div>
            </div>

            {/* ── Filters Row ── */}
            <div style={styles.filtersRow}>
                {/* Search */}
                <div style={styles.searchBox}>
                    <span style={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name…"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={styles.searchInput}
                        id="admin-search"
                    />
                    {searchText && (
                        <button style={styles.clearBtn} onClick={() => setSearchText('')}>✕</button>
                    )}
                </div>

                {/* Category */}
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={styles.selectInput}
                    id="admin-category-filter"
                >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                </select>

                {/* Stock filter */}
                <div style={styles.stockFilterGroup}>
                    {[
                        { value: 'all', label: 'All' },
                        { value: 'low', label: 'Low Stock' },
                        { value: 'out', label: 'Out of Stock' },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            style={stockFilter === opt.value
                                ? { ...styles.stockFilterBtn, ...styles.stockFilterActive }
                                : styles.stockFilterBtn}
                            onClick={() => setStockFilter(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Results count ── */}
            <p style={styles.resultCount}>
                Showing {filteredProducts.length} of {totalProducts} products
            </p>

            {/* ── Products Table ── */}
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Category</th>
                            <th style={{ ...styles.th, textAlign: 'right' }}>Price</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Stock</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Sale</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Featured</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id} style={{ ...styles.tableRow, ...getStockStyle(product.stock) }}>
                                {/* Name */}
                                <td style={styles.td}>
                                    <span style={styles.productName}>{product.name}</span>
                                </td>

                                {/* Category badge */}
                                <td style={styles.td}>
                                    <span style={{
                                        ...styles.categoryBadge,
                                        backgroundColor: categoryColors[product.category] || '#e2e8f0',
                                    }}>
                                        {product.category}
                                    </span>
                                </td>

                                {/* Price */}
                                <td style={{ ...styles.td, textAlign: 'right', fontWeight: '600' }}>
                                    ${product.price.toFixed(2)}
                                </td>

                                {/* Stock with +/- buttons */}
                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                    <div style={styles.stockCell}>
                                        <button
                                            style={styles.stockBtn}
                                            onClick={() => adjustStock(product.id, -1)}
                                            disabled={product.stock === 0}
                                        >
                                            −
                                        </button>
                                        <span style={styles.stockNumber}>
                                            {getStockBadge(product.stock)} {product.stock}
                                        </span>
                                        <button
                                            style={styles.stockBtn}
                                            onClick={() => adjustStock(product.id, 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>

                                {/* Sale toggle */}
                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                    <button
                                        style={product.onSale ? styles.saleBadgeOn : styles.saleBadgeOff}
                                        onClick={() => toggleField(product, 'onSale')}
                                    >
                                        {product.onSale ? `${product.salePercent}% OFF` : 'No'}
                                    </button>
                                </td>

                                {/* Featured toggle */}
                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                    <button
                                        style={styles.featuredBtn}
                                        onClick={() => toggleField(product, 'featured')}
                                        title={product.featured ? 'Remove from featured' : 'Mark as featured'}
                                    >
                                        {product.featured ? '⭐' : '☆'}
                                    </button>
                                </td>

                                {/* Edit action */}
                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                    <button style={styles.editBtn} onClick={() => openEditModal(product)}>
                                        ✏️ Edit
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan="7" style={styles.emptyRow}>
                                    No products match your filters
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Edit Modal ── */}
            {editingProduct && (
                <div style={styles.modalOverlay} onClick={() => setEditingProduct(null)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>Edit Product</h2>
                        <p style={styles.modalSubtitle}>ID: {editingProduct.id}</p>

                        <div style={styles.formGrid}>
                            {/* Name */}
                            <label style={styles.formLabel}>Name
                                <input
                                    style={styles.formInput}
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </label>

                            {/* Price */}
                            <label style={styles.formLabel}>Price ($)
                                <input
                                    type="number"
                                    step="0.01"
                                    style={styles.formInput}
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                />
                            </label>

                            {/* Stock */}
                            <label style={styles.formLabel}>Stock
                                <input
                                    type="number"
                                    style={styles.formInput}
                                    value={editForm.stock}
                                    onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                                />
                            </label>

                            {/* Category */}
                            <label style={styles.formLabel}>Category
                                <select
                                    style={styles.formInput}
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </label>

                            {/* Sale Percent */}
                            <label style={styles.formLabel}>Sale %
                                <input
                                    type="number"
                                    style={styles.formInput}
                                    value={editForm.salePercent}
                                    onChange={(e) => setEditForm({ ...editForm, salePercent: parseInt(e.target.value) || 0 })}
                                />
                            </label>

                            {/* Toggles */}
                            <div style={styles.checkboxRow}>
                                <label style={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={!!editForm.featured}
                                        onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked ? 1 : 0 })}
                                    />
                                    Featured
                                </label>
                                <label style={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={!!editForm.onSale}
                                        onChange={(e) => setEditForm({ ...editForm, onSale: e.target.checked ? 1 : 0 })}
                                    />
                                    On Sale
                                </label>
                            </div>

                            {/* Description */}
                            <label style={{ ...styles.formLabel, gridColumn: '1 / -1' }}>Description
                                <textarea
                                    rows={3}
                                    style={{ ...styles.formInput, resize: 'vertical' }}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                />
                            </label>
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.cancelBtn} onClick={() => setEditingProduct(null)}>
                                Cancel
                            </button>
                            <button style={styles.saveBtn} onClick={saveEdit} disabled={saving}>
                                {saving ? 'Saving…' : '💾 Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Category badge colors
// ─────────────────────────────────────────────────────────
const categoryColors = {
    laptops: '#ebf4ff',
    tablets: '#f0fff4',
    audio: '#faf5ff',
    accessories: '#fffaf0',
};

// ─────────────────────────────────────────────────────────
// Styles (inline, matching project conventions)
// ─────────────────────────────────────────────────────────
const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#f7f8fc',
        fontFamily: "'Segoe UI', sans-serif",
        padding: '0 24px 64px',
    },

    /* Header */
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 0 24px',
        flexWrap: 'wrap',
        gap: '16px',
    },
    headerLeft: {},
    headerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    title: {
        fontSize: '28px',
        fontWeight: '800',
        color: '#1a202c',
        margin: 0,
    },
    subtitle: {
        fontSize: '15px',
        color: '#718096',
        margin: '4px 0 0',
    },
    backLink: {
        color: '#3182ce',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '14px',
    },
    refreshBtn: {
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
        backgroundColor: '#edf2f7',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#4a5568',
    },

    /* Summary cards */
    cardsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        maxWidth: '1200px',
        margin: '0 auto 28px',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    cardNumber: {
        fontSize: '32px',
        fontWeight: '800',
        color: '#1a202c',
        margin: 0,
    },
    cardLabel: {
        fontSize: '14px',
        color: '#718096',
        margin: '4px 0 0',
        fontWeight: '600',
    },

    /* Chart Card */
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        maxWidth: '1200px',
        margin: '0 auto 28px',
    },
    chartTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1a202c',
        margin: '0 0 16px',
    },
    chartContainer: {
        height: '300px',
        width: '100%',
    },

    /* Filters row */
    filtersRow: {
        display: 'flex',
        gap: '12px',
        maxWidth: '1200px',
        margin: '0 auto 16px',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    searchBox: {
        position: 'relative',
        flex: '1 1 250px',
        maxWidth: '360px',
    },
    searchIcon: {
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '16px',
        pointerEvents: 'none',
    },
    searchInput: {
        width: '100%',
        padding: '10px 36px 10px 42px',
        fontSize: '14px',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        outline: 'none',
        backgroundColor: '#fff',
        color: '#1a202c',
        boxSizing: 'border-box',
    },
    clearBtn: {
        position: 'absolute',
        right: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: '#e2e8f0',
        border: 'none',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        fontSize: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        color: '#4a5568',
    },
    selectInput: {
        padding: '10px 14px',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        backgroundColor: '#fff',
        color: '#4a5568',
        cursor: 'pointer',
        outline: 'none',
    },
    stockFilterGroup: {
        display: 'flex',
        gap: '0',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '2px solid #e2e8f0',
    },
    stockFilterBtn: {
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
        border: 'none',
        backgroundColor: '#fff',
        color: '#4a5568',
        cursor: 'pointer',
        borderRight: '1px solid #e2e8f0',
    },
    stockFilterActive: {
        backgroundColor: '#3182ce',
        color: '#fff',
    },

    resultCount: {
        maxWidth: '1200px',
        margin: '0 auto 12px',
        fontSize: '13px',
        color: '#a0aec0',
    },

    /* Table */
    tableWrapper: {
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#fff',
        borderRadius: '14px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        overflow: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
    },
    tableHeaderRow: {
        backgroundColor: '#f7fafc',
    },
    th: {
        padding: '14px 16px',
        textAlign: 'left',
        fontWeight: '700',
        color: '#4a5568',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '2px solid #e2e8f0',
        whiteSpace: 'nowrap',
    },
    tableRow: {
        borderBottom: '1px solid #edf2f7',
        transition: 'background-color 0.15s ease',
    },
    td: {
        padding: '12px 16px',
        color: '#2d3748',
        verticalAlign: 'middle',
    },
    productName: {
        fontWeight: '600',
        color: '#1a202c',
    },
    categoryBadge: {
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#4a5568',
        textTransform: 'capitalize',
    },
    emptyRow: {
        textAlign: 'center',
        padding: '48px 16px',
        color: '#a0aec0',
        fontSize: '16px',
    },

    /* Stock cell */
    stockCell: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
    },
    stockBtn: {
        width: '28px',
        height: '28px',
        border: '2px solid #e2e8f0',
        borderRadius: '6px',
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '700',
        color: '#4a5568',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', sans-serif",
    },
    stockNumber: {
        minWidth: '60px',
        textAlign: 'center',
        fontWeight: '700',
        fontSize: '13px',
    },

    /* Sale / Featured / Edit buttons */
    saleBadgeOn: {
        padding: '4px 12px',
        borderRadius: '20px',
        border: 'none',
        backgroundColor: '#c6f6d5',
        color: '#276749',
        fontSize: '12px',
        fontWeight: '700',
        cursor: 'pointer',
        fontFamily: "'Segoe UI', sans-serif",
    },
    saleBadgeOff: {
        padding: '4px 12px',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#fff',
        color: '#a0aec0',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: "'Segoe UI', sans-serif",
    },
    featuredBtn: {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        padding: '4px',
    },
    editBtn: {
        padding: '6px 14px',
        fontSize: '13px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#fff',
        color: '#4a5568',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },

    /* Primary button (reused) */
    primaryBtn: {
        padding: '10px 24px',
        backgroundColor: '#3182ce',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
    },

    /* Modal */
    modalOverlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    modalTitle: {
        fontSize: '22px',
        fontWeight: '800',
        color: '#1a202c',
        margin: '0 0 4px',
    },
    modalSubtitle: {
        fontSize: '13px',
        color: '#a0aec0',
        margin: '0 0 24px',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
    },
    formLabel: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#4a5568',
    },
    formInput: {
        padding: '10px 12px',
        fontSize: '14px',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        outline: 'none',
        color: '#1a202c',
        backgroundColor: '#f7fafc',
    },
    checkboxRow: {
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        padding: '8px 0',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#4a5568',
        cursor: 'pointer',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '24px',
    },
    cancelBtn: {
        padding: '10px 24px',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#fff',
        color: '#4a5568',
        cursor: 'pointer',
    },
    saveBtn: {
        padding: '10px 24px',
        fontSize: '14px',
        fontWeight: '700',
        fontFamily: "'Segoe UI', sans-serif",
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#3182ce',
        color: '#fff',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(49,130,206,0.35)',
    },
};
