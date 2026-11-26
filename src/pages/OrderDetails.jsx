import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderDetail, cancelOrder } from '../services/orderService';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import Return from '../components/Return';
import styles from './OrderDetails.module.css';
import InvoiceDownloadButton from '../components/InvoiceDownloadButton';

const TIMELINE = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
const TIMELINE_LABELS = { PENDING: 'Order Placed', CONFIRMED: 'Confirmed', PACKED: 'Packed', SHIPPED: 'Shipped', DELIVERED: 'Delivered' };

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);


  useEffect(() => {
    getOrderDetail(id)
      .then(data => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;

  if (!order) return (
    <div className={styles['not-found']}>
      <h2>Order not found</h2>
      <Link to="/account/orders" className={`btn-primary ${styles['not-found-btn']}`}>Back to Orders</Link>
    </div>
  );

  const statusIdx = TIMELINE.indexOf(order.status);
  const canCancel = ['PENDING', 'CONFIRMED', 'PACKED'].includes(order.status);
  
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const updated = await cancelOrder(order.id);
      setOrder(updated);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };
  const handleReturn = () => {
    // Implement return order logic here
    // toast('Return order functionality is not implemented yet.');
    setShowReturnModal(true);
  }

  return (
    <div>
      <div className={styles['top-bar']}>
        <div>
          <nav className="breadcrumb" style={{ padding: '0 0 8px' }}><Link to="/account">Account</Link><span className="sep">›</span><Link to="/account/orders">Orders</Link><span className="sep">›</span><span className="current">#{order.order_number}</span></nav>
          <h2>Order Details</h2>
          <p className={styles['sub-date']}>Placed on {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <div className={styles.actions}>
          <InvoiceDownloadButton order={order} />
          {canCancel && (
            <button className={`btn-secondary ${styles['action-btn']}`} onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : '✕ Cancel Order'}
            </button>
          )}
          {order.status === 'DELIVERED' && (
            <button className={`btn-secondary ${styles['action-btn']}`} onClick={handleReturn}>
              {' Return Order'}
            </button>
          )}
        </div>
      </div>
      <div className={styles.grid}>
        <div>
          {/* Items */}
          <div className={styles.card}>
            <h3>Items Purchased ({order.items?.length || 0})</h3>
            {order.items?.map((item, i) => (
              <div key={i} className={styles['item-row']}>
                <div className={styles['item-info']}>
                  <p>{item.product_name}</p>
                  <span className={styles['item-meta']}>Color: {item.color} • Size: {item.size}</span>
                  <span className={styles['item-meta']}>Qty: {item.quantity}</span>
                </div>
                <span className={styles['item-price']}>₹{parseFloat(item.subtotal).toLocaleString()}</span>
              </div>
            ))}
          </div>
          {/* Shipping & Payment */}
          <div className={styles['info-grid']}>
            <div className={styles['info-card']}>
              <h3>🚚 Shipping Address</h3>
              <p>
                {order.full_name}<br />
                {order.house_name}{order.street ? `, ${order.street}` : ''}<br />
                {order.city}, {order.district}<br />
                {order.state} — {order.pincode}
              </p>
            </div>
            <div className={styles['info-card']}>
              <h3>💳 Payment</h3>
              <p>Status: {order.payment_status}</p>
            </div>
          </div>
        </div>
        <Return
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          orderNumber={order.order_number}
        />
        {/* Right Panel */}
        <div>
          {/* Order Status */}
          {order.status !== 'CANCELLED' && (
            <div className={styles['sidebar-card']}>
              <div className={styles['status-header']}>
                <h3>Order Status</h3>
                <span className={`badge ${order.status === 'DELIVERED' ? 'badge-green' : order.status === 'SHIPPED' ? 'badge-orange' : 'badge-blue'}`}>{order.status}</span>
              </div>
              <div className={styles['order-timeline']}>
                {TIMELINE.map((step, i) => (
                  <div key={step} className={`${styles['timeline-step']} ${i <= statusIdx ? styles.done : ''}`}>
                    <div className={styles['timeline-dot']} />
                    <div className={styles['timeline-content']}><strong>{TIMELINE_LABELS[step]}</strong>{i <= statusIdx && <p className={styles['timeline-completed']}>Completed</p>}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {order.status === 'CANCELLED' && (
            <div className={styles['cancelled-card']}>
              <p style={{ fontSize: '1.5rem', marginBottom: '8px' }}>❌</p>
              <h3>Order Cancelled</h3>
            </div>
          )}
          {/* Summary */}
          <div className={styles['summary-card']}>
            <h3>Order Summary</h3>
            <div className="summary-row"><span>Subtotal</span><span>₹{parseFloat(order.subtotal).toLocaleString()}</span></div>
            <div className="summary-row"><span>Shipping</span><span>₹{parseFloat(order.shipping_charge).toLocaleString()}</span></div>
            {parseFloat(order.discount) > 0 && (
              <div className="summary-row"><span>Discount</span><span style={{ color: 'var(--success)' }}>-₹{parseFloat(order.discount).toLocaleString()}</span></div>
            )}
            <div className="summary-total"><span>Total Paid</span><span>₹{parseFloat(order.total_amount).toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
