import api, { getAccessToken } from './api';
import {
  clearGuestCartToken,
  getGuestCartRequestHeaders,
  getGuestCartToken,
  saveGuestCartToken,
} from './guestCartToken';

const cartRequestConfig = (token = getGuestCartToken()) => ({ headers: getGuestCartRequestHeaders(token) });
let cartFetchPromise = null;

export const getCart = async () => {
  if (cartFetchPromise) return cartFetchPromise;
  const token = getGuestCartToken();
  cartFetchPromise = api.get('/cart/', cartRequestConfig(token))
    .then(({ data }) => {
      if (data?.guest_token) saveGuestCartToken(data.guest_token);
      return data;
    })
    .finally(() => { cartFetchPromise = null; });
  return cartFetchPromise;
};

export const addToCart = async (product_variant, quantity = 1) => {
  if (!getAccessToken() && !getGuestCartToken()) await getCart();
  const { data } = await api.post('/cart/add/', { product_variant, quantity }, cartRequestConfig());
  return data;
};

export const updateCartItem = async (pk, quantity) => {
  const { data } = await api.patch(`/cart/items/${pk}/`, { quantity }, cartRequestConfig());
  return data;
};

export const removeCartItem = async (pk) => {
  await api.delete(`/cart/items/${pk}/delete/`, cartRequestConfig());
};

export const mergeGuestCart = async (token = getGuestCartToken()) => {
  if (!token) return null;
  const { data } = await api.post('/cart/merge/', {}, cartRequestConfig(token));
  return data;
};

export { clearGuestCartToken, getGuestCartToken };
