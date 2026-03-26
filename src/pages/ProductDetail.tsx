import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Product, ProductReview, formatPrice } from '../lib/supabase';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProductImageGallery } from '../components/product/ProductImageGallery';
import { ProductInfo } from '../components/product/ProductInfo';
import { ProductBrochure } from '../components/product/ProductBrochure';
import { SimilarProducts } from '../components/product/SimilarProducts';
import { ProductSpecifications } from '../components/product/ProductSpecifications';
import { ProductReviews } from '../components/product/ProductReviews';
import { FreshArrivals } from '../components/product/FreshArrivals';
import { useCart } from '../context/CartContext';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      try {
        await addToCart(product.id);
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600">{error || 'The product you are looking for does not exist.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image_url || 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <ProductImageGallery
            images={productImages}
            productName={product.name}
            selectedIndex={selectedImageIndex}
            onImageSelect={setSelectedImageIndex}
          />
          <ProductInfo
            product={product}
            onAddToCart={handleAddToCart}
            reviews={reviews}
          />
        </div>

        {/* Product Brochure */}
        <ProductBrochure product={product} />

        {/* Similar Products */}
        <SimilarProducts 
          currentProductId={product.id}
          categoryId={product.category_id}
        />

        {/* Product Specifications */}
        <ProductSpecifications product={product} />

        {/* Reviews Section */}
        <ProductReviews
          productId={product.id}
          reviews={reviews}
          onReviewsUpdate={fetchReviews}
        />

        {/* Fresh Arrivals */}
        <FreshArrivals />
      </div>
    </div>
  );
};