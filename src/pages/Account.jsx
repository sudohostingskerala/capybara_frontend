import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { getOrders } from "../services/orderService";
import { getProducts } from "../services/productService";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
import styles from "./Account.module.css";

const navItems = [
  { path: "/account", label: "Dashboard", icon: "⊞" },
  { path: "/account/orders", label: "Recent Orders", icon: "📦" },
  { path: "/account/addresses", label: "Address Book", icon: "📍" },
  { path: "/account/wishlist", label: "My Wishlist", icon: "❤️" },
];

export default function Account() {
  const { user, logout, isAuthenticated } = useAuth();
  console.log("User data in Account.jsx:", user); // Debugging line
  const { wishlist } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [topPicks, setTopPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          getOrders().catch(() => ({ results: [] })),
          getProducts({ page_size: 4 }).catch(() => ({ results: [] })),
        ]);
        setOrders(ordersRes.results || ordersRes || []);
        setTopPicks(productsRes.results || productsRes || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const isRoot = location.pathname === "/account";
  const activeOrders = orders.filter((o) =>
    ["PENDING", "CONFIRMED", "PACKED", "SHIPPED"].includes(o.status),
  );

  return (
    <div className={`${styles["account-page"]} container`}>
      <nav className="breadcrumb">
        <a href="/">Home</a>
        <span className="sep">›</span>
        <span className="current">My Account</span>
      </nav>
      <div className={styles["account-layout"]}>
        {/* Sidebar */}
        <aside className={styles["account-sidebar"]}>
          <div className={styles["account-profile"]}>
            <div className={styles["account-avatar"]}>
              {user?.first_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <strong>{user?.first_name}</strong>
              <p>{user?.email}</p>
            </div>
          </div>
          <nav className={styles["account-nav"]}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles["account-nav-item"]} ${location.pathname === item.path ? styles.active : ""}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <button
              className={`${styles["account-nav-item"]} ${styles.logout}`}
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <span>🚪</span>Logout
            </button>
          </nav>
        </aside>
        {/* Content */}
        <main className={styles["account-content"]}>
          {isRoot ? (
            loading ? (
              <Spinner />
            ) : (
              <>
                {/* Stats */}
                <div className={styles["account-stats"]}>
                  <div className={styles["stat-card"]}>
                    <div className={styles["stat-icon"]}>🚚</div>
                    <div>
                      <h3>Active Orders</h3>
                      <p className={styles["stat-num"]}>
                        {activeOrders.length.toString().padStart(2, "0")}
                      </p>
                    </div>
                    <Link to="/account/orders" className={styles["stat-link"]}>
                      Track Packages
                    </Link>
                  </div>
                  <div className={styles["stat-card"]}>
                    <div className={styles["stat-icon"]}>📋</div>
                    <div>
                      <h3>Total Orders</h3>
                      <p className={styles["stat-num"]}>
                        {orders.length.toString().padStart(2, "0")}
                      </p>
                    </div>
                    <Link to="/account/orders" className={styles["stat-link"]}>
                      View History
                    </Link>
                  </div>
                  <div className={styles["stat-card"]}>
                    <div className={styles["stat-icon"]}>❤️</div>
                    <div>
                      <h3>Wishlist Items</h3>
                      <p className={styles["stat-num"]}>
                        {wishlist.length.toString().padStart(2, "0")}
                      </p>
                    </div>
                    <Link
                      to="/account/wishlist"
                      className={styles["stat-link"]}
                    >
                      Go to Wishlist
                    </Link>
                  </div>
                </div>
                {/* Recent Orders */}
                <div className={styles["account-section"]}>
                  <div className={styles["section-header"]}>
                    <h2>Recent Orders</h2>
                    <Link to="/account/orders" className={styles["view-all"]}>
                      View All
                    </Link>
                  </div>
                  {orders.slice(0, 3).map((o) => (
                    <div key={o.id} className={styles["recent-order-row"]}>
                      <span className={styles["order-icon"]}>📦</span>
                      <div>
                        <strong>#{o.order_number}</strong>
                        <span
                          style={{ color: "var(--accent)", marginLeft: "8px" }}
                        >
                          ₹{parseFloat(o.total_amount).toLocaleString()}
                        </span>
                        <p
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Ordered: {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`badge ${o.status === "DELIVERED" ? "badge-green" : o.status === "CANCELLED" ? "badge-red" : o.status === "SHIPPED" ? "badge-orange" : "badge-blue"}`}
                      >
                        {o.status}
                      </span>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p
                      style={{
                        color: "var(--text-muted)",
                        textAlign: "center",
                        padding: "20px",
                      }}
                    >
                      No orders yet.
                    </p>
                  )}
                </div>
                {topPicks.length > 0 && (
                  <div className={styles["account-section"]}>
                    <div className={styles["section-header"]}>
                      <h2>Top Picks For You</h2>
                    </div>

                    <div className={styles["top-picks-scroll"]}>
                      {topPicks.map((p) => (
                        <div className={styles["top-pick-card"]} key={p.id}>
                          <ProductCard product={p} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
