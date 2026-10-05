import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as wishlistService from '../services/wishlistService';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    try {
      setLoading(true);
      const data = await wishlistService.getWishlist();
      // Handle paginated or plain array response
      setWishlist(data.results || data);
    } catch {
      console.error('Failed to fetch wishlist.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlistApi = async (variantId) => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      await wishlistService.addToWishlist(variantId);
      await fetchWishlist();
      toast.success('Added to wishlist!');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add to wishlist';
      toast.error(msg);
    }
  };

  const removeFromWishlistApi = async (wishlistItemId) => {
    try {
      await wishlistService.removeFromWishlist(wishlistItemId);
      await fetchWishlist();
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const toggleWishlist = async (variantId) => {
    const existing = wishlist.find(
      (item) => item.product_variant_id === variantId || item.id === variantId
    );
    if (existing) {
      await removeFromWishlistApi(existing.id);
    } else {
      await addToWishlistApi(variantId);
    }
  };

  const isWishlisted = (variantId) => {
    return wishlist.some(
      (item) => item.product_variant_id === variantId || item.id === variantId
    );
  };

  return (
    <WishlistContext.Provider value={{
      wishlist,
      loading,
      toggleWishlist,
      isWishlisted,
      addToWishlist: addToWishlistApi,
      removeFromWishlist: removeFromWishlistApi,
      fetchWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
