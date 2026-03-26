import React, { useState } from 'react';
import { Star, Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw } from 'lucide-react';
import { Product, ProductReview, formatPrice } from '../../lib/supabase';

interface ProductInfoProps {
  product: Product;
  onAddToCart: () => void;
  reviews: ProductReview[];
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  onAddToCart,
  reviews,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const discountAmount = product.original_price && product.original_price > product.price
    ? product.original_price - product.price
    : 0;

  const discountPercentage = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stock_quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <span>Home</span> / <span>{product.category?.name}</span> / <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* Product Title & Brand */}
      <div>
        {product.brand && (
          <p className="text-green-600 font-medium mb-2">{product.brand.name}</p>
        )}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
        
        {/* Rating */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(averageRating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-gray-600">
            {averageRating.toFixed(1)} ({reviews.length} reviews)
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <>
              <span className="text-xl text-gray-500 line-through">
                {formatPrice(product.original_price)}
              </span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-semibold">
                {discountPercentage}% OFF
              </span>
            </>
          )}
        </div>
        {discountAmount > 0 && (
          <p className="text-green-600 font-medium">
            You save {formatPrice(discountAmount)}
          </p>
        )}
        <p className="text-gray-600">
          Price per {product.unit} • {product.weight}
        </p>
      </div>

      {/* Description */}
      {product.description && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Stock Status */}
      <div className="flex items-center space-x-2">
        {product.stock_quantity > 0 ? (
          <>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-600 font-medium">In Stock</span>
            {product.stock_quantity <= 10 && (
              <span className="text-orange-600 text-sm">
                (Only {product.stock_quantity} left!)
              </span>
            )}
          </>
        ) : (
          <>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-600 font-medium">Out of Stock</span>
          </>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <span className="w-12 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= product.stock_quantity}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onAddToCart}
            disabled={product.stock_quantity === 0}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Add to Cart</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-colors flex items-center justify-center space-x-2 ${
                isFavorite
                  ? 'border-red-500 text-red-500 bg-red-50'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              <span>Wishlist</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 transition-colors flex items-center justify-center space-x-2"
            >
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-t pt-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center space-x-3">
            <Truck className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Free Delivery</p>
              <p className="text-sm text-gray-600">On orders above ₹500</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Quality Guarantee</p>
              <p className="text-sm text-gray-600">100% fresh and quality assured</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <RotateCcw className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Easy Returns</p>
              <p className="text-sm text-gray-600">7-day return policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};