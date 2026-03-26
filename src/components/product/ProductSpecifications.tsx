import React from 'react';
import { Product } from '../../lib/supabase';
import { Package, Scale, Tag, Calendar } from 'lucide-react';

interface ProductSpecificationsProps {
  product: Product;
}

export const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({ product }) => {
  const specifications = [
    {
      icon: <Package className="h-5 w-5 text-blue-600" />,
      label: 'Unit',
      value: product.unit
    },
    {
      icon: <Scale className="h-5 w-5 text-green-600" />,
      label: 'Weight/Volume',
      value: product.weight || 'N/A'
    },
    {
      icon: <Tag className="h-5 w-5 text-purple-600" />,
      label: 'Brand',
      value: product.brand?.name || 'N/A'
    },
    {
      icon: <Calendar className="h-5 w-5 text-orange-600" />,
      label: 'Category',
      value: product.category?.name || 'N/A'
    }
  ];

  return (
    <section className="mb-16">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Product Specifications</h2>
          <p className="text-gray-600 mt-1">Detailed information about this product</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Specifications */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {spec.icon}
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-600 text-sm">{spec.label}:</span>
                      <span className="ml-2 font-medium text-gray-900">{spec.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutritional Information */}
            {product.nutritional_info && Object.keys(product.nutritional_info).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutritional Information</h3>
                <div className="space-y-4">
                  {Object.entries(product.nutritional_info).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {product.stock_quantity}
                </div>
                <div className="text-sm text-gray-600">Units Available</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {product.is_featured ? 'Yes' : 'No'}
                </div>
                <div className="text-sm text-gray-600">Featured Product</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {product.discount_percentage}%
                </div>
                <div className="text-sm text-gray-600">Discount</div>
              </div>
            </div>
          </div>

          {/* Storage Instructions */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Storage Instructions</h4>
            <p className="text-gray-700 text-sm">
              Store in a cool, dry place away from direct sunlight. 
              For best quality, consume within the recommended time frame. 
              Keep refrigerated if required as per product guidelines.
            </p>
          </div>

          {/* Usage Tips */}
          <div className="mt-4 p-6 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Usage Tips</h4>
            <p className="text-gray-700 text-sm">
              Wash thoroughly before consumption. Check for freshness and quality before use. 
              Follow cooking instructions if applicable. Best enjoyed fresh for optimal taste and nutrition.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};