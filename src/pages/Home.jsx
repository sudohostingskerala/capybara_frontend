import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBanners } from '../services/bannerService';
import { getCategories } from '../services/categoryService';
import { getFeaturedProducts, getProducts } from '../services/productService';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import styles from './Home.module.css';

const testimonials = [
  {
    id: 1,
    name: "Priya S.",
    location: "Kochi",
    rating: 5,
    text: "Excellent collection and the quality is amazing. Fast delivery and beautiful packaging. Totally loved the Onam special collection!"
  },
  {
    id: 2,
    name: "Remni Nair",
    location: "Thrissur",
    rating: 5,
    text: "Very happy with the purchase. The pattu pavada is even more beautiful in person. My daughter loved it!"
  },
  {
    id: 3,
    name: "Jitha K.",
    location: "Trivandrum",
    rating: 5,
    text: "Capybara has the best traditional collection. Great customer service and premium quality products."
  },
];

export default function Home() {

  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [loading, setLoading] = useState(true);

  /*
   * Used to detect whether the user is swiping
   * the banner or simply clicking it.
   */
  const bannerTouchStart = useRef(null);
  const bannerTouchEnd = useRef(null);

  const bannerMouseStart = useRef(null);
  const bannerMouseDragging = useRef(false);

  const MIN_SWIPE_DISTANCE = 50;


  // =========================================================
  // LOAD HOME DATA
  // =========================================================

  useEffect(() => {

    const fetchData = async () => {

      try {

        const [
          bannersRes,
          catsRes,
          featuredRes,
          productsRes
        ] = await Promise.all([

          getBanners().catch(() => ({
            results: []
          })),

          getCategories().catch(() => ({
            results: []
          })),

          getFeaturedProducts().catch(() => ({
            results: []
          })),

          getProducts({
            ordering: '-created_at',
            page_size: 24
          }).catch(() => ({
            results: []
          })),

        ]);


        const bannerData =
          bannersRes.results ||
          bannersRes ||
          [];

        const categoryData =
          catsRes.results ||
          catsRes ||
          [];

        const featuredData =
          featuredRes.results ||
          featuredRes ||
          [];

        const productData =
          productsRes.results ||
          productsRes ||
          [];


        setBanners(bannerData);

        setCategories(categoryData);

        setFeatured(featuredData);

        setAllProducts(productData);

        setNewArrivals(
          productData.slice(0, 6)
        );

      } catch (err) {

        console.error(
          'Failed to load home data',
          err
        );

      } finally {

        setLoading(false);

      }

    };


    fetchData();

  }, []);


  // =========================================================
  // AUTOMATIC BANNER ROTATION
  // =========================================================

  useEffect(() => {

    if (banners.length <= 1) {
      return undefined;
    }


    const timer = setInterval(() => {

      setActiveBanner(
        current =>
          (current + 1) %
          banners.length
      );

    }, 5000);


    return () => {
      clearInterval(timer);
    };

  }, [banners.length]);


  // =========================================================
  // BANNER NAVIGATION
  // =========================================================

  const goToPreviousBanner = () => {

    setActiveBanner(
      current =>
        current === 0
          ? banners.length - 1
          : current - 1
    );

  };


  const goToNextBanner = () => {

    setActiveBanner(
      current =>
        (current + 1) %
        banners.length
    );

  };


  // =========================================================
  // TOUCH SWIPE
  // =========================================================

  const handleBannerTouchStart = (event) => {

    bannerTouchStart.current =
      event.touches[0].clientX;

    bannerTouchEnd.current =
      null;

  };


  const handleBannerTouchMove = (event) => {

    bannerTouchEnd.current =
      event.touches[0].clientX;

  };


  const handleBannerTouchEnd = () => {

    if (
      bannerTouchStart.current === null ||
      bannerTouchEnd.current === null
    ) {
      return;
    }


    const distance =
      bannerTouchStart.current -
      bannerTouchEnd.current;


    if (
      Math.abs(distance) <
      MIN_SWIPE_DISTANCE
    ) {
      return;
    }


    if (distance > 0) {

      goToNextBanner();

    } else {

      goToPreviousBanner();

    }


    bannerTouchStart.current = null;

    bannerTouchEnd.current = null;

  };


  // =========================================================
  // MOUSE DRAG
  // =========================================================

  const handleBannerMouseDown = (event) => {

    bannerMouseStart.current =
      event.clientX;

    bannerMouseDragging.current =
      false;

  };


  const handleBannerMouseMove = (event) => {

    if (
      bannerMouseStart.current === null
    ) {
      return;
    }


    const distance =
      Math.abs(
        event.clientX -
        bannerMouseStart.current
      );


    if (
      distance > 10
    ) {

      bannerMouseDragging.current =
        true;

    }

  };


  const handleBannerMouseUp = (event) => {

    if (
      bannerMouseStart.current === null
    ) {
      return;
    }


    const distance =
      bannerMouseStart.current -
      event.clientX;


    if (
      Math.abs(distance) >=
      MIN_SWIPE_DISTANCE
    ) {

      if (distance > 0) {

        goToNextBanner();

      } else {

        goToPreviousBanner();

      }

    }


    bannerMouseStart.current = null;

  };


  /*
   * Prevent clicking the banner immediately after
   * dragging it.
   */
  const handleBannerClick = (event) => {

    if (
      bannerMouseDragging.current
    ) {

      event.preventDefault();

      event.stopPropagation();

      bannerMouseDragging.current =
        false;

    }

  };


  // =========================================================
  // PRODUCT DATA
  // =========================================================

  const productPool = useMemo(
    () =>
      allProducts.length > 0
        ? allProducts
        : [
            ...featured,
            ...newArrivals
          ],
    [
      allProducts,
      featured,
      newArrivals
    ]
  );


  const ethnicProducts =
    featured.slice(0, 6);


  const birthdayProducts =
    productPool.slice(0, 6);


  const hotProducts =
    productPool.slice(6, 12).length >= 3
      ? productPool.slice(6, 12)
      : productPool.slice(0, 6);


  const dealProducts =
    productPool.slice(12, 18).length >= 3
      ? productPool.slice(12, 18)
      : featured.slice(0, 6);


  const collectionCards =
    categories.slice(0, 6);


  const featuredCollections =
    categories.slice(0, 3);


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return <Spinner />;
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className={styles.home}>


      {/* =====================================================
          ANNOUNCEMENT BAR
      ===================================================== */}

      <div className={styles['trust-bar']}>

        <div className={styles['trust-track']}>

          <span>
            🚚 Free Shipping on orders above ₹999
          </span>

          <span>
            🔄 Easy 10-day returns
          </span>

          <span>
            ⭐ Premium Quality — Trusted by 10,000+ customers
          </span>

          <span>
            🔒 Secure Payments
          </span>

          <span>
            📞 24/7 Support
          </span>

          <span>
            🚚 Free Shipping on orders above ₹999
          </span>

          <span>
            🔄 Easy 10-day returns
          </span>

          <span>
            ⭐ Premium Quality — Trusted by 10,000+ customers
          </span>

          <span>
            🔒 Secure Payments
          </span>

          <span>
            📞 24/7 Support
          </span>

        </div>

      </div>


      {/* =====================================================
          CATEGORY SHORTCUTS
      ===================================================== */}

      <section
        className={`${styles.categories} container`}
      >

        {[
          {
            name: 'Birthday Dresses',
            image: '/cat-img/birthday.jpeg',
            url: '/shop'
          },
          {
            name: 'First Birthday',
            image: '/cat-img/first%20birthday.jpeg',
            url: '/shop'
          },
          {
            name: 'Theme Made Frocks',
            image: '/cat-img/theme%20made%20frocks.jpeg',
            url: '/shop'
          },
          {
            name: 'Ethnic Collections',
            image: '/cat-img/ethinic.jpeg',
            url: '/shop'
          },
          {
            name: 'Dreamscape Dress',
            image: '/cat-img/dream%20scape.jpeg',
            url: '/shop'
          },
          {
            name: 'Ready to Dispatch',
            image: '/cat-img/ready%20to%20dispatch.jpeg',
            url: '/shop'
          },
          {
            name: 'Trending Designs',
            image: '/cat-img/trending.jpeg',
            url: '/shop'
          },
          {
            name: 'New Arrivals',
            image: '/cat-img/new%20arrivals.jpeg',
            url: '/shop'
          },
          {
            name: 'Onam Collection',
            image: '/cat-img/festival.jpeg',
            url: '/shop'
          },
        ].map(item => (

          <Link
            to={item.url}
            key={item.name}
            className={styles['cat-circle']}
          >

            <div
              className={styles['cat-circle-img']}
            >

              <img
                src={item.image}
                alt={item.name}
              />

            </div>

            <span>
              {item.name}
            </span>

          </Link>

        ))}

      </section>


      {/* =====================================================
          HERO BANNER
      ===================================================== */}

      {banners.length > 0 && (

        <section
          className={styles['hero-banner']}
          onTouchStart={
            handleBannerTouchStart
          }
          onTouchMove={
            handleBannerTouchMove
          }
          onTouchEnd={
            handleBannerTouchEnd
          }
          onMouseDown={
            handleBannerMouseDown
          }
          onMouseMove={
            handleBannerMouseMove
          }
          onMouseUp={
            handleBannerMouseUp
          }
          onMouseLeave={
            handleBannerMouseUp
          }
        >

          <div
            className={styles['hero-track']}
            style={{
              transform:
                `translateX(-${activeBanner * 100}%)`
            }}
          >

            {banners.map(banner => (

              <Link
                to={
                  banner.button_url ||
                  '/shop'
                }
                key={banner.id}
                className={
                  styles['hero-slide']
                }
                onClick={
                  handleBannerClick
                }
                draggable={false}
              >

                <img
                  src={banner.image}
                  alt={
                    banner.title ||
                    'Promotional Banner'
                  }
                  draggable={false}
                />

              </Link>

            ))}

          </div>


          {/* Banner dots */}

          {banners.length > 1 && (

            <div
              className={styles['hero-dots']}
              aria-label="Banner navigation"
            >

              {banners.map(
                (banner, index) => (

                  <button
                    type="button"
                    key={
                      banner.id ||
                      index
                    }
                    className={
                      index === activeBanner
                        ? styles['hero-dot-active']
                        : styles['hero-dot']
                    }
                    onClick={() =>
                      setActiveBanner(
                        index
                      )
                    }
                    aria-label={
                      `Show banner ${index + 1}`
                    }
                  />

                )
              )}

            </div>

          )}

        </section>

      )}


      {/* =====================================================
          ETHNIC COLLECTIONS
      ===================================================== */}

      {ethnicProducts.length > 0 && (

        <section
          className={`${styles['product-section']} container`}
        >

          <div
            className={
              styles['section-header']
            }
          >

            <h2
              className={
                styles['home-section-title']
              }
            >
              Ethnic Collections 🔥
            </h2>

            <Link
              to="/shop"
              className={
                styles['view-all']
              }
            >
              View All
            </Link>

          </div>


          <div
            className={
              styles['products-grid']
            }
          >

            {ethnicProducts.map(
              product => (

                <div
                  className={
                    styles['product-scroll-item']
                  }
                  key={product.id}
                >
                  <ProductCard
                    product={product}
                  />
                </div>

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          BIRTHDAY DRESSES
      ===================================================== */}

      {birthdayProducts.length > 0 && (

        <section
          className={`${styles['product-section']} container`}
        >

          <div
            className={
              styles['section-header']
            }
          >

            <h2
              className={
                styles['home-section-title']
              }
            >
              Birthday Dresses 🔥
            </h2>

            <Link
              to="/shop"
              className={
                styles['view-all']
              }
            >
              View All
            </Link>

          </div>


          <div
            className={
              styles['products-grid']
            }
          >

            {birthdayProducts.map(
              product => (

                <div
                  className={
                    styles['product-scroll-item']
                  }
                  key={product.id}
                >
                  <ProductCard
                    product={product}
                  />
                </div>

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          SHOP BY COLLECTION
      ===================================================== */}

      {collectionCards.length > 0 && (

        <section
          className={`${styles['collection-section']} container`}
        >

          <h2
            className={
              styles['center-title']
            }
          >
            Shop by Collection
          </h2>


          <div
            className={
              styles['collections-grid']
            }
          >

            {collectionCards.map(
              category => (

                <Link
                  to={
                    `/shop?category__slug=${category.slug}`
                  }
                  key={category.id}
                  className={
                    styles['collection-card']
                  }
                >

                  {category.image && (

                    <img
                      src={
                        category.image
                      }
                      alt={
                        category.name
                      }
                    />

                  )}

                  <div
                    className={
                      styles['collection-label']
                    }
                  >
                    {category.name}
                  </div>

                </Link>

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          HOT NEW ARRIVALS
      ===================================================== */}

      {hotProducts.length > 0 && (

        <section
          className={`${styles['product-section']} container`}
        >

          <div
            className={
              styles['section-header']
            }
          >

            <h2
              className={
                styles['home-section-title']
              }
            >
              Hot New Arrivals 🔥
            </h2>

            <Link
              to="/shop"
              className={
                styles['view-all']
              }
            >
              View All
            </Link>

          </div>


          <div
            className={
              styles['products-grid']
            }
          >

            {hotProducts.map(
              product => (

                <div
                  className={
                    styles['product-scroll-item']
                  }
                  key={product.id}
                >
                  <ProductCard
                    product={product}
                  />
                </div>

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          BEST DEALS
      ===================================================== */}

      {dealProducts.length > 0 && (

        <section
          className={`${styles['product-section']} container`}
        >

          <div
            className={
              styles['section-header']
            }
          >

            <h2
              className={
                styles['home-section-title']
              }
            >
              Best Deals 🔥
            </h2>

            <Link
              to="/shop"
              className={
                styles['view-all']
              }
            >
              View All
            </Link>

          </div>


          <div
            className={
              styles['products-grid']
            }
          >

            {dealProducts.map(
              product => (

                <div
                  className={
                    styles['product-scroll-item']
                  }
                  key={product.id}
                >
                  <ProductCard
                    product={product}
                  />
                </div>

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          FEATURED COLLECTIONS
      ===================================================== */}

      {featuredCollections.length > 0 && (

        <section
          className={
            styles['featured-collections']
          }
        >

          <div className="container">

            <h2
              className={
                styles['center-title']
              }
            >
              Featured Collections
            </h2>


            <div
              className={
                styles['featured-grid']
              }
            >

              {featuredCollections.map(
                category => (

                  <Link
                    to={
                      `/shop?category__slug=${category.slug}`
                    }
                    key={category.id}
                    className={
                      styles['featured-card']
                    }
                  >

                    {category.image && (

                      <img
                        src={
                          category.image
                        }
                        alt={
                          category.name
                        }
                      />

                    )}


                    <div
                      className={
                        styles['featured-overlay']
                      }
                    >

                      <h3>
                        {category.name}
                      </h3>

                      <span>
                        Shop Now →
                      </span>

                    </div>

                  </Link>

                )
              )}

            </div>

          </div>

        </section>

      )}


      {/* =====================================================
          TESTIMONIALS
      ===================================================== */}

      <section
        className={
          styles.testimonials
        }
      >

        <div className="container">

          <h2
            className={
              styles['center-title']
            }
          >
            Thank You for Being a Part of Our Onam!
          </h2>

          <p
            className={
              styles['testimonial-subtitle']
            }
          >
            We love our customers &amp; they love us
          </p>


          <div
            className={
              styles['testimonials-grid']
            }
          >

            {testimonials.map(
              testimonial => (

                <div
                  key={testimonial.id}
                  className={
                    styles['testimonial-card']
                  }
                >

                  <div
                    className="stars"
                    style={{
                      marginBottom:
                        '8px'
                    }}
                  >

                    {[1, 2, 3, 4, 5].map(
                      star => (

                        <span
                          key={star}
                          className="star filled"
                        >
                          ★
                        </span>

                      )
                    )}

                  </div>


                  <p>
                    "{testimonial.text}"
                  </p>


                  <div
                    className={
                      styles['testimonial-author']
                    }
                  >

                    <div
                      className={
                        styles['testimonial-avatar']
                      }
                    >
                      {testimonial.name[0]}
                    </div>


                    <div>

                      <strong>
                        {testimonial.name}
                      </strong>

                      <span>
                        {testimonial.location}
                        {" · "}
                        Verified Buyer
                      </span>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURES
      ===================================================== */}

      <div
        className={`${styles['features-bar']} container`}
      >

        <div
          className={
            styles.feature
          }
        >

          <span>🚚</span>

          <div>

            <strong>
              Free Shipping
            </strong>

            <p>
              On all orders above ₹999
            </p>

          </div>

        </div>


        <div
          className={
            styles.feature
          }
        >

          <span>🔄</span>

          <div>

            <strong>
              Easy Returns
            </strong>

            <p>
              10-day return &amp; exchange policy
            </p>

          </div>

        </div>


        <div
          className={
            styles.feature
          }
        >

          <span>🔒</span>

          <div>

            <strong>
              Secure Payments
            </strong>

            <p>
              100% secure payments. Multiple payment options.
            </p>

          </div>

        </div>


        <div
          className={
            styles.feature
          }
        >

          <span>📞</span>

          <div>

            <strong>
              24/7 Support
            </strong>

            <p>
              Our customer support team is always here to help you
            </p>

          </div>

        </div>

      </div>

    </div>

  );

}