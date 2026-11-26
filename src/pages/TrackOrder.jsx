import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestGuestOrderRecovery, saveGuestRecovery, verifyGuestOrderRecovery } from '../services/guestOrderRecovery';
import styles from './TrackOrder.module.css';

const errorMessage = (error, fallback) => {
  if (error.response?.status === 429) return 'Too many attempts. Please wait a while before trying again.';
  if (error.response?.status === 400 && fallback.includes('code')) return 'That code is invalid or has expired. Request a new code and try again.';
  return error.response?.data?.detail || fallback;
};

export default function TrackOrder() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('details');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const requestCode = async (resend = false) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await requestGuestOrderRecovery(orderNumber.trim(), email.trim());
      setStep('code');
      setNotice('If the order details match, a verification code has been sent to the checkout email.');
    } catch (requestError) {
      setError(errorMessage(requestError, resend ? 'Could not resend the code. Please try again.' : 'Could not request a code. Please check your details and try again.'));
    } finally { setBusy(false); }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const access = await verifyGuestOrderRecovery(orderNumber.trim(), email.trim(), code.trim());
      saveGuestRecovery(access.order_id, access.access_token, access.expires_in);
      navigate(`/guest-order/${encodeURIComponent(access.order_id)}`, { replace: true });
    } catch (verifyError) {
      setError(errorMessage(verifyError, 'Could not verify code. Please request a new code and try again.'));
    } finally { setBusy(false); }
  };

  return <section className={`container ${styles.page}`}>
    <div className={styles.panel}>
      <p className={styles.eyebrow}>CAPYBARA ORDER HELP</p>
      <h1>Track your order</h1>
      <p className={styles.intro}>Enter your order reference and the email used at checkout to securely view your guest order.</p>
      {step === 'details' ? <form onSubmit={(event) => { event.preventDefault(); requestCode(); }}>
        <div className="form-group"><label htmlFor="order-number">Order number</label><input id="order-number" autoComplete="off" required maxLength="30" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="e.g. CAP-12345" /></div>
        <div className="form-group"><label htmlFor="checkout-email">Checkout email</label><input id="checkout-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Sending code…' : 'Continue'}</button>
      </form> : <form onSubmit={verifyCode}>
        <p className={styles.notice} role="status">{notice}</p>
        <div className="form-group"><label htmlFor="verification-code">Six-digit verification code</label><input id="verification-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} /></div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify and view order'}</button>
        <button className={styles.resend} type="button" onClick={() => requestCode(true)} disabled={busy}>{busy ? 'Please wait…' : 'Resend code'}</button>
      </form>}
    </div>
  </section>;
}
