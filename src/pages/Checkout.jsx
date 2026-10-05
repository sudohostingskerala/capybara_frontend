import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getAddresses, createAddress } from "../services/addressService";
import {
  createOrder,
  buyNow,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createGuestBuyNowOrder,
  saveGuestOrder,
} from "../services/orderService";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import styles from "./Checkout.module.css";

export default function Checkout() {
  const { cartItems, totalAmount, fetchCart, clearCartLocal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowData = location.state?.buyNow ? location.state : null;
  const guestCheckout = location.pathname === "/guest-checkout";

  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [loading, setLoading] = useState(!guestCheckout);
  const [placing, setPlacing] = useState(false);
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
      if (!buyNowData?.product_variant || !buyNowData?.quantity) {
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
    } catch (err) {
      toast.error("Failed to save address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddr) {
      toast.error("Please select a shipping address");
      return;
    }
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
        clearCartLocal();
        fetchCart();
      }
      const razorpayOrder = await createRazorpayOrder(order.id);
      const options = {
        key: razorpayOrder.key_id, // Enter the Key ID generated from the Dashboard
        amount: razorpayOrder.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        currency: razorpayOrder.currency,
        name: "Capybara",
        description: "Order Payment",
        order_id: razorpayOrder.razorpay_order_id, //This is a sample Order ID. Pass the `id` obtained in the response of createOrder().
        handler: async function (response) {
          try {
            await verifyRazorpayPayment(order.id, response);
            navigate("/order-success", { state: { order } });
          } catch {
            navigate("/order-success", { state: { order } });
          }
        },
        modal: {
          ondismiss: function () {
            // The order remains pending until Razorpay's signed webhook arrives.
          },
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#3399cc",
        },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      // toast.success('Order placed successfully!');
      // navigate('/order-success', { state: { order } });
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to place order";
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  const handleGuestCheckout = async (event) => {
    event.preventDefault();
    if (!buyNowData?.product_variant || !buyNowData?.quantity) {
      toast.error("Please select a product before continuing.");
      navigate("/shop", { replace: true });
      return;
    }
    setPlacing(true);
    let localOrder = null;
    try {
      const order = await createGuestBuyNowOrder({
        ...guestDetails,
        product_variant: buyNowData.product_variant,
        quantity: buyNowData.quantity,
      });
      localOrder = order;
      const token = order.guest_access_token;
      if (!order.id || !token) throw new Error("Guest order credentials were not returned.");
      saveGuestOrder(order.id, token);
      const razorpayOrder = await createRazorpayOrder(order.id, token);
      const checkout = new window.Razorpay({
        key: razorpayOrder.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Capybara",
        description: "Order Payment",
        order_id: razorpayOrder.razorpay_order_id,
        prefill: {
          name: guestDetails.full_name,
          email: guestDetails.email,
          contact: guestDetails.phone_number,
        },
        theme: { color: "#3399cc" },
        handler: async (response) => {
          // LOCAL DEBUG ONLY: remove after capturing the Razorpay TEST response.
          if (
            import.meta.env.DEV &&
            ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
            razorpayOrder.key_id?.startsWith("rzp_test_")
          ) {
            console.info("Local Razorpay TEST checkout response", {
              razorpay_payment_id: response?.razorpay_payment_id,
              razorpay_order_id: response?.razorpay_order_id,
              razorpay_signature: response?.razorpay_signature,
            });
          }
          try {
            await verifyRazorpayPayment(order.id, {
              ...response,
              guest_access_token: token,
            });
          } catch {
            // The signed backend webhook remains authoritative even if this call fails.
          }
          navigate("/guest-order-status", { state: { paymentSubmitted: true } });
        },
        modal: {
          ondismiss: () => navigate("/guest-order-status"),
        },
      });
      checkout.open();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || "Unable to start checkout.");
      if (localOrder?.id) navigate("/guest-order-status");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <Spinner />;

  if (guestCheckout && (!buyNowData?.product_variant || !buyNowData?.quantity)) {
    return <div className="container" style={{ padding: "48px 20px", textAlign: "center" }}>Returning to the shop…</div>;
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
            <p>{buyNowData.productName}</p>
            <p>{buyNowData.color} • {buyNowData.size} · Qty: {buyNowData.quantity}</p>
            <div className="summary-total">₹{(Number(buyNowData.price) * buyNowData.quantity).toLocaleString()}</div>
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
