import api from './api';

export const getVideoAds = async () => {
  const { data } = await api.get('/video-ads/');
  return data;
};