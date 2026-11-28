import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../services/reviewService";
import styles from "./OrderItemReview.module.css";

export default function OrderItemReview({ productId }) {
  const { isAuthenticated, user } = useAuth();
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const loadMyReview = async () => {
    const res = await getProductReviews(productId);
    const list = res.results || res || [];
    setMyReview(list.find((r) => r.user === user?.name) || null);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadMyReview()
      .catch(() => setMyReview(null))
      .finally(() => setLoading(false));
  }, [productId, isAuthenticated, user?.name]);

  if (!isAuthenticated || loading) return null;

  const openForm = () => {
    setRating(myReview?.rating || 5);
    setComment(myReview?.comment || "");
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (myReview) {
        await updateReview(myReview.id, { rating, comment });
        toast.success("Review updated!");
      } else {
        await createReview({ product_id: productId, rating, comment });
        toast.success("Review added!");
      }
      setOpen(false);
      await loadMyReview().catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit review");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this review?")) return;
    try {
      await deleteReview(myReview.id);
      setMyReview(null);
      setOpen(false);
      toast.success("Review deleted");
    } catch {
      toast.error("Failed to delete review");
    }
  };

  if (!open) {
    return (
      <div className={styles.summary}>
        {myReview && (
          <span className={styles.stars}>
            {"★".repeat(myReview.rating)}
            {"☆".repeat(5 - myReview.rating)}
          </span>
        )}
        <button type="button" className={styles.link} onClick={openForm}>
          {myReview ? "Edit review" : "Write a review"}
        </button>
        {myReview && (
          <button type="button" className={styles.link} onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            type="button"
            key={s}
            className={s <= rating ? styles.starOn : styles.starOff}
            onClick={() => setRating(s)}
            aria-label={`${s} star`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience ..."
        rows={3}
      />
      <div className={styles.actions}>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : myReview ? "Update Review" : "Submit Review"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}