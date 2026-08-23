import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import styles from './Navbar.module.css';

const collectionItems = [
  { label: 'All Collections', to: '/shop' },
  { label: 'Best Sellers', to: '/shop' },
  { label: 'Ethnic Collections', to: '/shop' },
  { label: 'Dreamscape Dresses', to: '/shop' },
  { label: 'Ready to Dispatch', to: '/shop' },
  { label: 'Partywear Frocks', to: '/shop' },
  { label: 'Onam Collection', to: '/shop' },
  { label: 'Full Frocks', to: '/shop' },
  { label: 'Lehengas Choli', to: '/shop' },
];

const birthdayItems = [
  { label: 'All Birthday Dresses', to: '/shop' },
  { label: 'First Birthday', to: '/shop' },
  { label: 'Theme Made Frocks', to: '/shop' },
];

export default function Navbar() {
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const { wishlist } = useWishlist();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);

  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10 || currentScrollY < lastScrollY) {
        setNavbarVisible(true);
      } else {
        setNavbarVisible(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenus = () => {
    setMenuOpen(false);
    setCollectionsOpen(false);
    setBirthdayOpen(false);
  };

  return (
    <header className={`${styles.navbar} ${navbarVisible ? styles.navbarVisible : styles.navbarHidden}`}>

      {/* Announcement bar */}
      <div className={styles['announcement-bar']}>
        <div className={styles['announcement-track']}>
          <span>📢 Welcome to our store — New collections are here!</span>
          <span>🚚 Free Shipping on orders above ₹999</span>
          <span>✨ Premium Quality — Shop with confidence</span>
          <span>📢 Welcome to our store — New collections are here!</span>
          <span>🚚 Free Shipping on orders above ₹999</span>
          <span>✨ Premium Quality — Shop with confidence</span>
        </div>
      </div>

      {/* Utility links + social icons */}
      <div className={styles['utility-bar']}>
        <div className={styles['utility-links']}>
          <Link to="/shop">Exchange Orders</Link>
          <Link to="/shop">Shipping Charges</Link>
          <Link to="/shop">Exchange &amp; Cancellation</Link>
          <Link to="/shop">Reviews</Link>
          <Link to="/shop">FAQs</Link>
          <Link to="/shop">Brand Story</Link>
          <Link to="/shop">Contact Us</Link>
        </div>

        <div className={styles['social-links']} aria-label="Social links">
          <span aria-label="Instagram">◎</span>
          <span aria-label="Facebook">f</span>
          <span aria-label="YouTube">▶</span>
          <span aria-label="X">𝕏</span>
          <span aria-label="Pinterest">p</span>
        </div>
      </div>

      {/* Logo + actions */}
      <div className={`${styles['brand-row']} container`}>
        <button
          className={styles['icon-btn']}
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="Search"
        >
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>

        <Link to="/" className={styles['navbar-logo']} onClick={closeMenus}>
          <img src="/capy-logo-landscape.svg" alt="Capybara Baby Clothing" />
        </Link>

        <div className={styles['brand-actions']}>
          <Link
            to={isAuthenticated ? '/account' : '/login'}
            className={styles['icon-btn']}
            aria-label="Account"
          >
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

          <Link to="/cart" className={styles['icon-btn']} aria-label="Cart">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M6 7h15l-1.5 10h-12z" />
              <path d="M6 7 4.5 3H2" />
              <circle cx="9" cy="21" r="1" />
              <circle cx="18" cy="21" r="1" />
            </svg>
            {itemCount > 0 && <span className={styles['cart-count']}>{itemCount}</span>}
          </Link>
        </div>
      </div>

      {/* Main navigation */}
      <div className={styles['nav-row']}>
        <nav className={`${styles['navbar-links']} ${menuOpen ? styles.open : ''}`}>

          <Link to="/" onClick={closeMenus}>Home</Link>

          <Link to="/shop" onClick={closeMenus}>New Arrivals</Link>

          <Link to="/shop" onClick={closeMenus}>Ethnic Collections</Link>

          <div
            className={styles['nav-dropdown']}
            onMouseEnter={() => setCollectionsOpen(true)}
            onMouseLeave={() => setCollectionsOpen(false)}
          >
            <button
              type="button"
              className={styles['dropdown-trigger']}
              onClick={() => setCollectionsOpen(!collectionsOpen)}
            >
              Collections
              <span className={styles.chevron}>⌄</span>
            </button>

            {collectionsOpen && (
              <div className={styles['dropdown-menu']}>
                {collectionItems.map((item) => (
                  <Link key={item.label} to={item.to} onClick={closeMenus}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div
            className={styles['nav-dropdown']}
            onMouseEnter={() => setBirthdayOpen(true)}
            onMouseLeave={() => setBirthdayOpen(false)}
          >
            <button
              type="button"
              className={styles['dropdown-trigger']}
              onClick={() => setBirthdayOpen(!birthdayOpen)}
            >
              Birthday Dresses
              <span className={styles.chevron}>⌄</span>
            </button>

            {birthdayOpen && (
              <div className={styles['dropdown-menu']}>
                {birthdayItems.map((item) => (
                  <Link key={item.label} to={item.to} onClick={closeMenus}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/shop" onClick={closeMenus}>Best Deals</Link>

          <Link to="/shop" onClick={closeMenus}>Offers &amp; Discounts</Link>

          <Link to="/shop" onClick={closeMenus}>Contact Us</Link>

          <Link to="/shop" onClick={closeMenus}>About</Link>
        </nav>
      </div>

      {/* Search */}
      {searchOpen && (
        <div className={`${styles['search-bar']} container`}>
          <form onSubmit={handleSearch}>
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dresses, sets, frocks..."
            />
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>
      )}

      {/* Mobile menu button */}
      <button
        className={styles.hamburger}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}
