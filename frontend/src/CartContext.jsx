import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

/* ── Helper: safely read cart from localStorage ── */
function loadCart() {
    try {
        const raw = localStorage.getItem('cart');
        if (raw) return JSON.parse(raw);
    } catch { /* ignore corrupt data */ }
    return [];
}

export function CartProvider({ children }) {
    // Each item: { product, quantity }
    const [items, setItems] = useState(loadCart);

    // ── Persist cart to localStorage whenever it changes ──
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    // ── Toast state ──
    const [toast, setToast] = useState({ message: '', visible: false });
    const toastTimer = React.useRef(null);

    const showToast = useCallback((message) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ message, visible: true });
        toastTimer.current = setTimeout(() => {
            setToast((t) => ({ ...t, visible: false }));
        }, 2500);
    }, []);

    const addToCart = (product) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        showToast(`✓ ${product.name} added to cart`);
    };

    const removeFromCart = (productId) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.product.id === productId);
            if (!existing) return prev;
            if (existing.quantity === 1) {
                return prev.filter((item) => item.product.id !== productId);
            }
            return prev.map((item) =>
                item.product.id === productId
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            );
        });
    };

    const deleteFromCart = (productId) => {
        setItems((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const clearCart = () => setItems([]);

    const cartCount = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity, 0),
        [items]
    );

    const cartTotal = useMemo(
        () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
        [items]
    );

    return (
        <CartContext.Provider
            value={{ items, addToCart, removeFromCart, deleteFromCart, clearCart, cartCount, cartTotal }}
        >
            {children}

            {/* ── Toast notification ── */}
            <div style={{
                position: 'fixed',
                bottom: toast.visible ? '32px' : '-80px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#1a202c',
                color: '#fff',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                fontFamily: "'Segoe UI', sans-serif",
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                zIndex: 9999,
                transition: 'bottom 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
            }}>
                {toast.message}
            </div>
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within a CartProvider');
    return ctx;
}
