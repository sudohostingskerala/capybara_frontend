import styles from "./ShippingPolicy.module.css";

const keralaRates = [
  { range: "₹100 – ₹2,499", charge: "₹50" },
  { range: "₹2,500 – ₹4,999", charge: "₹75" },
  { range: "₹5,000 – ₹9,999", charge: "₹100" },
  { range: "Above ₹9,999", charge: "₹250" },
];

const nationalRates = [
  { range: "₹100 – ₹2,499", charge: "₹50" },
  { range: "₹2,500 – ₹4,999", charge: "₹100" },
  { range: "₹5,000 – ₹9,999", charge: "₹250" },
  { range: "₹10,000 – ₹14,999", charge: "₹450" },
  { range: "₹15,000 – ₹24,999", charge: "₹1,000" },
  { range: "₹25,000 and above", charge: "₹1,500" },
];

const expressRates = [
  { range: "₹500 – ₹2,999", charge: "₹300" },
  { range: "₹3,000 – ₹5,999", charge: "₹500" },
  { range: "₹6,000 – ₹9,999", charge: "₹1,000" },
  { range: "₹10,000 – ₹14,999", charge: "₹1,750" },
  { range: "₹15,000 – ₹17,499", charge: "₹2,000" },
  { range: "₹17,500 – ₹19,999", charge: "₹2,500" },
  { range: "₹20,000 – ₹22,999", charge: "₹2,750" },
  { range: "₹23,000 – ₹26,000", charge: "₹3,000" },
  { range: "Above ₹26,000", charge: "Fast delivery unavailable" },
];

function RateTable({ rows, chargeHeading = "Shipping Charge" }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.rateTable}>
        <thead>
          <tr>
            <th scope="col">Order Value</th>
            <th scope="col">{chargeHeading}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.range}>
              <td data-label="Order Value">{row.range}</td>
              <td data-label={chargeHeading}>
                <span className={row.charge.includes("unavailable") ? styles.unavailable : styles.charge}>
                  {row.charge}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ShippingPolicy() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>DELIVERY, WITH CARE</span>
        <h1>Shipping &amp; Delivery Policy</h1>
        <p>CapybaraBabyCare Pvt. Ltd.</p>
        <div className={styles.heroIcon} aria-hidden="true">🚚</div>
      </header>

      <div className={styles.content}>
        <p className={styles.intro}>
          We are committed to delivering your favourite outfits safely and
          efficiently. Please review our shipping charges and delivery options
          below.
        </p>

        <section className={styles.policySection}>
          <div className={styles.sectionHeading}>
            <span className={styles.number}>01</span>
            <div>
              <h2>Shipping Within Kerala</h2>
              <p>Shipping charges for orders delivered within Kerala.</p>
            </div>
          </div>
          <RateTable rows={keralaRates} />
        </section>

        <section className={styles.policySection}>
          <div className={styles.sectionHeading}>
            <span className={styles.number}>02</span>
            <div>
              <h2>National Shipping (Across India) 🚀</h2>
              <p>Shipping charges for deliveries across India.</p>
            </div>
          </div>
          <RateTable rows={nationalRates} />
        </section>

        <section className={styles.policySection}>
          <div className={styles.sectionHeading}>
            <span className={styles.number}>03</span>
            <div>
              <h2>Fast Delivery 🚅</h2>
              <p>Express delivery charges based on order value.</p>
            </div>
          </div>
          <RateTable rows={expressRates} chargeHeading="Fast Delivery Charge" />
          <div className={styles.note}>
            <span className={styles.noteIcon} aria-hidden="true">ⓘ</span>
            <p>
              <strong>Please Note:</strong> Fast delivery is available only in
              selected major cities, subject to location and courier
              availability.
            </p>
          </div>
        </section>

        <section className={styles.infoCard}>
          <div className={styles.infoIcon} aria-hidden="true">📦</div>
          <div>
            <span className={styles.sectionLabel}>A NOTE ABOUT SHIPPING</span>
            <h2>Why Do We Charge for Shipping?</h2>
            <p>
              Our dresses are lightweight, but many of our designs feature
              beautiful, voluminous and puffy silhouettes. Due to their
              dimensions and packaging requirements, courier companies may
              calculate shipping charges based on volumetric weight rather
              than actual weight.
            </p>
            <p>
              To ensure your outfits are packed securely and delivered safely,
              shipping charges are applied accordingly.
            </p>
          </div>
        </section>

        <section className={styles.policySection}>
          <div className={styles.sectionHeading}>
            <span className={styles.number}>05</span>
            <div>
              <h2>Contact Us</h2>
              <p>We are happy to assist you with shipping-related questions.</p>
            </div>
          </div>
          <div className={styles.contactCard}>
            <div>
              <span className={styles.contactLabel}>COMPANY</span>
              <strong>CapybaraBabyCare Pvt. Ltd.</strong>
            </div>
            <div>
              <span className={styles.contactLabel}>WHATSAPP</span>
              <a href="https://wa.me/919526591498" target="_blank" rel="noopener noreferrer">
                +91 95265 91498
              </a>
            </div>
          </div>
        </section>

        <section className={styles.refund}>
          <div className={styles.refundIcon} aria-hidden="true">↩</div>
          <div>
            <h2>06. Shipping Charge Refund Policy</h2>
            <p>
              Please note that self-shipping charges and shipping charges paid
              to us are non-refundable.
            </p>
          </div>
        </section>

        <p className={styles.thanks}>
          Thank you for shopping with CapybaraBabyCare Pvt. Ltd. We appreciate
          your trust and support! <span aria-hidden="true">♡</span>
        </p>
      </div>
    </main>
  );
}
