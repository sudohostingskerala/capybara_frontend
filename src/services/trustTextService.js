import api from './api';

export const getTrustTexts = async () => {
  const { data } = await api.get('/storefront/trust-texts/');
  return data;
};
