import React, { useState, useMemo } from 'react';
import useProducts from '../hooks/useProducts.js';
import { getApiUrl } from '../utils/api.js';

export default function POSPage() {
    const { products, loading, error, refresh } = useProducts();
    const [posCart, setPosCart] = useState([]);
    const [customerName, setCustomerName] = useState('Walk-in Customer');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const categories = useMemo(() => {
        return ['all', ...new Set(products.map(p => p.category))];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, categoryFilter, searchQuery]);

    const addToPosCart = (product) => {
        if (product.stock <= 0) return;

        setPosCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                // Ensure we don't exceed stock
                if (existing.quantity >= product.stock) {
                    alert(`Cannot add more. Only ${product.stock} in stock.`);
                    return prev;
                }
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id, delta) => {
        setPosCart(prev => {
            return prev.map(item => {
                if (item.id === id) {
                    const product = products.find(p => p.id === id);
                    const newQty = item.quantity + delta;
                    if (newQty > product.stock) {
                        alert(`Cannot add more. Only ${product.stock} in stock.`);
                        return item;
                    }
                    return { ...item, quantity: Math.max(0, newQty) };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const clearCart = () => {
        if (window.confirm("Are you sure you want to clear the POS cart?")) {
            setPosCart([]);
        }
    };

    const cartTotal = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (posCart.length === 0) {
            alert('Cart is empty.');
            return;
        }
        if (!customerName.trim()) {
            alert('Please enter a customer name.');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch(getApiUrl('/api/orders'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: { fullName: customerName },
                    items: posCart,
                    total: cartTotal
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to place order');
            }

            const data = await res.json();
            alert(`Order successful! Order ID: ${data.orderNumber}`);
            
            // Reset POS state
            setPosCart([]);
            setCustomerName('Walk-in Customer');
            // Refresh products to show updated stock
            await refresh();
        } catch (err) {
            alert(`Checkout Error: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div style={styles.centerMessage}>Loading POS system...</div>;
    if (error) return <div style={styles.centerMessage}>Error loading products: {error}</div>;

    return (
        <div style={styles.posContainer}>
            {/* Left Side: Product Catalog */}
            <div style={styles.catalogPanel}>
                <div style={styles.catalogHeader}>
                    <h2>Point of Sale (POS)</h2>
                    <div style={styles.filterControls}>
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                        <div style={styles.categoryButtons}>
                            {categories.map(cat => (
                                <button 
                                    key={cat}
                                    style={categoryFilter === cat ? styles.catBtnActive : styles.catBtn}
                                    onClick={() => setCategoryFilter(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={styles.productGrid}>
                    {filteredProducts.map(product => (
                        <div 
                            key={product.id} 
                            style={{
                                ...styles.productCard,
                                opacity: product.stock === 0 ? 0.5 : 1,
                                cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => addToPosCart(product)}
                        >
                            <img src={product.image} alt={product.name} style={styles.productImage} />
                            <div style={styles.productInfo}>
                                <div style={styles.productName}>{product.name}</div>
                                <div style={styles.productPrice}>${product.price.toFixed(2)}</div>
                                <div style={styles.productStock}>Stock: {product.stock}</div>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div style={styles.emptyCatalog}>No products found.</div>
                    )}
                </div>
            </div>

            {/* Right Side: POS Cart / Receipt */}
            <div style={styles.cartPanel}>
                <div style={styles.cartHeader}>
                    <h3>Current Order</h3>
                    <button style={styles.clearBtn} onClick={clearCart} disabled={posCart.length === 0}>
                        Clear
                    </button>
                </div>

                <div style={styles.customerInputGroup}>
                    <label style={styles.label}>Customer Name:</label>
                    <input 
                        style={styles.input}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />
                </div>

                <div style={styles.cartItemsList}>
                    {posCart.length === 0 ? (
                        <div style={styles.emptyCartMsg}>Cart is empty</div>
                    ) : (
                        posCart.map(item => (
                            <div key={item.id} style={styles.cartItem}>
                                <div style={styles.cartItemInfo}>
                                    <div style={styles.cartItemName}>{item.name}</div>
                                    <div style={styles.cartItemPrice}>${item.price.toFixed(2)}</div>
                                </div>
                                <div style={styles.cartItemControls}>
                                    <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, -1)}>−</button>
                                    <span style={styles.qtyValue}>{item.quantity}</span>
                                    <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, 1)}>+</button>
                                </div>
                                <div style={styles.cartItemTotal}>
                                    ${(item.price * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={styles.cartFooter}>
                    <div style={styles.totalRow}>
                        <span>Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        style={styles.checkoutBtn} 
                        onClick={handleCheckout}
                        disabled={posCart.length === 0 || isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Place Order'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    posContainer: {
        display: 'flex',
        height: 'calc(100vh - 65px)', // minus navbar
        backgroundColor: '#f7f8fc',
        overflow: 'hidden'
    },
    catalogPanel: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        borderRight: '1px solid #e2e8f0',
        overflowY: 'auto'
    },
    cartPanel: {
        width: '400px',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.05)'
    },
    catalogHeader: {
        marginBottom: '20px'
    },
    filterControls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '12px'
    },
    searchInput: {
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid #cbd5e0',
        fontSize: '14px',
        width: '100%',
        maxWidth: '400px'
    },
    categoryButtons: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
    },
    catBtn: {
        padding: '6px 12px',
        borderRadius: '20px',
        border: '1px solid #cbd5e0',
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: '13px',
        textTransform: 'capitalize'
    },
    catBtnActive: {
        padding: '6px 12px',
        borderRadius: '20px',
        border: 'none',
        backgroundColor: '#3182ce',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '13px',
        textTransform: 'capitalize'
    },
    productGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        paddingBottom: '20px'
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'transform 0.1s',
    },
    productImage: {
        width: '100%',
        height: '120px',
        objectFit: 'cover',
        borderRadius: '8px'
    },
    productInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    productName: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#2d3748'
    },
    productPrice: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#3182ce'
    },
    productStock: {
        fontSize: '12px',
        color: '#718096'
    },
    emptyCatalog: {
        gridColumn: '1 / -1',
        textAlign: 'center',
        padding: '40px',
        color: '#a0aec0'
    },
    /* Cart Styles */
    cartHeader: {
        padding: '20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f7fafc'
    },
    clearBtn: {
        padding: '6px 12px',
        backgroundColor: 'transparent',
        border: '1px solid #e53e3e',
        color: '#e53e3e',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600'
    },
    customerInputGroup: {
        padding: '16px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    label: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#4a5568'
    },
    input: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #cbd5e0',
        fontSize: '14px'
    },
    cartItemsList: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    emptyCartMsg: {
        textAlign: 'center',
        color: '#a0aec0',
        marginTop: '40px'
    },
    cartItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px dashed #e2e8f0'
    },
    cartItemInfo: {
        flex: 1
    },
    cartItemName: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: '4px'
    },
    cartItemPrice: {
        fontSize: '13px',
        color: '#718096'
    },
    cartItemControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '0 16px'
    },
    qtyBtn: {
        width: '24px',
        height: '24px',
        borderRadius: '4px',
        border: '1px solid #cbd5e0',
        backgroundColor: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        color: '#4a5568'
    },
    qtyValue: {
        fontSize: '14px',
        fontWeight: '600',
        minWidth: '20px',
        textAlign: 'center'
    },
    cartItemTotal: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#2d3748',
        minWidth: '60px',
        textAlign: 'right'
    },
    cartFooter: {
        padding: '24px 20px',
        backgroundColor: '#f7fafc',
        borderTop: '1px solid #e2e8f0'
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '24px',
        fontWeight: '800',
        color: '#1a202c',
        marginBottom: '20px'
    },
    checkoutBtn: {
        width: '100%',
        padding: '16px',
        backgroundColor: '#38a169',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(56, 161, 105, 0.3)',
        transition: 'background-color 0.2s'
    },
    centerMessage: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#4a5568'
    }
};
