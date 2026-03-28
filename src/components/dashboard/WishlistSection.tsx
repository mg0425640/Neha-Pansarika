import React from 'react';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../lib/supabase';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export const WishlistSection: React.FC = () => {
  const { wishlistItems, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId);
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <LoadingSpinner size="lg" className="h-32" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">My Wishlist</h2>
        <div className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-red-500" />
          <span className="text-gray-600">{wishlistItems.length} items</span>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-600 mb-6">Add products you love to your wishlist</p>
          <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={item.image_url || 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveFromWishlist(item.id)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{item.name}</h3>
                {item.brand && (
                  <p className="text-sm text-gray-500 mb-2">{item.brand.name}</p>
                )}
                
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(item.price)}
                  </span>
                  {item.original_price && item.original_price > item.price && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(item.original_price)}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => handleAddToCart(item.id)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};