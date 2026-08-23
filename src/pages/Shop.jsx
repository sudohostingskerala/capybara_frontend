import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { getCategories } from '../services/categoryService';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import styles from './Shop.module.css';

const PRICE_RANGES = [
  { label: '₹0 – ₹500', min: 0, max: 500 },
  { label: '₹500 – ₹1000', min: 500, max: 1000 },
  { label: '₹1000 – ₹1500', min: 1000, max: 1500 },
  { label: '₹1500+', min: 1500, max: null },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const selCat = params.get('category__slug') || params.get('category_slug') || '';
  const searchQuery = params.get('search') || '';
  const selColor = params.get('color') || '';
  const selSize = params.get('size') || '';
  const sort = params.get('ordering') || '';
  const page = parseInt(params.get('page') || '1', 10);
  const minPrice = params.get('min_price') || '';
  const maxPrice = params.get('max_price') || '';
  const PER_PAGE = 12;

  // Fetch categories once
  useEffect(() => {
    getCategories()
      .then(data => setCategories(data.results || data || []))
      .catch(() => setCategories([]));
  }, []);

  // Fetch products on filter change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = { page };
        if (selCat) queryParams.category__slug = selCat;
        if (searchQuery) queryParams.search = searchQuery;
        if (selColor) queryParams.color = selColor;
        if (selSize) queryParams.size = selSize;
        if (sort) queryParams.ordering = sort;
        if (minPrice) queryParams.min_price = minPrice;
        if (maxPrice) queryParams.max_price = maxPrice;

        const data = await getProducts(queryParams);
        setProducts(data.results || data || []);
        setTotalCount(data.count || (data.results || data || []).length);
      } catch (err) {
        console.error('Failed to fetch products', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selCat, searchQuery, selColor, selSize, sort, page, minPrice, maxPrice]);

  const setFilter = (key, value) => {
    const newParams = new URLSearchParams(params);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setParams(newParams);
  };

  const setPage = (p) => {
    const newParams = new URLSearchParams(params);
    newParams.set('page', String(p));
    setParams(newParams);
  };

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  // Derive active price range label
  const activePriceLabel = PRICE_RANGES.find(
    r => String(r.min) === minPrice && (r.max === null ? !maxPrice : String(r.max) === maxPrice)
  )?.label || '';

  const hasActiveFilters = selCat || selColor || selSize || minPrice || maxPrice;

  return (
    <div className={`${styles['shop-page']} container`}>
      <div className={styles['shop-header']}>
        <nav className="breadcrumb"><a href="/">Home</a><span className="sep">/</span><span className="current">Shop All</span></nav>
        <h1>Shop All</h1>
        <p>Discover our curated collection of traditional Indian baby &amp; kids wear, designed for festive occasions and celebrations.</p>
      </div>

      {/* Mobile filter toggle bar — only visible on small screens via CSS */}
      <div className={styles['mobile-filter-bar']}>
        <button
          className={styles['filter-toggle-btn']}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="16" y2="12" />
            <line x1="4" y1="18" x2="12" y2="18" />
          </svg>
          Filters
          {hasActiveFilters && <span className={styles['filter-badge']}>•</span>}
        </button>
        <div className={styles['sort-by-mobile']}>
          <select value={sort} onChange={e => setFilter('ordering', e.target.value)}>
            <option value="">Sort by</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="name">Name: A–Z</option>
            <option value="-created_at">Newest</option>
          </select>
        </div>
      </div>

      {/* Dark overlay behind filter drawer on mobile */}
      {filterOpen && (
        <div className={styles['filter-overlay']} onClick={() => setFilterOpen(false)} />
      )}

      <div className={styles['shop-layout']}>
        {/* Sidebar — hidden on mobile, shown as drawer when filterOpen */}
        <aside className={`${styles['shop-sidebar']} ${filterOpen ? styles['sidebar-open'] : ''}`}>
          {/* Header with close button — only visible on mobile via CSS */}
          <div className={styles['sidebar-header']}>
            <h2>Filters</h2>
            <button className={styles['sidebar-close']} onClick={() => setFilterOpen(false)} aria-label="Close filters">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className={styles['filter-section']}>
            <h3>Categories</h3>
            <button
              className={`${styles['filter-cat']} ${!selCat ? styles.active : ''}`}
              onClick={() => setFilter('category__slug', '')}
            >
              All Categories
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={`${styles['filter-cat']} ${selCat === c.slug ? styles.active : ''}`}
                onClick={() => setFilter('category__slug', c.slug)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className={styles['filter-section']}>
            <h3>Price Range</h3>
            {PRICE_RANGES.map(r => (
              <label key={r.label} className={styles['filter-radio']}>
                <input
                  type="radio"
                  name="price"
                  checked={activePriceLabel === r.label}
                  onChange={() => {
                    const newParams = new URLSearchParams(params);
                    newParams.set('min_price', String(r.min));
                    if (r.max !== null) {
                      newParams.set('max_price', String(r.max));
                    } else {
                      newParams.delete('max_price');
                    }
                    newParams.set('page', '1');
                    setParams(newParams);
                  }}
                />
                {r.label}
              </label>
            ))}
            {(minPrice || maxPrice) && (
              <button className={styles['clear-filter']} onClick={() => {
                const newParams = new URLSearchParams(params);
                newParams.delete('min_price');
                newParams.delete('max_price');
                newParams.set('page', '1');
                setParams(newParams);
              }}>Clear filter</button>
            )}
          </div>

          {/* Apply / Clear buttons — only visible on mobile via CSS */}
          <div className={styles['sidebar-actions']}>
            {hasActiveFilters && (
              <button className={styles['clear-all-btn']} onClick={() => {
                const newParams = new URLSearchParams();
                if (searchQuery) newParams.set('search', searchQuery);
                newParams.set('page', '1');
                setParams(newParams);
                setFilterOpen(false);
              }}>
                Clear All
              </button>
            )}
            <button className={`btn-accent ${styles['apply-btn']}`} onClick={() => setFilterOpen(false)}>
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Products */}
        <main className={styles['shop-products']}>
          <div className={styles['shop-toolbar']}>
            <p>
              {products.length > 0
                ? `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, totalCount)} of ${totalCount} products`
                : 'No products found'}
            </p>
            <div className={styles['sort-by']}>
              <label>Sort by:</label>
              <select value={sort} onChange={e => setFilter('ordering', e.target.value)}>
                <option value="">Default</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="name">Name: A–Z</option>
                <option value="-created_at">Newest</option>
              </select>
            </div>
          </div>
          {loading ? (
            <Spinner />
          ) : (
            <div className={styles['shop-grid']}>
              {products.length === 0 ? (
                <div className={styles['no-products']}><p>No products found. Try changing filters.</p></div>
              ) : products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles['page-btn']} disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} className={`${styles['page-btn']} ${n === page ? styles.active : ''}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className={styles['page-btn']} disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
