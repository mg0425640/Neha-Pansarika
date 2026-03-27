import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase, CartItem, Product } from '../lib/supabase';

interface CartState {
  items: (CartItem & { product: Product })[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  couponCode: string | null;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: (CartItem & { product: Product })[] }
  | { type: 'ADD_ITEM'; payload: CartItem & { product: Product } }
  | { type: 'UPDATE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_COUPON'; payload: { code: string; discount: number } }
  | { type: 'REMOVE_COUPON' };

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  totalItems: 0,
  totalAmount: 0,
  subtotal: 0,
  deliveryFee: 0,
  taxAmount: 0,
  discountAmount: 0,
  couponCode: null,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CART':
      const items = action.payload;
      const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const deliveryFee = subtotal >= 500 ? 0 : 50;
      const taxAmount = subtotal * 0.05; // 5% tax
      const totalAmount = subtotal + deliveryFee + taxAmount - state.discountAmount;
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        ...state,
        items,
        subtotal,
        deliveryFee,
        taxAmount,
        totalAmount: Math.max(0, totalAmount),
        totalItems,
      };
    case 'ADD_ITEM':
      const newItems = [...state.items, action.payload];
      const newSubtotal = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const newDeliveryFee = newSubtotal >= 500 ? 0 : 50;
      const newTaxAmount = newSubtotal * 0.05;
      const newTotalAmount = newSubtotal + newDeliveryFee + newTaxAmount - state.discountAmount;
      
      return {
        ...state,
        items: newItems,
        subtotal: newSubtotal,
        deliveryFee: newDeliveryFee,
        taxAmount: newTaxAmount,
        totalAmount: Math.max(0, newTotalAmount),
        totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    case 'UPDATE_ITEM':
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      const updatedSubtotal = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const updatedDeliveryFee = updatedSubtotal >= 500 ? 0 : 50;
      const updatedTaxAmount = updatedSubtotal * 0.05;
      const updatedTotalAmount = updatedSubtotal + updatedDeliveryFee + updatedTaxAmount - state.discountAmount;
      
      return {
        ...state,
        items: updatedItems,
        subtotal: updatedSubtotal,
        deliveryFee: updatedDeliveryFee,
        taxAmount: updatedTaxAmount,
        totalAmount: Math.max(0, updatedTotalAmount),
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      const filteredSubtotal = filteredItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const filteredDeliveryFee = filteredSubtotal >= 500 ? 0 : 50;
      const filteredTaxAmount = filteredSubtotal * 0.05;
      const filteredTotalAmount = filteredSubtotal + filteredDeliveryFee + filteredTaxAmount - state.discountAmount;
      
      return {
        ...state,
        items: filteredItems,
        subtotal: filteredSubtotal,
        deliveryFee: filteredDeliveryFee,
        taxAmount: filteredTaxAmount,
        totalAmount: Math.max(0, filteredTotalAmount),
        totalItems: filteredItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    case 'CLEAR_CART':
      return {
        ...initialState,
        loading: state.loading,
      };
    case 'APPLY_COUPON':
      const discountAmount = action.payload.discount;
      const finalAmount = state.subtotal + state.deliveryFee + state.taxAmount - discountAmount;
      return {
        ...state,
        discountAmount,
        couponCode: action.payload.code,
        totalAmount: Math.max(0, finalAmount),
      };
    case 'REMOVE_COUPON':
      const originalAmount = state.subtotal + state.deliveryFee + state.taxAmount;
      return {
        ...state,
        discountAmount: 0,
        couponCode: null,
        totalAmount: originalAmount,
      };
    default:
      return state;
  }
};

const CartContext = createContext<{
  state: CartState;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
} | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const loadCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        dispatch({ type: 'SET_CART', payload: [] });
        return;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(
            *,
            category:categories(*),
            brand:brands(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      dispatch({ type: 'SET_CART', payload: data || [] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Please sign in to add items to cart');
      }

      // Check if item already exists in cart
      const existingItem = state.items.find(item => item.product_id === productId);
      
      if (existingItem) {
        await updateCartItem(existingItem.id, existingItem.quantity + quantity);
        return;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        })
        .select(`
          *,
          product:products(
            *,
            category:categories(*),
            brand:brands(*)
          )
        `)
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_ITEM', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;

      dispatch({ type: 'UPDATE_ITEM', payload: { id: itemId, quantity } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  };

  const clearCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        return { success: false, message: 'Invalid coupon code' };
      }

      // Check if coupon is valid
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = new Date(coupon.valid_until);

      if (now < validFrom || now > validUntil) {
        return { success: false, message: 'Coupon has expired' };
      }

      // Check minimum order amount
      if (state.subtotal < coupon.min_order_amount) {
        return { 
          success: false, 
          message: `Minimum order amount is ₹${coupon.min_order_amount}` 
        };
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (state.subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount && discount > coupon.max_discount) {
          discount = coupon.max_discount;
        }
      } else {
        discount = coupon.discount_value;
      }

      dispatch({ type: 'APPLY_COUPON', payload: { code: code.toUpperCase(), discount } });
      return { success: true, message: `Coupon applied! You saved ₹${discount}` };
    } catch (error) {
      return { success: false, message: 'Failed to apply coupon' };
    }
  };

  const removeCoupon = () => {
    dispatch({ type: 'REMOVE_COUPON' });
  };

  useEffect(() => {
    loadCart();
  }, []);

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        loadCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};