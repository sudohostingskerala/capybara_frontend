import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as cartService from '../services/cartService';
import toast from 'react-hot-toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const cartItems = cart?.items || [];
  const totalAmount = cart?.total_amount ? parseFloat(cart.total_amount) : 0;
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const fetchCart = useCallback(async () => {
    if (authLoading) return;
    try {
      setLoading(true);
      if (isAuthenticated && cartService.getGuestCartToken()) {
        try {
          await cartService.mergeGuestCart();
          cartService.clearGuestCartToken();
        } catch {
          toast.error('We could not merge your guest cart. Your saved guest cart is still available; please try again.');
          return;
        }
      }
      const data = await cartService.getCart();
      setCart(data);
    } catch {
      // Cart availability should not interrupt the storefront.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    // The async request updates state after the effect, which is intentional here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (variantId, quantity = 1) => {
    try {
      await cartService.addToCart(variantId, quantity);
      await fetchCart();
      toast.success('Added to cart!');
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add to cart';
      toast.error(msg);
      return false;
    }
  };

  const updateQty = async (cartItemId, quantity) => {
    try {
      await cartService.updateCartItem(cartItemId, quantity);
      await fetchCart();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update quantity';
      toast.error(msg);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await cartService.removeCartItem(cartItemId);
      await fetchCart();
      toast.success('Removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const clearCartLocal = () => {
    setCart(null);
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartItems,
      totalAmount,
      itemCount,
      loading,
      addToCart,
      updateQty,
      removeFromCart,
      fetchCart,
      clearCartLocal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
