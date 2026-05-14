import React from 'react';
import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products }) {
    if (!products || products.length === 0) {
        return <p style={{ textAlign: 'center', color: '#718096', width: '100%', padding: '24px' }}>No products found.</p>;
    }

    return (
        <div style={styles.grid}>
            {products.map((product) => (
                <ProductCard key={product.id} {...product} />
            ))}
        </div>
    );
}

const styles = {
    grid: {
        display: 'grid',
        // Responsive CSS Grid required by the PDF
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        width: '100%',
        justifyContent: 'center',
    }
};
