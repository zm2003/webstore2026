import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../CartContext.jsx";

export default function ProductCard({ id, name, price, image, category, stock, onSale, salePercent }) {
    const { addToCart } = useCart();

    // Determine stock status
    let stockLabel, stockColor;
    if (stock === 0) {
        stockLabel = "Out of Stock";
        stockColor = "#e53e3e";
    } else if (stock < 5) {
        stockLabel = "Low Stock";
        stockColor = "#dd6b20";
    } else {
        stockLabel = "In Stock";
        stockColor = "#38a169";
    }

    const handleAddToCart = (e) => {
        e.preventDefault(); // Prevent link navigation
        e.stopPropagation();
        addToCart({ id, name, price, image, category, stock, onSale, salePercent });
    };

    return (
        <Link to={`/products/${id}`} style={{ textDecoration: 'none' }}>
            <div style={styles.card}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                {/* Sale badge */}
                {onSale && <span style={styles.saleBadge}>{salePercent ? `${salePercent}% OFF` : 'Sale!'}</span>}

                {/* Product image */}
                <img src={image} alt={name} style={styles.image} />

                <div style={styles.body}>
                    {/* Category badge */}
                    <span style={styles.categoryBadge}>{category}</span>

                    {/* Product name */}
                    <h2 style={styles.name}>{name}</h2>

                    {/* Price */}
                    <p style={styles.price}>${price.toFixed(2)}</p>

                    {/* Stock status */}
                    <p style={{ ...styles.stock, color: stockColor }}>● {stockLabel}</p>

                    {/* Add to Cart button */}
                    <button
                        style={stock === 0 ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
                        disabled={stock === 0}
                        onClick={handleAddToCart}
                    >
                        {stock === 0 ? "Unavailable" : "Add to Cart"}
                    </button>
                </div>
            </div>
        </Link>
    );
}

const styles = {
    card: {
        position: "relative",
        width: "280px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        fontFamily: "sans-serif",
        backgroundColor: "#fff",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
    },
    saleBadge: {
        position: "absolute",
        top: "12px",
        right: "12px",
        backgroundColor: "#e53e3e",
        color: "#fff",
        fontSize: "12px",
        fontWeight: "bold",
        padding: "4px 10px",
        borderRadius: "20px",
        zIndex: 1,
    },
    image: {
        width: "100%",
        height: "200px",
        objectFit: "cover",
        display: "block",
    },
    body: {
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    categoryBadge: {
        display: "inline-block",
        backgroundColor: "#ebf4ff",
        color: "#3182ce",
        fontSize: "11px",
        fontWeight: "600",
        padding: "3px 10px",
        borderRadius: "20px",
        textTransform: "capitalize",
        width: "fit-content",
    },
    name: {
        margin: 0,
        fontSize: "16px",
        fontWeight: "700",
        color: "#1a202c",
        lineHeight: "1.3",
    },
    price: {
        margin: 0,
        fontSize: "20px",
        fontWeight: "800",
        color: "#2d3748",
    },
    stock: {
        margin: 0,
        fontSize: "13px",
        fontWeight: "600",
    },
    button: {
        marginTop: "8px",
        padding: "10px",
        backgroundColor: "#3182ce",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        width: "100%",
        opacity: 1,
        transition: "background-color 0.2s ease",
    },
    buttonDisabled: {
        backgroundColor: "#cbd5e0",
        cursor: "not-allowed",
    },
};
