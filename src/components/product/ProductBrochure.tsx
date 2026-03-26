import React from 'react';
import { Product } from '../../lib/supabase';
import { Leaf, Award, Truck, Shield } from 'lucide-react';

interface ProductBrochureProps {
  product: Product;
}

export const ProductBrochure: React.FC<ProductBrochureProps> = ({ product }) => {
  const features = [
    {
      icon: <Leaf className="h-8 w-8 text-green-600" />,
      title: 'Fresh & Natural',
      description: 'Sourced directly from farms to ensure maximum freshness and quality.'
    },
    {
      icon: <Award className="h-8 w-8 text-blue-600" />,
      title: 'Premium Quality',
      description: 'Carefully selected and quality-checked by our expert team.'
    },
    {
      icon: <Truck className="h-8 w-8 text-purple-600" />,
      title: 'Fast Delivery',
      description: 'Get your order delivered within 30 minutes in your area.'
    },
    {
      icon: <Shield className="h-8 w-8 text-orange-600" />,
      title: 'Safe Packaging',
      description: 'Hygienic and eco-friendly packaging to maintain product integrity.'
    }
  ];

  return (
    <section className="mb-16">
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl p-8 lg:p-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose {product.name}?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover what makes this product special and why thousands of customers trust us 
            for their daily grocery needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Product Highlights */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Product Highlights</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Farm Fresh Quality</h4>
                  <p className="text-gray-600 text-sm">
                    Handpicked from the best farms and delivered fresh to your doorstep.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Nutritious & Healthy</h4>
                  <p className="text-gray-600 text-sm">
                    Packed with essential nutrients to support your healthy lifestyle.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Best Price Guarantee</h4>
                  <p className="text-gray-600 text-sm">
                    Competitive pricing with regular offers and discounts.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Easy Returns</h4>
                  <p className="text-gray-600 text-sm">
                    Not satisfied? Return within 7 days for a full refund.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">24/7 Support</h4>
                  <p className="text-gray-600 text-sm">
                    Our customer support team is always ready to help you.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Secure Payments</h4>
                  <p className="text-gray-600 text-sm">
                    Multiple payment options with bank-level security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <span className="text-sm font-semibold">✨ Limited Time Offer</span>
          </div>
          <p className="text-gray-600 mt-2">
            Order now and get free delivery on your first purchase!
          </p>
        </div>
      </div>
    </section>
  );
};