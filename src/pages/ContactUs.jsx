import { useState } from "react";
import styles from "./ContactUs.module.css";

const GOOGLE_MAPS_IFRAME_URL = "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d535.6042027415516!2d75.7866218389042!3d11.299722600849378!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTHCsDE3JzU4LjQiTiA3NcKwNDcnMTIuOCJF!5e0!3m2!1sen!2sin!4v1795236223926!5m2!1sen!2sin";
const WHATSAPP_NUMBER = "919526591498";

const contactDetails = [
  ["Contact Us", "Neeharika"],
  ["", "Karuvissery Post"],
  ["", "Calicut -10"],
  ["", "Pin 673010"],
  ["", "Mob -9526591498"],
];

export default function ContactUs() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const message = [
      "Hello Capybara,",
      "",
      "I would like to contact you.",
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Phone Number: ${form.phone.trim()}`,
      `Message: ${form.message.trim()}`,
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

const mapSrc = GOOGLE_MAPS_IFRAME_URL;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>WE'RE HERE TO HELP</p>
        <h1>Contact Us</h1>
        <p>Have a question, feedback, or concern? We'd love to hear from you.</p>
      </header>

      <main className={styles.container}>
        <section className={styles.section} aria-labelledby="contact-details">
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>GET IN TOUCH</span>
            <h2 id="contact-details">Our Contact Details</h2>
          </div>

          <div className={styles.detailsCard}>
            <table className={styles.detailsTable}>
              <tbody>
                {contactDetails.map(([label, value], index) => (
                  <tr key={`${value}-${index}`}>
                    <th scope="row">{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="map-heading">
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>FIND US</span>
            <h2 id="map-heading">Our Location</h2>
            <p>You can find us using the map below.</p>
          </div>
         <div className={styles.mapFrame}>
  {mapSrc ? (
    <iframe
      title="Neeharika location on Google Maps"
      src={mapSrc}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  ) : (
    <div className={styles.mapPlaceholder}>
      <strong>Google Map will appear here</strong>
      <span>Google Maps location will be added soon.</span>
    </div>
  )}
</div>
        </section>

        <section className={styles.section} aria-labelledby="message-heading">
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>SEND A MESSAGE</span>
            <h2 id="message-heading">Message or Complaint</h2>
            <p>Fill in the details below. Your message will open in WhatsApp for you to review and send.</p>
          </div>

          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="contact-name">Name</label>
                <input id="contact-name" name="name" type="text"
                  placeholder="Enter your name" value={form.name}
                  onChange={handleChange} autoComplete="name" required />
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-email">Email ID</label>
                <input id="contact-email" name="email" type="email"
                  placeholder="Enter your email address" value={form.email}
                  onChange={handleChange} autoComplete="email" required />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="contact-phone">Phone Number</label>
                <input id="contact-phone" name="phone" type="tel"
                  placeholder="Enter your phone number" value={form.phone}
                  onChange={handleChange} autoComplete="tel" required />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="contact-message">Message / Complaint</label>
                <textarea id="contact-message" name="message" rows={6}
                  placeholder="Write your message or complaint here..."
                  value={form.message} onChange={handleChange} required />
              </div>
            </div>

            <button className={styles.submitButton} type="submit">
              Send via WhatsApp <span aria-hidden="true">↗</span>
            </button>
            <p className={styles.formNote}>
              WhatsApp will open with your message filled in. Press Send in WhatsApp to submit it.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
