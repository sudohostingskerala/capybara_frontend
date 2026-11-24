export const GUEST_CART_TOKEN_KEY = 'capybara_guest_cart_token';

export const getGuestCartToken = () => {
  try {
    return localStorage.getItem(GUEST_CART_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const saveGuestCartToken = (token) => {
  if (typeof token !== 'string' || !token) return;
  try {
    localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
  } catch {
    // Cart requests still work for the current page when storage is unavailable.
  }
};

export const clearGuestCartToken = () => {
  try {
    localStorage.removeItem(GUEST_CART_TOKEN_KEY);
  } catch {
    // Ignore storage failures; never expose or log the token.
  }
};

export const getGuestCartRequestHeaders = (token = getGuestCartToken()) => ({
  'Cache-Control': 'no-store',
  ...(token ? { 'X-Guest-Cart-Token': token } : {}),
});
