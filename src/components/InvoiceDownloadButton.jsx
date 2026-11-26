import { useState } from 'react';
import { downloadOrderInvoice } from '../services/orderService';
import { canDownloadInvoice, invoiceDownloadMessage } from '../utils/invoiceDownload';
import styles from './InvoiceDownloadButton.module.css';

export default function InvoiceDownloadButton({ order, guestToken }) {
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState('');
  const [hidden, setHidden] = useState(false);

  if (!canDownloadInvoice(order) || hidden) {
    return message ? <p className={styles.message} role="status">{message}</p> : null;
  }

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setMessage('');
    try {
      const response = await downloadOrderInvoice(order.id, guestToken);
      if (response.status !== 200 || typeof response.data?.url !== 'string') {
        setMessage(invoiceDownloadMessage(response.status));
        setHidden(true);
        return;
      }

      const url = new URL(response.data.url);
      if (!['https:', 'http:'].includes(url.protocol)) {
        throw new Error('Invalid invoice URL');
      }
      const link = document.createElement('a');
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'Open invoice PDF');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      const status = error.response?.status;
      setMessage(invoiceDownloadMessage(status));
      if ([202, 404, 503, 401, 403].includes(status)) setHidden(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.button} onClick={handleDownload} disabled={downloading}>
        {downloading ? 'Preparing invoice…' : 'Download Invoice'}
      </button>
      {message && <p className={styles.message} role="status">{message}</p>}
    </div>
  );
}
