import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  // Support both backend API shape and flexible field names
  const slug = product.slug;
  const name = product.name;
  // const image = product.primary_image || 
  //   product.image || 
  //   (product.images?.[0]?.image) ||
  //   (product.images?.[0]?.image_url) ||
  //   (typeof product.images?.[0] === 'string' ? product.images[0] : null) ||
  //   (product.variants?.[0]?.images?.[0]?.image) ||
  //   (product.variants?.[0]?.images?.[0]?.image_url) ||
  //   '/assets/placeholder.png';
  const image = 
    product.primary_image ||
    product.image ||
    (product.images?.[0]?.image) ||
    (product.images?.[0]?.image_url) ||
    (typeof product.images?.[0] === 'string' ? product.images[0] : null) ||
    '/assets/placeholder.png'
  const sellingPrice = product.selling_price ? parseFloat(product.selling_price) : null;
  const originalPrice = product.price ? parseFloat(product.price) : null;
  const discount = sellingPrice && originalPrice && originalPrice > sellingPrice
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    : null;
  const badge = product.badge || null;
  const rating = product.rating || null;
  const reviewCount = product.reviews_count || product.reviews || null;

  return (
    <Link to={`/product/${slug}`} className={styles['product-card']}>
      <div className={styles['product-card-img']}>
        {image && <img src={image} alt={name} loading="lazy" />}
        {badge && <span className={`${styles['product-badge']} badge ${badge === 'BEST SELLER' ? 'badge-brown' : 'badge-accent'}`}>{badge}</span>}
      </div>
      <div className={styles['product-card-info']}>
        <h3>{name}</h3>
        {rating && <StarRating rating={rating} count={reviewCount} />}
        <div className={styles['product-price']}>
          {sellingPrice && <span className={styles['price-current']}>₹{sellingPrice.toLocaleString()}</span>}
          {discount && originalPrice && (
            <>
              <span className={styles['price-original']}>₹{originalPrice.toLocaleString()}</span>
              <span className={styles['price-discount']}>{discount}% OFF</span>
            </>
          )}
          {!sellingPrice && originalPrice && <span className={styles['price-current']}>₹{originalPrice.toLocaleString()}</span>}
        </div>
      </div>
    </Link>
  );
}
