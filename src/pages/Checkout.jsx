import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getAddresses, createAddress } from "../services/addressService";
import {
  createOrder,
  buyNow,
  createRazorpayOrder,
  cancelRazorpayAttempt,
  verifyRazorpayPayment,
  createGuestBuyNowOrder,
  createGuestCartOrder,
  saveGuestOrder,
  getOrderDetail,
  getGuestOrderStatus,
  updateOrderDeliveryAddress,
} from "../services/orderService";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import { clearGuestCartToken } from "../services/guestCartToken";
import styles from "./Checkout.module.css";
import { isCompleteOrderSummary, sameOrderSummary, verifyUpdatedOrderSummary, paymentAmountMatchesSummary, acquireSubmissionLock, checkoutErrorMessage, checkoutReviewPath } from "../utils/checkoutOrder";

const inr = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));

function SummaryRow({ label, value, strong = false }) {
  return <div className={`${styles["review-row"]} ${strong ? styles["review-total"] : ""}`}>
    <span>{label}</span><strong>{value}</strong>
  </div>;
}

export default function Checkout() {
  const { cartItems, totalAmount, fetchCart, clearCartLocal, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowData = location.state?.buyNow ? location.state : null;
  const guestCheckout = location.pathname.startsWith("/guest-checkout");
  const guestCartCheckout = guestCheckout && !buyNowData;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [loading, setLoading] = useState(!guestCheckout && !location.state?.reviewOrder);
  const [placing, setPlacing] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(location.state?.reviewOrder || null);
  const [reviewGuestToken, setReviewGuestToken] = useState(location.state?.reviewGuestToken || null);
  const [paymentStarting, setPaymentStarting] = useState(false);
  const [editingReviewAddress, setEditingReviewAddress] = useState(false);
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const paymentLock = useRef(false);
  const orderCreationLock = useRef(false);
  const addressUpdateLock = useRef(false);
  const cancellationLock = useRef(false);
  const paymentSucceeded = useRef(false);
  const [paymentNeedsVerification, setPaymentNeedsVerification] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [reviewAddress, setReviewAddress] = useState(null);
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({
    full_name: "",
    phone_number: "",
    house_name: "",
    street: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    address_type: "HOME",
  });
  const [guestDetails, setGuestDetails] = useState({
    full_name: "", email: "", phone_number: "", house_name: "", street: "",
    landmark: "", city: "", district: "", state: "", pincode: "",
  });

  useEffect(() => {
    if (guestCheckout) {
      if (buyNowData && (!buyNowData.product_variant || !buyNowData.quantity)) {
        navigate("/shop", { replace: true });
        return;
      }
      return;
    }
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location }, replace: true });
      return;
    }
    getAddresses()
      .then((data) => {
        const list = data.results || data || [];
        setAddresses(list);
        const def = list.find((a) => a.is_default) || list[0];
        if (def) setSelectedAddr(def.id);
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, guestCheckout, buyNowData, location]);

  const handleNewAddress = async (e) => {
    e.preventDefault();
    try {
      const created = await createAddress(newAddr);
      setAddresses((prev) => [...prev, created]);
      setSelectedAddr(created.id);
      setShowNewAddr(false);
      toast.success("Address added!");
    } catch {
      toast.error("Failed to save address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddr) {
      toast.error("Please select a shipping address");
      return;
    }
    if (placing || reviewOrder || !acquireSubmissionLock(orderCreationLock)) return;
    setPlacing(true);
    try {
      let order;
      if (buyNowData) {
        order = await buyNow(
          selectedAddr,
          buyNowData.variantId,
          buyNowData.quantity,
        );
      } else {
        order = await createOrder(selectedAddr);
      }
      const persistedOrder = await getOrderDetail(order.id);
      if (!isCompleteOrderSummary(persistedOrder)) throw new Error("The server did not return a complete order summary. Please retry.");
      setReviewOrder(persistedOrder);
      setReviewGuestToken(null);
      navigate(checkoutReviewPath(false), {
        state: { reviewOrder: persistedOrder, buyNow: Boolean(buyNowData), ...(buyNowData || {}) },
      });
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to prepare order review";
      toast.error(msg);
    } finally {
      orderCreationLock.current = false;
      setPlacing(false);
    }
  };

  const startPayment = async () => {
    if (!reviewOrder || !acquireSubmissionLock(paymentLock)) return;
    setPaymentStarting(true);
    paymentSucceeded.current = false;
    cancellationLock.current = false;
    let razorpayOpened = false;
    try {
      const latest = reviewGuestToken
        ? await getGuestOrderStatus(reviewOrder.id, reviewGuestToken)
        : await getOrderDetail(reviewOrder.id);
      if (!isCompleteOrderSummary(latest)) throw new Error("The latest persisted order summary could not be verified. Please retry.");
      if (!sameOrderSummary(reviewOrder, latest)) {
        setReviewOrder(latest);
        toast.error("Your order details changed. Review the updated total before paying.");
        return;
      }
      const razorpayOrder = await createRazorpayOrder(reviewOrder.id, reviewGuestToken);
      if (!isCompleteOrderSummary(razorpayOrder.summary)) {
        toast.error("Payment service did not return the persisted order summary. Please retry after refreshing the review.");
        return;
      }
      if (!sameOrderSummary(latest, razorpayOrder.summary)) {
        setReviewOrder(razorpayOrder.summary);
        toast.error("The order changed before payment. Review the refreshed totals before continuing.");
        return;
      }
      if (!paymentAmountMatchesSummary(razorpayOrder.amount, latest)) {
        setReviewOrder(razorpayOrder.summary);
        toast.error("The payable amount changed. Please review the updated order.");
        return;
      }
      const options = {
        key: razorpayOrder.key_id, // Enter the Key ID generated from the Dashboard
        amount: razorpayOrder.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        currency: razorpayOrder.currency,
        name: "Capybara",
        description: "Order Payment",
        order_id: razorpayOrder.razorpay_order_id, //This is a sample Order ID. Pass the `id` obtained in the response of createOrder().
        handler: async function (response) {
          try {
            paymentSucceeded.current = true;
            await verifyRazorpayPayment(reviewOrder.id, reviewGuestToken
              ? { ...response, guest_access_token: reviewGuestToken }
              : response);
            clearCartLocal();
            fetchCart();
            if (reviewGuestToken && guestCartCheckout) clearGuestCartToken();
            if (reviewGuestToken) navigate("/guest-order-status", { state: { paymentSubmitted: true } });
            else navigate("/order-success", { state: { order: reviewOrder } });
          } catch {
            if (reviewGuestToken) navigate("/guest-order-status", { state: { paymentSubmitted: true } });
            else navigate("/order-success", { state: { order: reviewOrder } });
          }
        },
        modal: {
          ondismiss: async function () {
            if (paymentSucceeded.current || cancellationLock.current) return;
            cancellationLock.current = true;
            try {
              const result = await cancelRazorpayAttempt(reviewOrder.id, reviewGuestToken);
              if (result.order) setReviewOrder(result.order);
              if (result.cancellation_confirmed) {
                setPaymentNeedsVerification(false);
                setPaymentMessage("Payment was cancelled and the order was cancelled. You can start checkout again.");
                toast.success("Payment was cancelled. Your order reservation has been released.");
              } else {
                setPaymentNeedsVerification(true);
                setPaymentMessage("Payment status is being verified. Please wait before trying again.");
                toast("Payment status is being verified. Please wait before trying again.");
              }
            } catch (error) {
              const result = error.response?.data;
              if (result?.order) setReviewOrder(result.order);
              setPaymentNeedsVerification(true);
              const message = result?.order?.payment_status === "PAID"
                ? "Payment is confirmed. Check your order status for the latest update."
                : result?.detail || "We could not confirm the payment outcome. Please check your order status before trying again.";
              setPaymentMessage(message);
              toast(message);
            } finally {
              paymentLock.current = false;
              setPaymentStarting(false);
            }
          },
        },
        prefill: {
          name: reviewOrder.full_name || "",
          email: reviewOrder.email || "",
          contact: reviewOrder.phone_number || "",
        },
        theme: {
          color: "#3399cc",
        },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      razorpayOpened = true;
      // Keep the cart available until payment success; a dismissed modal is not a failure.
    } catch (err) {
      paymentLock.current = false;
      toast.error(!err.response && err.message !== "Network Error" ? err.message : checkoutErrorMessage(err, "payment"));
    } finally {
      if (!razorpayOpened) {
        paymentLock.current = false;
        setPaymentStarting(false);
      }
    }
  };

  const beginAddressEdit = () => {
    const fields = ["full_name", "email", "phone_number", "house_name", "street", "landmark", "city", "district", "state", "pincode"];
    setReviewAddress(Object.fromEntries(fields.map((field) => [field, reviewOrder[field] || ""])));
    if (!reviewGuestToken) {
      const current = addresses.find((address) => address.full_name === reviewOrder.full_name && address.pincode === reviewOrder.pincode && address.house_name === reviewOrder.house_name);
      if (current) setSelectedAddr(current.id);
    }
    setEditingReviewAddress(true);
  };

  const submitAddressUpdate = async (event) => {
    event.preventDefault();
    if (!reviewOrder || !acquireSubmissionLock(addressUpdateLock)) return;
    setUpdatingAddress(true);
    try {
      let payload;
      if (reviewGuestToken) payload = reviewAddress;
      else if (reviewAddress?.createNew) {
        const addressPayload = Object.fromEntries(Object.entries(reviewAddress).filter(([field]) => !["createNew", "email"].includes(field)));
        const savedAddress = await createAddress(addressPayload);
        payload = { address_id: savedAddress.id };
      } else payload = { address_id: selectedAddr };
      if (!reviewGuestToken && !payload.address_id) throw new Error("Select a saved delivery address or add a new one first.");
      const updated = await updateOrderDeliveryAddress(reviewOrder.id, payload, reviewGuestToken);
      const verifiedSummary = verifyUpdatedOrderSummary(reviewOrder, updated);
      setReviewOrder(verifiedSummary);
      setEditingReviewAddress(false);
      toast.success("Delivery address and order totals updated.");
    } catch (error) {
      toast.error(error.message && !error.response ? error.message : checkoutErrorMessage(error, "address"));
    } finally {
      addressUpdateLock.current = false;
      setUpdatingAddress(false);
    }
  };

  const handleGuestCheckout = async (event) => {
    event.preventDefault();
    if (buyNowData && (!buyNowData.product_variant || !buyNowData.quantity)) {
      toast.error("Please select a product before continuing.");
      navigate("/shop", { replace: true });
      return;
    }
    if (placing || reviewOrder || !acquireSubmissionLock(orderCreationLock)) return;
    setPlacing(true);
    try {
      const order = buyNowData
        ? await createGuestBuyNowOrder({
            ...guestDetails,
            product_variant: buyNowData.product_variant,
            quantity: buyNowData.quantity,
          })
        : await createGuestCartOrder(guestDetails);
      const token = order.guest_access_token;
      if (!order.id || !token) throw new Error("Guest order credentials were not returned.");
      saveGuestOrder(order.id, token);
      const persistedOrder = await getGuestOrderStatus(order.id, token);
      if (!isCompleteOrderSummary(persistedOrder)) throw new Error("The server did not return a complete order summary. Please retry.");
      setReviewOrder(persistedOrder);
      setReviewGuestToken(token);
      navigate(checkoutReviewPath(true), {
        state: { reviewOrder: persistedOrder, reviewGuestToken: token, ...(buyNowData || {}) },
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || "Unable to start checkout.");
    } finally {
      orderCreationLock.current = false;
      setPlacing(false);
    }
  };

  if (loading || (guestCartCheckout && cartLoading)) return <Spinner />;

  if (guestCheckout && buyNowData && (!buyNowData.product_variant || !buyNowData.quantity)) {
    return <div className="container" style={{ padding: "48px 20px", textAlign: "center" }}>Returning to the shop…</div>;
  }

  if (reviewOrder) {
    const itemTaxes = reviewOrder.items || [];
    const cgst = itemTaxes.reduce((sum, item) => sum + Number(item.cgst_amount || 0), 0);
    const sgst = itemTaxes.reduce((sum, item) => sum + Number(item.sgst_amount || 0), 0);
    const igst = itemTaxes.reduce((sum, item) => sum + Number(item.igst_amount || 0), 0);
    return <main className={`${styles["checkout-page"]} container`}>
      <h1>Review Order &amp; Confirm</h1>
      {paymentMessage && <p role="status">{paymentMessage}</p>}
      {paymentNeedsVerification && <p role="status">Do not retry payment until the order status is confirmed.</p>}
      {reviewOrder.status === "CANCELLED" && !paymentMessage && <p role="status">This order was cancelled. Start checkout again to create a new order.</p>}
      <div className={styles["review-layout"]}>
        <section className={styles["checkout-form"]}>
          <h2>Items</h2>
          {itemTaxes.map((item) => <article className={styles["review-item"]} key={item.id}>
            <div><strong>{item.product_name}</strong><p>{item.size} · {item.color} · Qty {item.quantity}</p>
              <p>₹{item.unit_price} each · Taxable value {inr(item.taxable_value)} · GST {(Number(item.gst_rate) * 100).toFixed(0)}%</p></div>
            <span>{inr(item.taxable_value)}</span>
          </article>)}
          <h2>Delivery address</h2>
          <p>{reviewOrder.full_name}<br />{reviewOrder.house_name}{reviewOrder.street ? `, ${reviewOrder.street}` : ""}<br />{reviewOrder.city}, {reviewOrder.district}, {reviewOrder.state} — {reviewOrder.pincode}<br />{reviewOrder.phone_number}</p>
          {!editingReviewAddress ? <button type="button" className="btn-secondary" onClick={beginAddressEdit} disabled={paymentStarting}>Edit address</button> : <form className={styles["address-edit-form"]} onSubmit={submitAddressUpdate}>
            <h3>Edit delivery address</h3>
            {reviewGuestToken ? <>
              {[["full_name", "Full name"], ["email", "Email"], ["phone_number", "Phone"], ["house_name", "House / Building"], ["street", "Street"], ["landmark", "Landmark"], ["city", "City"], ["district", "District"], ["state", "State"], ["pincode", "PIN code"]].map(([field, label]) => <div className="form-group" key={field}>
                <label htmlFor={`review-${field}`}>{label}</label>
                <input id={`review-${field}`} required={!(["street", "landmark"].includes(field))} type={field === "email" ? "email" : "text"} value={reviewAddress?.[field] || ""} onChange={(event) => setReviewAddress((current) => ({ ...current, [field]: event.target.value }))} />
              </div>)}
            </> : <>
              <div className={styles["address-list"]}>{addresses.map((address) => <label key={address.id} className={`${styles["address-option"]} ${selectedAddr === address.id ? styles.selected : ""}`}>
                <input type="radio" name="review-address" checked={selectedAddr === address.id} onChange={() => { setSelectedAddr(address.id); setReviewAddress((current) => ({ ...current, createNew: false })); }} />
                <span><strong>{address.full_name}</strong><br />{address.house_name}, {address.city}, {address.district}, {address.state} — {address.pincode}</span>
              </label>)}</div>
              <button type="button" className="btn-secondary" onClick={() => { setReviewAddress({ ...newAddr, createNew: true }); setSelectedAddr(null); }}>+ Add a different address</button>
              {reviewAddress?.createNew && [["full_name", "Full name"], ["phone_number", "Phone"], ["house_name", "House / Building"], ["street", "Street"], ["landmark", "Landmark"], ["city", "City"], ["district", "District"], ["state", "State"], ["pincode", "PIN code"]].map(([field, label]) => <div className="form-group" key={field}>
                <label htmlFor={`review-${field}`}>{label}</label>
                <input id={`review-${field}`} required={!(["street", "landmark"].includes(field))} value={reviewAddress?.[field] || ""} onChange={(event) => setReviewAddress((current) => ({ ...current, [field]: event.target.value }))} />
              </div>)}
            </>}
            <button className={`btn-accent ${styles["checkout-continue"]}`} disabled={updatingAddress}>{updatingAddress ? "Recalculating order…" : "Save address & refresh totals"}</button>
            <button type="button" className={`btn-secondary ${styles["checkout-continue"]}`} onClick={() => setEditingReviewAddress(false)} disabled={updatingAddress}>Cancel</button>
          </form>}
        </section>
        <aside className={styles["checkout-summary"]}>
          <h2>Payment summary</h2>
          <SummaryRow label="Taxable value" value={inr(reviewOrder.subtotal)} />
          {Number(reviewOrder.discount) > 0 && <SummaryRow label="Discount" value={`−${inr(reviewOrder.discount)}`} />}
          <SummaryRow label="Shipping" value={inr(reviewOrder.shipping_charge)} />
          <SummaryRow label="CGST" value={inr(cgst)} />
          <SummaryRow label="SGST" value={inr(sgst)} />
          <SummaryRow label="IGST" value={inr(igst)} />
          <SummaryRow label="GST total" value={inr(reviewOrder.gst_total)} />
          <SummaryRow label="Final payable" value={inr(reviewOrder.total_amount)} strong />
          <button className={`btn-accent ${styles["checkout-continue"]}`} onClick={startPayment} disabled={paymentStarting || paymentNeedsVerification || reviewOrder.status === "CANCELLED"}>
            {paymentStarting ? "Checking order…" : `Confirm & Pay ${inr(reviewOrder.total_amount)}`}
          </button>
        </aside>
      </div>
    </main>;
  }

  if (guestCheckout) {
    const fields = [
      ["full_name", "Full Name", true], ["email", "Email", true, "email"],
      ["phone_number", "Phone Number", true, "tel"], ["house_name", "House / Building", true],
      ["street", "Street", false], ["landmark", "Landmark", false],
      ["city", "City", true], ["district", "District", true],
      ["state", "State", true], ["pincode", "PIN Code", true],
    ];
    return (
      <div className={`${styles["checkout-page"]} container`}>
        <h1>Guest Checkout</h1>
        <div className={styles["checkout-layout"]}>
          <form className={styles["checkout-form"]} onSubmit={handleGuestCheckout}>
            <h2>Contact and Shipping Details</h2>
            {fields.map(([name, label, required, type]) => (
              <div className="form-group" key={name}>
                <label htmlFor={`guest-${name}`}>{label}</label>
                <input
                  id={`guest-${name}`}
                  name={name}
                  type={type || "text"}
                  required={required}
                  value={guestDetails[name]}
                  onChange={(event) => setGuestDetails((current) => ({ ...current, [name]: event.target.value }))}
                />
              </div>
            ))}
            <button className={`btn-accent ${styles["checkout-continue"]}`} disabled={placing}>
              {placing ? "Preparing Payment..." : "Continue to Payment"}
            </button>
          </form>
          <div className={styles["checkout-summary"]}>
            <h2>Order Summary</h2>
            {guestCartCheckout ? cartItems.map((item) => (
              <p key={item.id}>{item.product_name} · Qty: {item.quantity}</p>
            )) : <>
              <p>{buyNowData.productName}</p>
              <p>{buyNowData.color} • {buyNowData.size} · Qty: {buyNowData.quantity}</p>
            </>}
            <div className="summary-total">₹{(guestCartCheckout ? totalAmount : Number(buyNowData.price) * buyNowData.quantity).toLocaleString()}</div>
          </div>
        </div>
      </div>
    );
  }

  const items = buyNowData
    ? [
        {
          product_name: buyNowData.productName,
          color: buyNowData.color,
          size: buyNowData.size,
          quantity: buyNowData.quantity,
          unit_price: buyNowData.price,
          image: buyNowData.image,
        },
      ]
    : cartItems;

  return (
    <div className={`${styles["checkout-page"]} container`}>
      <h1>Checkout</h1>
      <div className={styles["checkout-layout"]}>
        <div className={styles["checkout-form"]}>
          <h2>Select Shipping Address</h2>
          {addresses.length === 0 && !showNewAddr && (
            <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
              No saved addresses. Add one below.
            </p>
          )}
          <div className={styles["address-list"]}>
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`${styles["address-option"]} ${selectedAddr === addr.id ? styles.selected : ""}`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddr === addr.id}
                  onChange={() => setSelectedAddr(addr.id)}
                />
                <div>
                  <strong>{addr.full_name}</strong>
                  {addr.is_default && (
                    <span
                      className="badge badge-brown"
                      style={{ marginLeft: "8px", fontSize: "0.65rem" }}
                    >
                      DEFAULT
                    </span>
                  )}
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      lineHeight: "1.6",
                    }}
                  >
                    {addr.house_name}, {addr.street && `${addr.street}, `}
                    {addr.city}, {addr.district}
                    <br />
                    {addr.state} — {addr.pincode}
                    <br />
                    📞 {addr.phone_number}
                  </p>
                </div>
              </label>
            ))}
          </div>
          {!showNewAddr ? (
            <button
              className="btn-secondary"
              style={{ marginTop: "16px" }}
              onClick={() => setShowNewAddr(true)}
            >
              + Add New Address
            </button>
          ) : (
            <form onSubmit={handleNewAddress} style={{ marginTop: "20px" }}>
              <h3 style={{ marginBottom: "16px" }}>New Address</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    required
                    value={newAddr.full_name}
                    onChange={(e) =>
                      setNewAddr((f) => ({ ...f, full_name: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    required
                    value={newAddr.phone_number}
                    onChange={(e) =>
                      setNewAddr((f) => ({
                        ...f,
                        phone_number: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>House / Building</label>
                <input
                  required
                  value={newAddr.house_name}
                  onChange={(e) =>
                    setNewAddr((f) => ({ ...f, house_name: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Street</label>
                <input
                  value={newAddr.street}
                  onChange={(e) =>
                    setNewAddr((f) => ({ ...f, street: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Landmark</label>
                <input
                  value={newAddr.landmark}
                  onChange={(e) =>
                    setNewAddr((f) => ({ ...f, landmark: e.target.value }))
                  }
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    required
                    value={newAddr.city}
                    onChange={(e) =>
                      setNewAddr((f) => ({ ...f, city: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>District</label>
                  <input
                    required
                    value={newAddr.district}
                    onChange={(e) =>
                      setNewAddr((f) => ({ ...f, district: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>State</label>
                  <input
                    required
                    value={newAddr.state}
                    onChange={(e) =>
                      setNewAddr((f) => ({ ...f, state: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>PIN Code</label>
                  <input
                    required
                    value={newAddr.pincode}
                    onChange={(e) =>
                      setNewAddr((f) => ({ ...f, pincode: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button type="submit" className="btn-primary">
                  Save Address
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewAddr(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          <button
            className={`btn-accent ${styles["checkout-continue"]}`}
            style={{ marginTop: "24px" }}
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? "Placing Order..." : "Place Order"}
          </button>
        </div>
        {/* Order Summary Sidebar */}
        <div className={styles["checkout-summary"]}>
          <h2>Order Summary</h2>
          {items.map((item, i) => (
            <div key={i} className={styles["checkout-item"]}>
              {item.image && <img src={item.image} alt={item.product_name} />}
              <div>
                <p>{item.product_name}</p>
                <small>
                  {item.color} • {item.size}
                </small>
                <p>Qty: {item.quantity}</p>
              </div>
              <span>
                ₹
                {(parseFloat(item.unit_price) * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
          <div className={styles["checkout-totals"]}>
            <div className="summary-total">
              <span>Total</span>
              <span>
                ₹
                {buyNowData
                  ? (
                      parseFloat(buyNowData.price) * buyNowData.quantity
                    ).toLocaleString()
                  : totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className={styles["secure-note"]}>
            🔒 Secure Checkout — Your order is encrypted and securely processed.
          </div>
        </div>
      </div>
    </div>
  );
}
