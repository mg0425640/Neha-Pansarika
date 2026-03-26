import React, { useEffect, useState } from 'react';
import { supabase, Product } from '../../lib/supabase';
import { ProductCard } from '../home/ProductCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ArrowRight, Sparkles } from 'lucide-react';

export const FreshArrivals: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFreshArrivals();
  }, []);

  const fetchFreshArrivals = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching fresh arrivals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-16">
        <div className="text-center">
          <LoadingSpinner size="lg" className="h-32" />
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 lg:p-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Fresh Arrivals</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our latest additions! Fresh products just arrived and ready to be delivered to your doorstep.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`transform transition-all duration-500 hover:scale-105 ${
                index % 2 === 0 ? 'lg:translate-y-4' : ''
              }`}
            >
              <ProductCard
                product={product}
                variant="featured"
              />
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="inline-flex items-center px-8 py-4 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
            Explore All New Products
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🚚</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Same Day Delivery</h3>
            <p className="text-gray-600 text-sm">Get your fresh arrivals delivered within hours</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Premium Quality</h3>
            <p className="text-gray-600 text-sm">Handpicked products with guaranteed freshness</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💝</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Special Offers</h3>
            <p className="text-gray-600 text-sm">Exclusive discounts on new arrivals</p>
          </div>
        </div>
      </div>
    </section>
  );
};