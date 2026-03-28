import { useState, useEffect } from 'react';
import { supabase, Product } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<(Product & { wishlist_id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWishlist = async () => {
    if (!user) {
      setWishlistItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          product:products(
            *,
            category:categories(*),
            brand:brands(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedItems = (data || []).map(item => ({
        ...item.product,
        wishlist_id: item.id
      }));

      setWishlistItems(formattedItems);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    if (!user) {
      throw new Error('Please sign in to add items to wishlist');
    }

    try {
      const { error } = await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          product_id: productId
        });

      if (error) throw error;
      await fetchWishlist();
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      await fetchWishlist();
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  return {
    wishlistItems,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refetch: fetchWishlist
  };
};