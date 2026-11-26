import api from './api.js';

export const GUEST_RECOVERY_KEY = 'capybara_guest_order_recovery';

export const requestGuestOrderRecovery = async (order_number, email) => {
  const { data, status } = await api.post('/orders/guest/recovery/request/', {
    order_number,
    email,
  }, { skipUserAuth: true });
  return { data, status };
};

// The backend serializer calls this field `code` (not `otp`).
export const verifyGuestOrderRecovery = async (order_number, email, code) => {
  const { data } = await api.post('/orders/guest/recovery/verify/', {
    order_number,
    email,
    code,
  }, { skipUserAuth: true });
  return data;
};

export const saveGuestRecovery = (orderId, token, expiresIn = 43200) => {
  if (!orderId || !token) throw new Error('Guest order credentials are missing.');
  try {
    localStorage.setItem(GUEST_RECOVERY_KEY, JSON.stringify({
      orderId: String(orderId),
      token,
      expiresAt: Date.now() + Number(expiresIn) * 1000,
    }));
  } catch {
    throw new Error('Guest order access could not be saved in this browser. Please enable site storage and verify again.');
  }
};

export const getGuestRecovery = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(GUEST_RECOVERY_KEY) || 'null');
    if (!saved?.orderId || !saved?.token || !Number.isFinite(saved.expiresAt)
      || saved.expiresAt <= Date.now()) {
      clearGuestRecovery();
      return null;
    }
    return saved;
  } catch {
    return null;
  }
};

export const clearGuestRecovery = () => {
  try { localStorage.removeItem(GUEST_RECOVERY_KEY); } catch { /* storage may be unavailable */ }
};
