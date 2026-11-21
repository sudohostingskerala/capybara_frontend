import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  const GOOGLE_MAPS_IFRAME_URL = "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d535.6042027415516!2d75.7866218389042!3d11.299722600849378!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTHCsDE3JzU4LjQiTiA3NcKwNDcnMTIuOCJF!5e0!3m2!1sen!2sin!4v1795236223926!5m2!1sen!2sin";
  const mapSrc = GOOGLE_MAPS_IFRAME_URL;
  return (
    <footer className={styles.footer}>
      <div className={`${styles['footer-main']} container`}>
        <div className={styles['footer-col']}>
          <div className={styles['footer-brand']}>
            <img src="/assets/logo.jpeg" alt="Capybara" className={styles['footer-logo']} />
            <p>Sustainable, soft, and adorable clothing for your little ones. We believe in quality that lasts through every adventure.</p>
          </div>
        </div>
        <div className={styles['footer-col']}>
          <h4>SHOP ALL</h4>
          <ul>
            <li><Link to="/shop">Shop All</Link></li>
            <li><Link to="/shop?/shop?search=lehenga%20frock">Trending</Link></li>
            <li><Link to="/shop?search=lehenga">Lehanga collections</Link></li>
            <li><Link to="/shop?search=Frock">Frock collections</Link></li>
            <li><Link to="/shop?search=festive">Festive Wear</Link></li>
          </ul>
        </div>
        <div className={styles['footer-col']}>
          <h4>SUPPORT</h4>
          <ul>
            <li><Link to="/">Brand story</Link></li>
            <li><Link to="/">Returns &amp; Exchanges</Link></li>
            <li><Link to="/About-us">About Us</Link></li>
            <li><Link to="/Contact-us">Contact Us</Link></li>
            <li><Link to="/shipping-policy">Shipping charges</Link></li>
          </ul>
        </div>
        {/* <div className={styles['footer-col']}>
          <h4>NEWSLETTER</h4>
          <p>Join our family and get 10% off your first order.</p>
          <form className={styles['newsletter-form']} onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Email address" />
            <button className="btn-primary" type="submit">Join</button>
          </form>
        </div> */}
        <section className={styles['footer-col']} aria-labelledby="map-heading">
                  <div className={styles.sectionHeading}>
                    <span className={styles.sectionLabel}>FIND US</span>
                    <h2 id="map-heading">Our Location</h2>
                    <p>You can find us using the map below.</p>
                  </div>
                 <div className={styles.mapFrame}>
          {mapSrc ? (
            <iframe
              title="Neeharika location on Google Maps"
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className={styles.mapPlaceholder}>
              <strong>Google Map will appear here</strong>
              <span>Google Maps location will be added soon.</span>
            </div>
          )}
        </div>
                </section>
      </div>
      <div className={`${styles['footer-bottom']} container`}>
        <p>© 2026 Capybara Baby Clothing. All rights reserved.</p>
        <p>Made with ❤️ for little ones</p>
      </div>
    </footer>
  );
}
