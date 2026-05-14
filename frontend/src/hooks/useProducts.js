import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../utils/api.js';

// ---------------------------------------------------------------------------
// Module-level cache: persists across component mounts during the same
// browser session.  This prevents redundant network requests when the user
// navigates between pages (e.g. Home → Products → Home) because the data
// is already available in memory.
//
// Trade-offs:
//   ✅ Instant page transitions after the first fetch – no loading spinner.
//   ✅ Reduces load on the Flask backend.
//   ⚠️ Cache only lives in memory; a full page refresh will clear it.
//   ⚠️ If an admin changes product data while the user is browsing, the
//      cached version may be stale until refresh() is called.
// ---------------------------------------------------------------------------
let cachedProducts = null;

/**
 * useProducts – custom hook that fetches products from the API with
 *               a simple in-memory cache.
 *
 * Returns: { products, loading, error, refresh }
 *   - products : the array of product objects (may be [] while loading)
 *   - loading  : true while the first fetch is in progress
 *   - error    : error message string, or null
 *   - refresh  : call this to force re-fetch from the API and update cache
 */
export default function useProducts() {
    const [products, setProducts] = useState(cachedProducts || []);
    const [loading, setLoading] = useState(!cachedProducts);
    const [error, setError] = useState(null);

    // fetchProducts always hits the API and updates the cache
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(getApiUrl('/api/products'));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            cachedProducts = data;       // update module-level cache
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // On first mount: use cache if available, otherwise fetch
    useEffect(() => {
        if (cachedProducts) {
            // Cache hit – no network request needed
            setProducts(cachedProducts);
            setLoading(false);
        } else {
            // Cache miss – fetch from API
            fetchProducts();
        }
    }, [fetchProducts]);

    // refresh() always re-fetches regardless of cache
    const refresh = useCallback(() => {
        cachedProducts = null;  // invalidate cache
        return fetchProducts();
    }, [fetchProducts]);

    return { products, loading, error, refresh };
}
