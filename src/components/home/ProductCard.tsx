import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Star } from 'lucide-react';
import { Product, formatPrice } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../hooks/useWishlist';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
  showAddButton?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'default',
  showAddButton = true,
  className = ""
}) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addToCart(product.id);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const discountedPrice = product.original_price && product.original_price > product.price 
    ? product.price 
    : null;

  const getCardClasses = () => {
    const baseClasses = "group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 cursor-pointer";
    
    switch (variant) {
      case 'compact':
        return `${baseClasses} p-4`;
      case 'featured':
        return `${baseClasses} p-6 ring-2 ring-green-500 ring-opacity-20`;
      default:
        return `${baseClasses} p-6`;
    }
  };

  return (
    <Link to={`/product/${product.id}`} className={`${getCardClasses()} ${className} block`}>
      {/* Product Image */}
      <div className="relative mb-4">
        <div className={`${variant === 'compact' ? 'h-32' : 'h-48'} bg-gray-100 rounded-xl overflow-hidden`}>
          <img
            src={product.image_url || 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_best_deal && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
              Best Deal
            </span>
          )}
          {product.is_featured && (
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
              Featured
            </span>
          )}
          {product.discount_percentage > 0 && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
              {product.discount_percentage}% OFF
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button 
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
        >
          <Heart className={`h-4 w-4 transition-colors ${
            isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-500'
          }`} />
        </button>

        {/* Quick Add Button */}
        {showAddButton && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 p-2 bg-green-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hover:bg-green-600"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        {product.brand && (
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {product.brand.name}
          </p>
        )}
        
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors">
          {product.name}
        </h3>
        
        {variant !== 'compact' && product.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Weight/Unit */}
        {product.weight && (
          <p className="text-sm text-gray-500">
            {product.weight} • {product.unit}
          </p>
        )}

        {/* Rating - Mock for now */}
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
          ))}
          <span className="text-xs text-gray-500 ml-1">(4.0)</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>
          
          {showAddButton && (
            <button
              onClick={handleAddToCart}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors md:hidden"
            >
              Add
            </button>
          )}
        </div>

        {/* Stock Status */}
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <p className="text-xs text-orange-600 font-medium">
            Only {product.stock_quantity} left!
          </p>
        )}
        {product.stock_quantity === 0 && (
          <p className="text-xs text-red-600 font-medium">Out of stock</p>
        )}
      </div>
    </Link>
  );
};