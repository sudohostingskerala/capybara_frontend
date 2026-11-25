import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import styles from './Cart.module.css';

export default function Cart() {
  const { cartItems, totalAmount, updateQty, removeFromCart, itemCount, loading } = useCart();
  const { isAuthenticated } = useAuth();
  if (loading) return <Spinner />;

  if (cartItems.length === 0) return (
    <div className={`${styles['cart-empty']} container`}>
      <div className={styles['cart-empty-icon']}>🛒</div>
      <h2>Your cart is empty</h2>
      <p>Looks like you haven't added anything yet.</p>
      <Link to="/shop" className="btn-primary">Continue Shopping</Link>
    </div>
  );

  return (
    <div className={`${styles['cart-page']} container`}>
      <h1>Your Cart ({itemCount})</h1>
      <p className={styles['cart-sub']}>Check out with ease. Your little one's comfort is just a click away.</p>
      <div className={styles['cart-layout']}>
        <div className={styles['cart-items']}>
          {cartItems.map(item => (
            <div key={item.id} className={styles['cart-item']}>
              <Link to={`/product/${item.slug}`}>
                {item.image && <img src={item.image} alt={item.product_name} />}
              </Link>
              <div className={styles['cart-item-info']}>
                <h3><Link to={`/product/${item.slug}`}>{item.product_name}</Link></h3>
                <p>Size: {item.size} | Color: {item.color}</p>
                <strong>₹{parseFloat(item.unit_price).toLocaleString()}</strong>
              </div>
              <div className={styles['cart-item-qty']}>
                <button onClick={() => updateQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
              </div>
              <button className={styles['cart-remove']} onClick={() => removeFromCart(item.id)} title="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
          <Link to="/shop" className={styles['continue-shopping']}>← Continue Shopping</Link>
        </div>
        <div className={styles['cart-summary']}>
          <h2>Order Summary</h2>
          <div className="summary-row"><span>Total </span><span>₹{totalAmount.toLocaleString()}</span></div>
          <Link to={isAuthenticated ? "/checkout" : "/guest-checkout"} className={`btn-accent ${styles['checkout-btn']}`}>Proceed to Checkout</Link>
          <p className={styles['secure-checkout']}>🔒 Secure Checkout</p>
          <div className={styles['cart-trust']}>
            <div><span>🚚</span><small>Fast Delivery</small></div>
            <div><span>🔒</span><small>Secure</small></div>
            <div><span>🔄</span><small>30 Day Returns</small></div>
          </div>
        </div>
      </div>
    </div>
  );
}
