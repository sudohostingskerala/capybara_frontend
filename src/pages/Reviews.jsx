import styles from "./Reviews.module.css";

const reviews = [
  {
    name: "Priya S.",
    initial: "P",
    location: "Kochi",
    rating: 5,
    review:
      "Excellent collection and the quality is amazing. Fast delivery and beautiful packaging. Totally loved the Onam special collection!",
  },
  {
    name: "Remni Nair",
    initial: "R",
    location: "Thrissur",
    rating: 5,
    review:
      "Very happy with the purchase. The pattu pavada is even more beautiful in person. My daughter loved it!",
  },
  {
    name: "Jitha K.",
    initial: "J",
    location: "Trivandrum",
    rating: 5,
    review:
      "Capybara has the best traditional collection. Great customer service and premium quality products.",
  },
];

function ReviewCard({ review }) {
  return (
    <article className={styles.reviewCard}>
      <div
        className={styles.stars}
        aria-label={`${review.rating} out of 5 stars`}
      >
        {"★".repeat(review.rating)}
      </div>

      <p className={styles.reviewText}>"{review.review}"</p>

      <div className={styles.reviewer}>
        <div className={styles.avatar} aria-hidden="true">
          {review.initial}
        </div>
        <div className={styles.reviewerInfo}>
          <h3>{review.name}</h3>
          <p>{review.location} <span aria-hidden="true">·</span> Verified Buyer</p>
        </div>
      </div>
    </article>
  );
}

export default function Reviews() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>CUSTOMER LOVE</span>
        <h1>What Our Customers Say</h1>
        <p>We love our customers &amp; they love us</p>
      </header>

      <section className={styles.reviewsSection} aria-label="Customer reviews">
        <div className={styles.reviewGrid}>
          {reviews.map((review) => (
            <ReviewCard key={review.name} review={review} />
          ))}
        </div>
      </section>

      <p className={styles.footerNote}>
        Thank you for being a part of the Capybara family!
      </p>
    </main>
  );
}
