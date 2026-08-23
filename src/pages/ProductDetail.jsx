import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getProductBySlug, getProducts } from "../services/productService";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../services/reviewService";
import { addToWishlist } from "../services/wishlistService";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import StarRating from "../components/StarRating";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";
import styles from "./ProductDetail.module.css";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selColor, setSelColor] = useState("");
  const [selSize, setSelSize] = useState("");
  const [selImg, setSelImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("description");
  const [adding, setAdding] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await getProductBySlug(slug);
        setProduct(data);

        // Fetch reviews
        if (data.id) {
          getProductReviews(data.id)
            .then((res) => setReviews(res.results || res || []))
            .catch(() => setReviews([]));
        }

        // Fetch related
        if (data.variants?.[0]) {
          getProducts({ page_size: 4 })
            .then((res) => {
              const items = (res.results || res || []).filter(
                (p) => p.slug !== slug,
              );
              setRelated(items.slice(0, 4));
            })
            .catch(() => setRelated([]));
        }
      } catch (err) {
        console.error("Product not found", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    setSelColor("");
    setSelSize("");
    setSelImg(0);
    setQty(1);
  }, [slug]);

  // Derive unique colors and sizes from variants
  const uniqueColors = useMemo(() => {
    if (!product?.variants) return [];
    const map = new Map();
    product.variants.forEach((v) => {
      if (v.color && !map.has(v.color.name)) map.set(v.color.name, v.color);
    });
    return Array.from(map.values());
  }, [product]);

  const uniqueSizes = useMemo(() => {
    if (!product?.variants) return [];
    const filtered = selColor
      ? product.variants.filter((v) => v.color?.name === selColor)
      : product.variants;
    const map = new Map();
    filtered.forEach((v) => {
      if (v.size && !map.has(v.size.name)) map.set(v.size.name, v.size);
    });
    return Array.from(map.values());
  }, [product, selColor]);

  // Find selected variant
  const selectedVariant = useMemo(() => {
    if (!product?.variants || !selColor || !selSize) return null;
    return (
      product.variants.find(
        (v) => v.color?.name === selColor && v.size?.name === selSize,
      ) || null
    );
  }, [product, selColor, selSize]);

  // Images for selected variant or first variant
  // const images = useMemo(() => {
  //   if (selectedVariant?.images?.length) return selectedVariant.images;
  //   if (product?.variants?.[0]?.images?.length) return product.variants[0].images;
  //   return [];
  // }, [selectedVariant, product]);

  const images = useMemo(() => {
    if (!product?.colors?.length) return [];

    const selectedColor = product.colors.find(
      (pc) => pc.color?.name == selColor,
    );
    if (selectedColor?.images?.length) {
      return selectedColor.images;
    }
    return product.colors[0]?.images || [];
  }, [product, selColor]);

  const displayPrice =
    selectedVariant?.selling_price ||
    selectedVariant?.discount_price ||
    product?.variants?.[0]?.selling_price;
  const originalPrice = selectedVariant?.price || product?.variants?.[0]?.price;
  const discount =
    displayPrice &&
    originalPrice &&
    parseFloat(originalPrice) > parseFloat(displayPrice)
      ? Math.round(
          ((parseFloat(originalPrice) - parseFloat(displayPrice)) /
            parseFloat(originalPrice)) *
            100,
        )
      : null;

  if (loading) return <Spinner />;
  if (!product)
    return (
      <div
        className="container"
        style={{ padding: "60px 0", textAlign: "center" }}
      >
        <h2>Product not found</h2>
      </div>
    );

  const handleAddToCart = async () => {
    if (!selColor) {
      toast.error("Please select a color");
      return;
    }
    if (!selSize) {
      toast.error("Please select a size");
      return;
    }
    if (!selectedVariant) {
      toast.error("Selected combination not available");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please login to add to cart");
      navigate("/login");
      return;
    }

    setAdding(true);
    const success = await addToCart(selectedVariant.id, qty);
    setAdding(false);
  };

  const handleBuyNow = () => {
    if (!selColor || !selSize || !selectedVariant) {
      toast.error("Select color & size");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please login");
      navigate("/login");
      return;
    }
    navigate("/checkout", {
      state: {
        buyNow: true,
        variantId: selectedVariant.id,
        quantity: qty,
        productName: product.name,
        color: selColor,
        size: selSize,
        price: displayPrice,
        image: images[0]?.image || "",
      },
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to review");
      return;
    }
    try {
      if (editingReview) {
        await updateReview(editingReview.id, {
          rating: reviewRating,
          comment: reviewComment,
        });
        toast.success("Review updated!");
      } else {
        await createReview({
          product_id: product.id,
          rating: reviewRating,
          comment: reviewComment,
        });
        toast.success("Review added!");
      }
      setEditingReview(null);
      setReviewComment("");
      setReviewRating(5);
      // Refresh reviews
      const res = await getProductReviews(product.id);
      setReviews(res.results || res || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit review");
    }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm("Delete this review?")) return;
    try {
      await deleteReview(id);
      toast.success("Review deleted");
      const res = await getProductReviews(product.id);
      setReviews(res.results || res || []);
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const handleAddToWishlist = async () => {
    if (!selColor) {
      toast.error("Please select a color");
      return;
    }

    if (!selSize) {
      toast.error("Please select a size");
      return;
    }

    if (!selectedVariant) {
      toast.error("Selected combination not available");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please login to add to wishlist");
      navigate("/login");
      return;
    }

    try {
      await addToWishlist(selectedVariant.id);
      toast.success("Added to wishlist ❤️");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add to wishlist");
    }
  };

  return (
    <div className={styles["product-detail"]}>
      <div className="container">
        <nav className="breadcrumb">
          <a href="/">Home</a>
          <span className="sep">/</span>
          <a href="/shop">Shop</a>
          <span className="sep">/</span>
          <span className="current">{product.name}</span>
        </nav>
        <div className={styles["pd-layout"]}>
          {/* Gallery */}
          <div className={styles["pd-gallery"]}>
            <div className={styles["pd-main-img"]}>
              {images[selImg] && (
                <img src={images[selImg].image} alt={product.name} />
              )}
            </div>
            <div className={styles["pd-thumbs"]}>
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  className={`${styles["pd-thumb"]} ${selImg === i ? styles.active : ""}`}
                  onClick={() => setSelImg(i)}
                >
                  <img src={img.image} alt="" />
                </button>
              ))}
            </div>
          </div>
          {/* Info */}
          <div className={styles["pd-info"]}>
            <h1>{product.name}</h1>
            <div className={styles["pd-price"]}>
              {displayPrice && (
                <span className={styles["price-current"]}>
                  ₹{parseFloat(displayPrice).toLocaleString()}
                </span>
              )}
              {discount && originalPrice && (
                <>
                  <span className={styles["price-original"]}>
                    ₹{parseFloat(originalPrice).toLocaleString()}
                  </span>
                  <span className={styles["pd-discount"]}>{discount}% OFF</span>
                </>
              )}
            </div>
            <p className={styles["pd-desc"]}>{product.description}</p>

            {/* Color */}
            {uniqueColors.length > 0 && (
              <div className={styles["pd-option"]}>
                <label>
                  Color: <strong>{selColor || "Select"}</strong>
                </label>
                <div className={styles["color-options"]}>
                  {uniqueColors.map((c) => (
                    <button
                      key={c.id}
                      className={`${styles["color-option"]} ${selColor === c.name ? styles.active : ""}`}
                      onClick={() => {
                        setSelColor(c.name);
                        const firstSize =
                          product.variants.find((v) => v.color?.name === c.name)
                            ?.size?.name || "";
                        setSelSize(firstSize);
                        setSelImg(0);
                      }}
                      style={
                        c.hex_code
                          ? {
                              borderColor:
                                selColor === c.name
                                  ? c.hex_code
                                  : "transparent",
                            }
                          : {}
                      }
                    >
                      {c.hex_code && (
                        <span
                          className={styles["color-swatch"]}
                          style={{ background: c.hex_code }}
                        />
                      )}
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Size */}
            {uniqueSizes.length > 0 && (
              <div className={styles["pd-option"]}>
                <label>
                  Size: <strong>{selSize || "Select"}</strong>
                </label>
                <div className={styles["size-options"]}>
                  {uniqueSizes.map((s) => (
                    <button
                      key={s.id}
                      className={`${styles["size-option"]} ${selSize === s.name ? styles.active : ""}`}
                      onClick={() => setSelSize(s.name)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            {selectedVariant && (
              <p
                className={styles["pd-stock"]}
                style={{
                  color:
                    selectedVariant.availability_status === "IN_STOCK"
                      ? "var(--success)"
                      : "var(--error)",
                }}
              >
                {selectedVariant.availability_status === "IN_STOCK"
                  ? `● In Stock (${selectedVariant.stock} available)`
                  : "● Out of Stock"}
              </p>
            )}

            {/* Actions */}
            <div className={styles["pd-actions"]}>
              <div className={styles["qty-selector"]}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <button
                className={`btn-primary ${styles["pd-add"]}`}
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? "Adding..." : "🛒 Add to Cart"}
              </button>
              <button
                className={`btn-accent ${styles["pd-buy"]}`}
                onClick={handleBuyNow}
              >
                Buy Now
              </button>
              {/* Wishlist */}
              <button
                className={`btn-secondary ${styles["pd-whishlist"]}`}
                onClick={handleAddToWishlist}
              >
                ❤ Add to Wishlist
              </button>
            </div>

            <div className={styles["pd-badges-row"]}>
              <span>🚚 Free Shipping</span>
              <span>🔄 Easy Returns</span>
            </div>

            <div className={styles["pd-meta"]}>
              {/* {selectedVariant?.sku && <p><strong>SKU:</strong> {selectedVariant.sku}</p>} */}
              {product.material && (
                <p>
                  <strong>Material:</strong> {product.material}
                </p>
              )}
              {product.care_instruction && (
                <p>
                  <strong>Care:</strong> {product.care_instruction}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles["pd-tabs"]}>
          {["description", "additional", "reviews"].map((t) => (
            <button
              key={t}
              className={`${styles["tab-btn"]} ${tab === t ? styles.active : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "description"
                ? "Description"
                : t === "additional"
                  ? "Additional Information"
                  : `Reviews (${reviews.length})`}
            </button>
          ))}
        </div>
        <div className={styles["pd-tab-content"]}>
          {tab === "description" && (
            <div className={styles["pd-description"]}>
              <h3>Product Details</h3>
              <p>{product.description}</p>
              {product.care_instruction && (
                <>
                  <h3 style={{ marginTop: "16px" }}>Care Instructions</h3>
                  <p>{product.care_instruction}</p>
                </>
              )}
            </div>
          )}
          {tab === "additional" && (
            <div className={styles["pd-additional"]}>
              <table>
                <tbody>
                  {product.material && (
                    <tr>
                      <td>Material</td>
                      <td>{product.material}</td>
                    </tr>
                  )}
                  <tr>
                    <td>Available Sizes</td>
                    <td>{uniqueSizes.map((s) => s.name).join(", ") || "—"}</td>
                  </tr>
                  <tr>
                    <td>Colors</td>
                    <td>{uniqueColors.map((c) => c.name).join(", ") || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {tab === "reviews" && (
            <div className={styles["pd-reviews"]}>
              {/* Review Form */}
              {isAuthenticated && (
                <form
                  className={styles["review-form"]}
                  onSubmit={handleSubmitReview}
                >
                  <h3>{editingReview ? "Edit Review" : "Write a Review"}</h3>
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      marginBottom: "12px",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setReviewRating(s)}
                        style={{
                          background: "none",
                          fontSize: "1.4rem",
                          color: s <= reviewRating ? "#F59E0B" : "#D1C5BF",
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience ..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1.5px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "inherit",
                      fontSize: "0.9rem",
                      resize: "vertical",
                    }}
                  />
                  <div
                    style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                  >
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ padding: "10px 20px" }}
                    >
                      {editingReview ? "Update" : "Submit"} Review
                    </button>
                    {editingReview && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: "10px 20px" }}
                        onClick={() => {
                          setEditingReview(null);
                          setReviewComment("");
                          setReviewRating(5);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              {reviews.length === 0 && (
                <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>
                  No reviews yet. Be the first to review!
                </p>
              )}

              {reviews.map((r) => (
                <div key={r.id} className={styles["review-item"]}>
                  <div className={styles["review-header"]}>
                    <div className={styles["review-avatar"]}>
                      {r.user?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <strong>{r.user}</strong>
                      {r.is_verified_purchase && (
                        <span className={styles.verified}>
                          {" "}
                          ✓ Verified Buyer
                        </span>
                      )}
                      <StarRating rating={r.rating} />
                    </div>
                    <span className={styles["review-date"]}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p>{r.comment}</p>
                  {user && r.user === user.name && (
                    <div
                      style={{ display: "flex", gap: "12px", marginTop: "8px" }}
                    >
                      <button
                        className={styles["review-action"]}
                        onClick={() => {
                          setEditingReview(r);
                          setReviewRating(r.rating);
                          setReviewComment(r.comment);
                          setTab("reviews");
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className={styles["review-action"]}
                        onClick={() => handleDeleteReview(r.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section style={{ marginTop: "48px" }}>
            <h2 className="section-title">You May Also Like</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: "20px",
              }}
            >
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
