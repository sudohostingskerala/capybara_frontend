import styles from "./AboutUs.module.css";

export default function AboutUs() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>A LITTLE COMFORT, A LOT OF JOY</span>
        <h1>About Capybara Baby Care</h1>
        <p className={styles.heroText}>
          Where comfort meets style, and every outfit brings a little happiness.
        </p>
        <span className={styles.heroDecoration} aria-hidden="true">♡</span>
      </section>

      <div className={styles.content}>
        <section className={styles.intro}>
          <div className={styles.introMark} aria-hidden="true">C</div>
          <div>
            <span className={styles.sectionLabel}>OUR STORY</span>
            <h2>Fashion that feels like you.</h2>
            <p>
              Welcome to Capybara Baby Care, where comfort meets style!
            </p>
            <p>
              We believe clothing should make you feel comfortable, confident,
              and special. Our brand is inspired by the adorable charm of
              capybaras and the joy of expressing yourself through fashion.
            </p>
            <p>
              We are passionate about bringing you lovely, comfortable, and
              stylish clothing designed to add a little happiness to your
              everyday wardrobe.
            </p>
            <p>
              At Capybara Baby Care, we believe that fashion is more than just
              clothing – it’s a way to express your personality, creativity,
              and individuality.
            </p>
            <p className={styles.thankYou}>Thank you for being part of our journey! <span>♡</span></p>
          </div>
        </section>

        <section className={styles.values}>
          <article className={styles.valueCard}>
            <div className={styles.valueIcon} aria-hidden="true">✨</div>
            <span className={styles.sectionLabel}>WHERE WE’RE GOING</span>
            <h2>Our Vision</h2>
            <p>
              Our vision is to build a loved and trusted clothing brand that
              brings comfort, creativity, and happiness to people through
              fashion.
            </p>
            <p>
              We aim to grow into a brand known for unique designs, quality
              clothing, affordable style, and a positive shopping experience.
            </p>
          </article>

          <article className={`${styles.valueCard} ${styles.missionCard}`}>
            <div className={styles.valueIcon} aria-hidden="true">❤️</div>
            <span className={styles.sectionLabel}>WHAT WE BELIEVE IN</span>
            <h2>Our Mission</h2>
            <ul className={styles.missionList}>
              <li>Provide stylish and comfortable clothing.</li>
              <li>Celebrate individuality through unique designs.</li>
              <li>Focus on quality, comfort, and customer satisfaction.</li>
              <li>Make everyday fashion fun, accessible, and enjoyable.</li>
              <li>Build a community of happy and confident customers.</li>
            </ul>
          </article>
        </section>

        <section className={styles.closing}>
          <span aria-hidden="true">♡</span>
          <h2>Thank you for being part of our story.</h2>
          <p>Here’s to feeling comfortable, confident, and special every day.</p>
        </section>
      </div>
    </main>
  );
}
