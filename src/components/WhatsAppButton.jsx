
import './WhatsAppButton.css';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/919526591498"
      target="_blank"
      rel="noopener noreferrer"
      className="whatsappFloat"
      aria-label="Chat with us on WhatsApp"
    >
      <span className="whatsappIcon">
        <img src="/assets/whatsapp.png" alt="WhatsApp" />
      </span>

      <span className="whatsappText">Chat With WhatsApp</span>
    </a>
  );
}
