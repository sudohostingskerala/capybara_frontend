import api from './api.js';
import { getGuestCartRequestHeaders, getGuestCartToken } from './guestCartToken.js';
import { deliveryAddressUpdateRequest } from '../utils/checkoutOrder.js';

const GUEST_ORDER_KEY = 'capybara_guest_order';

export const saveGuestOrder = (orderId, token) => {
  if (!orderId || !token) throw new Error('Guest order credentials are missing.');
  localStorage.setItem(GUEST_ORDER_KEY, JSON.stringify({ orderId, token }));
};

export const getSavedGuestOrder = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(GUEST_ORDER_KEY) || 'null');
    return saved?.orderId && saved?.token ? saved : null;
  } catch {
    return null;
  }
};

export const getOrders = async () => {
  const { data } = await api.get('/orders/');
  return data;
};

export const getOrderDetail = async (pk) => {
  const { data } = await api.get(`/orders/${pk}/`);
  return data;
};

// Authenticated requests use the normal api interceptor. Guest updates attach
// the order credential as Authorization: Bearer <token>.
export const updateOrderDeliveryAddress = async (orderId, address, guestToken) => {
  const request = deliveryAddressUpdateRequest(orderId, address, guestToken);
  const { data } = await api.patch(request.url, request.payload, request.config);
  return data;
};

export const refreshOrderSummary = getOrderDetail;

export const createOrder = async (address_id) => {
  const { data } = await api.post('/orders/create/', { address_id });
  return data;
};

export const buyNow = async (address_id, product_variant, quantity) => {
  const { data } = await api.post('/orders/buy-now/', {
    address_id,
    product_variant,
    quantity,
  });
  return data;
};

export const createGuestBuyNowOrder = async (details) => {
  const { data } = await api.post('/orders/buy-now/', details, { skipUserAuth: true });
  return data;
};

export const createGuestCartOrder = async (shippingDetails) => {
  const token = getGuestCartToken();
  const { data } = await api.post('/orders/guest/create-from-cart/', shippingDetails, {
    headers: getGuestCartRequestHeaders(token),
  });
  return data;
};

export const cancelOrder = async (pk) => {
  const { data } = await api.patch(`/orders/${pk}/cancel/`);
  return data;
};

export const createRazorpayOrder = async (order_id, guestToken) => {
  const payload = guestToken ? { guest_access_token: guestToken } : {};
  const config = guestToken ? { skipUserAuth: true } : {};
  const { data } = await api.post(`/orders/${order_id}/razorpay-order/`, payload, config);
  return data;
}

export const verifyRazorpayPayment = async (order_id, paymentData) => {
  const {data} = await api.post(`/orders/${order_id}/razorpay/verify/`,
    paymentData,
    paymentData?.guest_access_token ? { skipUserAuth: true } : {}
  );
  return data;
}

export const getGuestOrderStatus = async (orderId, token) => {
  const { data } = await api.get(`/orders/guest/${orderId}/`, {
    guestBearerToken: token,
  });
  return data;
};
