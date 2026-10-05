import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getOrderDetail } from '../services/orderService';
import styles from './OrderSuccess.module.css';

export default function OrderSuccess() {
  const location = useLocation();
  const order = location.state?.order;
  const [currentOrder, setCurrentOrder] = useState(order || null);
  const [checking, setChecking] = useState(Boolean(order?.id && order.payment_status !== 'PAID'));
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!order?.id || order.payment_status === 'PAID') return undefined;
    let active = true;
    let timer;
    let attempts = 0;
    const refresh = async () => {
      try {
        const latest = await getOrderDetail(order.id);
        if (!active) return;
        setCurrentOrder(latest);
        if (latest.payment_status === 'PAID' || latest.payment_status === 'FAILED'
          || latest.payment_status === 'REFUNDED' || latest.status === 'CANCELLED') {
          setChecking(false);
          return;
        }
      } catch {
        // Keep checking; the client callback is not authoritative.
      }
      attempts += 1;
      if (attempts >= 40) {
        if (active) {
          setChecking(false);
          setTimedOut(true);
        }
        return;
      }
      timer = window.setTimeout(refresh, 2500);
    };
    refresh();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [order]);

  if (!currentOrder) return (
    <div className="container" style={{ textAlign: 'center', padding: '60px' }}>
      <h2>No order found</h2>
      <Link to="/" className="btn-primary" style={{ marginTop: '20px' }}>Go Home</Link>
    </div>
  );

  if (checking || currentOrder.payment_status !== 'PAID') {
    const paymentNeedsAttention = currentOrder.payment_status === 'FAILED'
      || currentOrder.payment_status === 'REFUNDED'
      || currentOrder.status === 'CANCELLED';
    return (
      <div className="container" style={{ maxWidth: 760, padding: '64px 20px', textAlign: 'center' }}>
        <h1>{currentOrder.status === 'CANCELLED' ? 'Order cancelled' : paymentNeedsAttention ? 'Payment requires attention' : 'Payment submitted'}</h1>
        <p>{paymentNeedsAttention
          ? 'Payment confirmation needs review. Please contact support with your order number.'
          : 'Waiting for payment confirmation from the payment provider.'}</p>
        <p>Order number: <strong>{currentOrder.order_number}</strong></p>
        {timedOut && <p>Your payment is still being confirmed. Check your account order status again later.</p>}
        <Link to={`/account/orders/${currentOrder.id}`} className="btn-primary">View Order Status</Link>
      </div>
    );
  }

  const paidOrder = currentOrder;

  return (
    <div className={styles['order-success']}>
      <div className={styles['success-hero']}>
        <div className={styles['success-icon']}>🎊</div>
        <h1>Thank you for your order!</h1>
        <p>Yay! We've received your order and our team is getting it ready for your little one.</p>
        <div className={styles['order-info-badges']}>
          <div className={styles['info-badge']}><small>ORDER NUMBER</small><strong>{paidOrder.order_number}</strong></div>
          <div className={styles['info-badge']}><small>ESTIMATED DELIVERY</small><strong>5–7 Business Days</strong></div>
        </div>
      </div>
      <div className="container">
        <div className={styles['success-layout']}>
          <div className={`${styles['success-summary']} ${styles.card}`}>
            <h2>Order Summary <span>{paidOrder.items?.length} Items</span></h2>
            {paidOrder.items?.map((item, i) => (
              <div key={i} className={styles['success-item']}>
                <div>
                  <p>{item.product_name}</p>
                  <small>Color: {item.color} | Size: {item.size}</small>
                </div>
                <span>₹{parseFloat(item.subtotal).toLocaleString()}<br /><small>Qty: {item.quantity}</small></span>
              </div>
            ))}
            <div className={`${styles['success-shipping']} ${styles.card}`}>
              <div>
                <h3>🚚 Shipping Address</h3>
                <p>{paidOrder.full_name}</p>
                <p>{paidOrder.house_name}{paidOrder.street ? `, ${paidOrder.street}` : ''}</p>
                <p>{paidOrder.city}, {paidOrder.district}, {paidOrder.state}</p>
                <p>{paidOrder.pincode}</p>
              </div>
            </div>
          </div>
          <div className={`${styles['success-price']} ${styles.card}`}>
            <h2>Price Details</h2>
            <div className="summary-row"><span>Subtotal</span><span>₹{parseFloat(paidOrder.subtotal).toLocaleString()}</span></div>
            <div className="summary-row"><span>Shipping</span><span style={{ color: 'var(--success)' }}>₹{parseFloat(paidOrder.shipping_charge).toLocaleString()}</span></div>
            {parseFloat(paidOrder.discount) > 0 && (
              <div className="summary-row"><span>Discount</span><span style={{ color: 'var(--success)' }}>-₹{parseFloat(paidOrder.discount).toLocaleString()}</span></div>
            )}
            <div className="summary-total"><span>Total</span><span>₹{parseFloat(paidOrder.total_amount).toLocaleString()}</span></div>
            <Link to={`/account/orders/${paidOrder.id}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>📦 View Order Status</Link>
            <Link to="/shop" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Continue Shopping</Link>
            <div className={styles['eco-note']}>🌿 This order was packaged using 100% recyclable materials. Thank you for choosing sustainable baby wear!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
