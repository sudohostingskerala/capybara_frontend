
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

  const selCat =
    params.get('category__slug') ||
    params.get('category_slug') ||
    '';

  const searchQuery = params.get('search') || '';
  const selColor = params.get('color') || '';
  const selSize = params.get('size') || '';
  const sort = params.get('ordering') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const minPrice = params.get('min_price') || '';
  const maxPrice = params.get('max_price') || '';

  const PER_PAGE = 12;

  // Fetch categories once
  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const data = await getCategories();

        if (!cancelled) {
          setCategories(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.results)
                ? data.results
                : []
          );
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);

        if (!cancelled) {
          setCategories([]);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch products whenever filters, sorting, or page changes
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);

      try {
        const queryParams = { page };

        if (selCat) queryParams.category__slug = selCat;
        if (searchQuery) queryParams.search = searchQuery;
        if (selColor) queryParams.color = selColor;
        if (selSize) queryParams.size = selSize;

        // Price sorting is handled locally.
        // Other sorting options are sent to the backend.
        if (sort && sort !== 'price' && sort !== '-price') {
          queryParams.ordering = sort;
        }

        if (minPrice !== '') queryParams.min_price = minPrice;
        if (maxPrice !== '') queryParams.max_price = maxPrice;

        const data = await getProducts(queryParams);

        const fetchedProducts = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        // Sort the products returned for the current page
        const sortedProducts = [...fetchedProducts];

        if (sort === 'price' || sort === '-price') {
          sortedProducts.sort((a, b) => {
            const priceA = Number(a.price);
            const priceB = Number(b.price);

            // Keep products with missing prices at the end
            if (!Number.isFinite(priceA) && !Number.isFinite(priceB)) {
              return 0;
            }

            if (!Number.isFinite(priceA)) return 1;
            if (!Number.isFinite(priceB)) return -1;

            return sort === 'price'
              ? priceA - priceB
              : priceB - priceA;
          });
        }

        if (!cancelled) {
          setProducts(sortedProducts);
          setTotalCount(
            typeof data?.count === 'number'
              ? data.count
              : fetchedProducts.length
          );
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);

        if (!cancelled) {
          setProducts([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [
    selCat,
    searchQuery,
    selColor,
    selSize,
    sort,
    page,
    minPrice,
    maxPrice,
  ]);

  // Update a filter in the URL and return to page 1
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

  // Change pagination page
  const setPage = (nextPage) => {
    const newParams = new URLSearchParams(params);
    newParams.set('page', String(nextPage));
    setParams(newParams);
  };

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  // Determine the active price range
  const activePriceLabel = PRICE_RANGES.find(
    (range) =>
      String(range.min) === minPrice &&
      (range.max === null
        ? !maxPrice
        : String(range.max) === maxPrice)
  )?.label || '';

  const hasActiveFilters = Boolean(
    selCat || selColor || selSize || minPrice || maxPrice
  );

  // Clear filters but preserve the search query
  const clearAllFilters = () => {
    const newParams = new URLSearchParams();

    if (searchQuery) {
      newParams.set('search', searchQuery);
    }

    newParams.set('page', '1');
    setParams(newParams);
    setFilterOpen(false);
  };

  // Apply a price range
  const applyPriceRange = (range) => {
    const newParams = new URLSearchParams(params);

    newParams.set('min_price', String(range.min));

    if (range.max !== null) {
      newParams.set('max_price', String(range.max));
    } else {
      newParams.delete('max_price');
    }

    newParams.set('page', '1');
    setParams(newParams);
  };

  // Clear the price range
  const clearPriceRange = () => {
    const newParams = new URLSearchParams(params);

    newParams.delete('min_price');
    newParams.delete('max_price');
    newParams.set('page', '1');

    setParams(newParams);
  };

  return (
    <div className={`${styles['shop-page']} container`}>
      <div className={styles['shop-header']}>
        <nav className="breadcrumb">
          <a href="/">Home</a>
          <span className="sep">/</span>
          <span className="current">Shop All</span>
        </nav>

        <h1>Shop All</h1>

        <p>
          Discover our curated collection of traditional Indian baby
          &amp; kids wear, designed for festive occasions and celebrations.
        </p>
      </div>

      {/* Mobile filter and sorting bar */}
      <div className={styles['mobile-filter-bar']}>
        <button
          type="button"
          className={styles['filter-toggle-btn']}
          onClick={() => setFilterOpen((open) => !open)}
          aria-expanded={filterOpen}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="16" y2="12" />
            <line x1="4" y1="18" x2="12" y2="18" />
          </svg>

          Filters

          {hasActiveFilters && (
            <span className={styles['filter-badge']}>•</span>
          )}
        </button>

        <div className={styles['sort-by-mobile']}>
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(event) =>
              setFilter('ordering', event.target.value)
            }
          >
            <option value="">Sort by</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="name">Name: A–Z</option>
            <option value="-created_at">Newest</option>
          </select>
        </div>
      </div>

      {/* Mobile filter overlay */}
      {filterOpen && (
        <div
          className={styles['filter-overlay']}
          onClick={() => setFilterOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={styles['shop-layout']}>
        {/* Filter sidebar */}
        <aside
          className={`${styles['shop-sidebar']} ${
            filterOpen ? styles['sidebar-open'] : ''
          }`}
        >
          <div className={styles['sidebar-header']}>
            <h2>Filters</h2>

            <button
              type="button"
              className={styles['sidebar-close']}
              onClick={() => setFilterOpen(false)}
              aria-label="Close filters"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Categories */}
          <div className={styles['filter-section']}>
            <h3>Categories</h3>

            <button
              type="button"
              className={`${styles['filter-cat']} ${
                !selCat ? styles.active : ''
              }`}
              onClick={() => setFilter('category__slug', '')}
            >
              All Categories
            </button>

            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={`${styles['filter-cat']} ${
                  selCat === category.slug ? styles.active : ''
                }`}
                onClick={() =>
                  setFilter('category__slug', category.slug)
                }
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Price ranges */}
          <div className={styles['filter-section']}>
            <h3>Price Range</h3>

            {PRICE_RANGES.map((range) => (
              <label
                key={range.label}
                className={styles['filter-radio']}
              >
                <input
                  type="radio"
                  name="price"
                  checked={activePriceLabel === range.label}
                  onChange={() => applyPriceRange(range)}
                />

                {range.label}
              </label>
            ))}

            {(minPrice || maxPrice) && (
              <button
                type="button"
                className={styles['clear-filter']}
                onClick={clearPriceRange}
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Mobile sidebar actions */}
          <div className={styles['sidebar-actions']}>
            {hasActiveFilters && (
              <button
                type="button"
                className={styles['clear-all-btn']}
                onClick={clearAllFilters}
              >
                Clear All
              </button>
            )}

            <button
              type="button"
              className={`btn-accent ${styles['apply-btn']}`}
              onClick={() => setFilterOpen(false)}
            >
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Product listing */}
        <main className={styles['shop-products']}>
          <div className={styles['shop-toolbar']}>
            <p>
              {loading
                ? 'Loading products...'
                : products.length > 0
                  ? `Showing ${
                      (page - 1) * PER_PAGE + 1
                    }–${Math.min(
                      (page - 1) * PER_PAGE + products.length,
                      totalCount
                    )} of ${totalCount} products`
                  : 'No products found'}
            </p>

            <div className={styles['sort-by']}>
              <label htmlFor="shop-sort">Sort by:</label>

              <select
                id="shop-sort"
                value={sort}
                onChange={(event) =>
                  setFilter('ordering', event.target.value)
                }
              >
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
                <div className={styles['no-products']}>
                  <p>No products found. Try changing filters.</p>
                </div>
              ) : (
                products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles['page-btn']}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                aria-label="Previous page"
              >
                ‹
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((number) => (
                <button
                  type="button"
                  key={number}
                  className={`${styles['page-btn']} ${
                    number === page ? styles.active : ''
                  }`}
                  onClick={() => setPage(number)}
                  aria-current={number === page ? 'page' : undefined}
                >
                  {number}
                </button>
              ))}

              <button
                type="button"
                className={styles['page-btn']}
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
