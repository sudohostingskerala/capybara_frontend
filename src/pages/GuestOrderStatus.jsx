import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGuestOrderStatus, getSavedGuestOrder } from "../services/orderService";
import Spinner from "../components/Spinner";

const POLL_INTERVAL_MS = 2500;
const MAX_ATTEMPTS = 40;

export default function GuestOrderStatus() {
  const [saved] = useState(() => getSavedGuestOrder());
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(saved));
  const [message, setMessage] = useState("");
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!saved?.orderId || !saved?.token) {
      return undefined;
    }

    let active = true;
    let timer;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const current = await getGuestOrderStatus(saved.orderId, saved.token);
        if (!active) return;
        setOrder(current);
        setLoading(false);
        const terminal = current.payment_status === "PAID"
          || current.payment_status === "FAILED"
          || current.payment_status === "REFUNDED"
          || current.status === "CANCELLED";
        if (terminal) return;
      } catch (error) {
        if (!active) return;
        if ([400, 401, 403, 404].includes(error.response?.status)) {
          setMessage("Guest order access is unavailable or invalid. Please contact support with your order details.");
          setLoading(false);
          return;
        }
        setLoading(false);
      }

      attempts += 1;
      if (attempts >= MAX_ATTEMPTS) {
        if (active) setTimedOut(true);
        return;
      }
      timer = window.setTimeout(checkStatus, POLL_INTERVAL_MS);
    };

    checkStatus();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [saved]);

  const paymentStatus = order?.payment_status;
  const isPaid = paymentStatus === "PAID";
  const isFailed = paymentStatus === "FAILED";
  const isRefunded = paymentStatus === "REFUNDED";
  const isCancelled = order?.status === "CANCELLED";

  return (
    <div className="container" style={{ maxWidth: 760, padding: "64px 20px", textAlign: "center" }}>
      {loading && <Spinner />}
      {!loading && !saved && <><h1>Order status unavailable</h1><p>We could not find saved guest order access on this device.</p></>}
      {!loading && message && <><h1>Order status unavailable</h1><p>{message}</p></>}
      {!loading && !message && order && (
        <>
          <h1>{isPaid ? "Payment confirmed" : isRefunded ? "Payment refunded" : isFailed ? "Payment failed" : isCancelled ? "Order cancelled" : "Payment submitted"}</h1>
          <p>
            {isPaid
              ? "Your payment has been confirmed and your order is being processed."
              : isCancelled && paymentStatus === "PENDING"
                ? "This order was cancelled while payment confirmation was pending. Please contact support with your order number to reconcile the payment."
              : isRefunded
                ? "This payment was refunded. Contact support if you need more information."
                : isFailed
                  ? "The payment was not completed. Please contact support if you believe this is incorrect."
                  : "Waiting for payment confirmation from the payment provider."}
          </p>
          <p><strong>Order number:</strong> {order.order_number}</p>
          <p><strong>Order status:</strong> {order.status} · <strong>Payment status:</strong> {paymentStatus}</p>
          {timedOut && !isPaid && !isCancelled && !isFailed && !isRefunded && (
            <p>Your payment is still being confirmed. You can check this page again later.</p>
          )}
          {order.items?.length > 0 && (
            <div style={{ margin: "24px auto", maxWidth: 500, textAlign: "left" }}>
              {order.items.map((item) => <p key={item.id}>{item.product_name} · Qty {item.quantity}</p>)}
            </div>
          )}
        </>
      )}
      <Link to="/shop" className="btn-secondary" style={{ display: "inline-flex", marginTop: 20 }}>Continue Shopping</Link>
    </div>
  );
}
