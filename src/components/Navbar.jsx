import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [collectionsOpen, setCollectionsOpen] =
    useState(false);

  const [birthdayOpen, setBirthdayOpen] =
    useState(false);

  const [navbarVisible, setNavbarVisible] =
    useState(true);

  const navigate = useNavigate();


  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = (event) => {

    event.preventDefault();

    const query =
      searchQuery.trim();

    if (!query) {
      return;
    }

    navigate(
      `/shop?search=${encodeURIComponent(query)}`
    );

    setSearchOpen(false);
    setSearchQuery('');

  };


  // =========================================================
  // NAVBAR SCROLL
  // =========================================================

  useEffect(() => {

    let lastScrollY =
      window.scrollY;

    const handleScroll = () => {

      const currentScrollY =
        window.scrollY;

      if (
        currentScrollY <= 10 ||
        currentScrollY < lastScrollY
      ) {

        setNavbarVisible(true);

      } else {

        setNavbarVisible(false);

        setMenuOpen(false);

      }

      lastScrollY =
        currentScrollY;

    };


    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true
      }
    );


    return () => {

      window.removeEventListener(
        'scroll',
        handleScroll
      );

    };

  }, []);


  // =========================================================
  // CLOSE MENUS
  // =========================================================

  const closeMenus = () => {

    setMenuOpen(false);

    setCollectionsOpen(false);

    setBirthdayOpen(false);

  };


  // =========================================================
  // SEARCH TOGGLE
  // =========================================================

  const toggleSearch = () => {

    setSearchOpen(
      current => !current
    );

    /*
     * Search and menu cannot be open
     * at the same time.
     */
    setMenuOpen(false);

    setCollectionsOpen(false);

    setBirthdayOpen(false);

  };


  // =========================================================
  // MOBILE MENU
  // =========================================================

  const toggleMenu = () => {

    setMenuOpen(
      current => !current
    );

    /*
     * Opening hamburger closes search.
     */
    setSearchOpen(false);

    setCollectionsOpen(false);

    setBirthdayOpen(false);

  };


  return (

    <header
      className={`
        ${styles.navbar}
        ${
          navbarVisible
            ? styles.navbarVisible
            : styles.navbarHidden
        }
      `}
    >

      {/* =====================================================
          ANNOUNCEMENT BAR
      ===================================================== */}

      <div
        className={
          styles['announcement-bar']
        }
      >

        <div
          className={
            styles['announcement-track']
          }
        >

          <span>
            📢 Welcome to our store — New collections are here!
          </span>

          <span>
            🚚 Free Shipping on orders above ₹999
          </span>

          <span>
            ✨ Premium Quality — Shop with confidence
          </span>

          <span>
            📢 Welcome to our store — New collections are here!
          </span>

          <span>
            🚚 Free Shipping on orders above ₹999
          </span>

          <span>
            ✨ Premium Quality — Shop with confidence
          </span>

        </div>

      </div>


      {/* =====================================================
          UTILITY BAR
      ===================================================== */}

      <div
        className={
          styles['utility-bar']
        }
      >

        <div
          className={
            styles['utility-links']
          }
        >

          <Link to="/shop">
            Exchange Orders
          </Link>

          <Link to="/shop">
            Shipping Charges
          </Link>

          <Link to="/shop">
            Exchange &amp; Cancellation
          </Link>

          <Link to="/shop">
            Reviews
          </Link>

          <Link to="/shop">
            FAQs
          </Link>

          <Link to="/shop">
            Brand Story
          </Link>

          <Link to="/shop">
            Contact Us
          </Link>

        </div>


        <div
          className={
            styles['social-links']
          }
        >

          <span>◎</span>
          <span>f</span>
          <span>▶</span>
          <span>𝕏</span>
          <span>p</span>

        </div>

      </div>


      {/* =====================================================
          BRAND ROW
      ===================================================== */}

      <div
        className={`
          ${styles['brand-row']}
          container
        `}
      >

        {/* ---------------------------------------------------
            SEARCH BUTTON
        --------------------------------------------------- */}

        <button
          type="button"
          className={
            styles['search-icon-btn']
          }
          onClick={toggleSearch}
          aria-label="Search"
          aria-expanded={searchOpen}
        >

          <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >

            <circle
              cx="11"
              cy="11"
              r="8"
            />

            <path
              d="m21 21-4.35-4.35"
            />

          </svg>

        </button>


        {/* ---------------------------------------------------
            LOGO
        --------------------------------------------------- */}

        <Link
          to="/"
          className={
            styles['navbar-logo']
          }
          onClick={closeMenus}
        >

          <img
            src="/capy-logo-landscape.svg"
            alt="Capybara Baby Clothing"
          />

        </Link>


        {/* ---------------------------------------------------
            ACCOUNT + CART + HAMBURGER
        --------------------------------------------------- */}

        <div
          className={
            styles['brand-actions']
          }
        >

          {/* ACCOUNT */}

          <Link
            to={
              isAuthenticated
                ? '/account'
                : '/login'
            }
            className={
              styles['icon-btn']
            }
            aria-label="Account"
          >

            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >

              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
              />

              <circle
                cx="12"
                cy="7"
                r="4"
              />

            </svg>

          </Link>


          {/* CART */}

          <Link
            to="/cart"
            className={
              styles['icon-btn']
            }
            aria-label="Cart"
          >

            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >

              <path
                d="M6 7h15l-1.5 10h-12z"
              />

              <path
                d="M6 7 4.5 3H2"
              />

              <circle
                cx="9"
                cy="21"
                r="1"
              />

              <circle
                cx="18"
                cy="21"
                r="1"
              />

            </svg>


            {itemCount > 0 && (

              <span
                className={
                  styles['cart-count']
                }
              >
                {itemCount}
              </span>

            )}

          </Link>


          {/* -------------------------------------------------
              HAMBURGER

              IMPORTANT:
              It is only rendered when search is closed.
          ------------------------------------------------- */}

          {!searchOpen && (

            <button
              type="button"
              className={
                styles.hamburger
              }
              onClick={toggleMenu}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >

              <span />
              <span />
              <span />

            </button>

          )}

        </div>

      </div>


      {/* =====================================================
          MAIN NAVIGATION
      ===================================================== */}

      <div
        className={
          styles['nav-row']
        }
      >

        <nav
          className={`
            ${styles['navbar-links']}
            ${
              menuOpen
                ? styles.open
                : ''
            }
          `}
        >

          <Link
            to="/"
            onClick={closeMenus}
          >
            Home
          </Link>


          <Link
            to="/shop"
            onClick={closeMenus}
          >
            New Arrivals
          </Link>


          <Link
            to="/shop"
            onClick={closeMenus}
          >
            Ethnic Collections
          </Link>


          {/* COLLECTIONS */}

          <div
            className={
              styles['nav-dropdown']
            }
            onMouseEnter={() =>
              setCollectionsOpen(true)
            }
            onMouseLeave={() =>
              setCollectionsOpen(false)
            }
          >

            <button
              type="button"
              className={
                styles['dropdown-trigger']
              }
              onClick={() =>
                setCollectionsOpen(
                  current => !current
                )
              }
            >

              Collections

              <span
                className={
                  styles.chevron
                }
              >
                ⌄
              </span>

            </button>


            {collectionsOpen && (

              <div
                className={
                  styles['dropdown-menu']
                }
              >

                {collectionItems.map(
                  item => (

                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={closeMenus}
                    >
                      {item.label}
                    </Link>

                  )
                )}

              </div>

            )}

          </div>


          {/* BIRTHDAY DRESSES */}

          <div
            className={
              styles['nav-dropdown']
            }
            onMouseEnter={() =>
              setBirthdayOpen(true)
            }
            onMouseLeave={() =>
              setBirthdayOpen(false)
            }
          >

            <button
              type="button"
              className={
                styles['dropdown-trigger']
              }
              onClick={() =>
                setBirthdayOpen(
                  current => !current
                )
              }
            >

              Birthday Dresses

              <span
                className={
                  styles.chevron
                }
              >
                ⌄
              </span>

            </button>


            {birthdayOpen && (

              <div
                className={
                  styles['dropdown-menu']
                }
              >

                {birthdayItems.map(
                  item => (

                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={closeMenus}
                    >
                      {item.label}
                    </Link>

                  )
                )}

              </div>

            )}

          </div>


          <Link
            to="/shop"
            onClick={closeMenus}
          >
            Best Deals
          </Link>


          <Link
            to="/shop"
            onClick={closeMenus}
          >
            Offers &amp; Discounts
          </Link>


          <Link
            to="/shop"
            onClick={closeMenus}
          >
            Contact Us
          </Link>


          <Link
            to="/shop"
            onClick={closeMenus}
          >
            About
          </Link>

        </nav>

      </div>


      {/* =====================================================
          SEARCH BAR
      ===================================================== */}

      {searchOpen && (

        <div
          className={`
            ${styles['search-bar']}
            container
          `}
        >

          <form
            onSubmit={handleSearch}
          >

            <input
              autoFocus
              type="search"
              value={searchQuery}
              onChange={
                event =>
                  setSearchQuery(
                    event.target.value
                  )
              }
              placeholder="Search dresses, sets, frocks..."
              aria-label="Search products"
            />

            <button
              type="submit"
              className="btn-primary"
            >
              Search
            </button>

          </form>

        </div>

      )}

    </header>

  );

}