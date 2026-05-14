import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getApiUrl } from '../utils/api.js';

/**
 * AdminInventoryPage – fetches products from the Flask API and displays
 * them in a filterable, searchable table.  Includes an inline "Restock"
 * input so admins can update stock directly from the UI.
 */
export default function AdminInventoryPage() {
    // ── Data state ──
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ── Filter state ──
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [lowStockOnly, setLowStockOnly] = useState(false);

    // ── Restock state (tracks which product is being edited) ──
    const [restockId, setRestockId] = useState(null);      // id of product being restocked
    const [restockValue, setRestockValue] = useState('');   // input value
    const [restockSaving, setRestockSaving] = useState(false);

    // ──────────────────────────────────────────────────────
    // Fetch all products from GET /api/products
    // ──────────────────────────────────────────────────────
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(getApiUrl('/api/products'));
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on first mount
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // ──────────────────────────────────────────────────────
    // Restock: send PUT /api/products/<id>/stock
    // ──────────────────────────────────────────────────────
    const handleRestock = async (productId) => {
        // Validate input
        const newStock = parseInt(restockValue, 10);
        if (isNaN(newStock) || newStock < 0) {
            alert('Please enter a valid non-negative number.');
            return;
        }

        setRestockSaving(true);
        try {
            const response = await fetch(getApiUrl(`/api/products/${productId}/stock`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP ${response.status}`);
            }

            // Re-fetch all products so the table is up to date
            await fetchProducts();

            // Close the restock input
            setRestockId(null);
            setRestockValue('');
        } catch (err) {
            alert('Restock failed: ' + err.message);
        } finally {
            setRestockSaving(false);
        }
    };

    // ──────────────────────────────────────────────────────
    // Derived data
    // ──────────────────────────────────────────────────────
    const categories = useMemo(
        () => [...new Set(products.map((p) => p.category))].sort(),
        [products]
    );

    const filteredProducts = useMemo(() => {
        let result = products;

        // 1. Text search (name or id)
        if (searchText.trim()) {
            const q = searchText.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    String(p.id).includes(q)
            );
        }

        // 2. Category dropdown
        if (categoryFilter !== 'all') {
            result = result.filter((p) => p.category === categoryFilter);
        }

        // 3. Low-stock checkbox
        if (lowStockOnly) {
            result = result.filter((p) => p.stock < 5);
        }

        return result;
    }, [products, searchText, categoryFilter, lowStockOnly]);

    // ──────────────────────────────────────────────────────
    // Loading state
    // ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={styles.page}>
                <h1 style={styles.title}>📦 Inventory</h1>
                <div style={styles.statusBox}>
                    <p style={{ fontSize: '36px', margin: '0 0 12px' }}>⏳</p>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#4a5568' }}>
                        Loading products from server…
                    </p>
                </div>
            </div>
        );
    }

    // ──────────────────────────────────────────────────────
    // Error state
    // ──────────────────────────────────────────────────────
    if (error) {
        return (
            <div style={styles.page}>
                <h1 style={styles.title}>📦 Inventory</h1>
                <div style={styles.statusBox}>
                    <p style={{ fontSize: '36px', margin: '0 0 12px' }}>⚠️</p>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#e53e3e' }}>
                        Failed to load products
                    </p>
                    <p style={{ fontSize: '14px', color: '#718096', margin: '8px 0 16px' }}>
                        {error}
                    </p>
                    <button style={styles.retryBtn} onClick={fetchProducts}>
                        🔄 Try Again
                    </button>
                    <p style={{ fontSize: '13px', color: '#a0aec0', marginTop: '12px' }}>
                        Make sure the backend is running: <code>cd backend && python app.py</code>
                    </p>
                </div>
            </div>
        );
    }

    // ──────────────────────────────────────────────────────
    // Main UI
    // ──────────────────────────────────────────────────────
    return (
        <div style={styles.page}>
            <h1 style={styles.title}>📦 Inventory</h1>

            {/* ── Filters ── */}
            <div style={styles.filtersRow}>
                {/* Search box */}
                <input
                    type="text"
                    placeholder="Search by name or id…"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={styles.searchInput}
                    id="inventory-search"
                />

                {/* Category dropdown */}
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={styles.selectInput}
                    id="inventory-category"
                >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                    ))}
                </select>

                {/* Low-stock checkbox */}
                <label style={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={lowStockOnly}
                        onChange={(e) => setLowStockOnly(e.target.checked)}
                        id="inventory-low-stock"
                    />
                    Low stock only (&lt; 5)
                </label>
            </div>

            {/* ── Results count ── */}
            <p style={styles.resultCount}>
                Showing {filteredProducts.length} of {products.length} products
            </p>

            {/* ── Table ── */}
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.headerRow}>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Category</th>
                            <th style={{ ...styles.th, textAlign: 'right' }}>Price</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Stock</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Restock</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => {
                            const isLow = product.stock < 5;
                            const isRestocking = restockId === product.id;

                            return (
                                <tr
                                    key={product.id}
                                    style={{
                                        ...styles.row,
                                        backgroundColor: isLow ? '#fff5f5' : '#fff',
                                    }}
                                >
                                    <td style={styles.td}>{product.id}</td>
                                    <td style={{ ...styles.td, fontWeight: '600' }}>
                                        {product.name}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.categoryBadge}>
                                            {product.category}
                                        </span>
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'right' }}>
                                        ${product.price.toFixed(2)}
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        {isLow ? (
                                            <span style={styles.lowBadge}>⚠ {product.stock}</span>
                                        ) : (
                                            product.stock
                                        )}
                                    </td>

                                    {/* Restock column */}
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        {isRestocking ? (
                                            /* Show input + Save/Cancel buttons */
                                            <div style={styles.restockForm}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={restockValue}
                                                    onChange={(e) => setRestockValue(e.target.value)}
                                                    style={styles.restockInput}
                                                    autoFocus
                                                    placeholder="qty"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRestock(product.id);
                                                        if (e.key === 'Escape') setRestockId(null);
                                                    }}
                                                />
                                                <button
                                                    style={styles.saveBtn}
                                                    onClick={() => handleRestock(product.id)}
                                                    disabled={restockSaving}
                                                >
                                                    {restockSaving ? '…' : '✓'}
                                                </button>
                                                <button
                                                    style={styles.cancelBtn}
                                                    onClick={() => { setRestockId(null); setRestockValue(''); }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            /* Show "Restock" button */
                                            <button
                                                style={styles.restockBtn}
                                                onClick={() => {
                                                    setRestockId(product.id);
                                                    setRestockValue(String(product.stock));
                                                }}
                                            >
                                                📦 Restock
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}

                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan="6" style={styles.emptyRow}>
                                    No products match your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = {
    page: {
        maxWidth: '960px',
        margin: '0 auto',
        padding: '32px 24px',
        fontFamily: "'Segoe UI', sans-serif",
    },
    title: {
        fontSize: '26px',
        fontWeight: '800',
        color: '#1a202c',
        margin: '0 0 24px',
    },

    /* Status (loading / error) */
    statusBox: {
        textAlign: 'center',
        padding: '80px 20px',
    },
    retryBtn: {
        padding: '10px 24px',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
        backgroundColor: '#3182ce',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },

    /* Filters */
    filtersRow: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: '12px',
    },
    searchInput: {
        flex: '1 1 200px',
        padding: '10px 14px',
        fontSize: '14px',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        outline: 'none',
        color: '#1a202c',
    },
    selectInput: {
        padding: '10px 14px',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#fff',
        color: '#4a5568',
        cursor: 'pointer',
        outline: 'none',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#4a5568',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    resultCount: {
        fontSize: '13px',
        color: '#a0aec0',
        margin: '0 0 8px',
    },

    /* Table */
    tableWrapper: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
    },
    headerRow: {
        backgroundColor: '#f7fafc',
    },
    th: {
        padding: '12px 16px',
        textAlign: 'left',
        fontWeight: '700',
        color: '#4a5568',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '2px solid #e2e8f0',
    },
    row: {
        borderBottom: '1px solid #edf2f7',
        transition: 'background-color 0.15s ease',
    },
    td: {
        padding: '10px 16px',
        color: '#2d3748',
    },
    categoryBadge: {
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: '#edf2f7',
        color: '#4a5568',
        textTransform: 'capitalize',
    },
    lowBadge: {
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '700',
        backgroundColor: '#fed7d7',
        color: '#c53030',
    },
    emptyRow: {
        textAlign: 'center',
        padding: '40px 16px',
        color: '#a0aec0',
        fontSize: '15px',
    },

    /* Restock */
    restockBtn: {
        padding: '5px 12px',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #e2e8f0',
        borderRadius: '6px',
        backgroundColor: '#fff',
        color: '#4a5568',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    restockForm: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
    },
    restockInput: {
        width: '60px',
        padding: '5px 8px',
        fontSize: '13px',
        fontFamily: "'Segoe UI', sans-serif",
        border: '2px solid #3182ce',
        borderRadius: '6px',
        outline: 'none',
        textAlign: 'center',
    },
    saveBtn: {
        width: '28px',
        height: '28px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: '#38a169',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        width: '28px',
        height: '28px',
        border: '2px solid #e2e8f0',
        borderRadius: '6px',
        backgroundColor: '#fff',
        color: '#a0aec0',
        fontSize: '12px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};
