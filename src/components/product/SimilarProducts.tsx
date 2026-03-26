import React, { useEffect, useState } from 'react';
import { supabase, Product } from '../../lib/supabase';
import { ProductCard } from '../home/ProductCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ArrowRight } from 'lucide-react';

interface SimilarProductsProps {
  currentProductId: string;
  categoryId?: string;
}

export const SimilarProducts: React.FC<SimilarProductsProps> = ({
  currentProductId,
  categoryId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimilarProducts();
  }, [currentProductId, categoryId]);

  const fetchSimilarProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*)
        `)
        .eq('is_active', true)
        .neq('id', currentProductId);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching similar products:', error);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Similar Products</h2>
          <p className="text-gray-600">You might also like these products</p>
        </div>
        <button className="hidden md:flex items-center text-green-600 font-semibold hover:text-green-700 transition-colors">
          View All
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>

      <div className="text-center mt-8 md:hidden">
        <button className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
          View All Similar Products
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </section>
  );
};