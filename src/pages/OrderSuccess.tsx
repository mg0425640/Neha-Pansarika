import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Download, Truck, Package, MapPin, Phone } from 'lucide-react';
import { supabase, formatPrice } from '../lib/supabase';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  delivery_address: any;
  estimated_delivery: string;
  created_at: string;
  order_items: Array<{
    product_name: string;
    product_image: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setOrder({
        ...orderData,
        order_items: itemsData || [],
      });
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = () => {
    if (!order) return;

    // Create a simple invoice content
    const invoiceContent = `
      PANSARIKA GROCERY INVOICE
      ========================
      
      Order Number: ${order.order_number}
      Order Date: ${new Date(order.created_at).toLocaleDateString()}
      Payment Method: ${order.payment_method.toUpperCase()}
      
      DELIVERY ADDRESS:
      ${order.delivery_address.full_name}
      ${order.delivery_address.address_line_1}
      ${order.delivery_address.city}, ${order.delivery_address.state} - ${order.delivery_address.postal_code}
      Phone: ${order.delivery_address.phone}
      
      ORDER ITEMS:
      ${order.order_items.map(item => 
        `${item.product_name} x ${item.quantity} = ₹${item.total_price}`
      ).join('\n')}
      
      TOTAL AMOUNT: ₹${order.total_amount}
      
      Thank you for shopping with Pansarika!
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.order_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-8">{error || 'The order you are looking for does not exist.'}</p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="bg-green-50 px-6 py-4 border-b border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Order #{order.order_number}</h2>
                <p className="text-gray-600">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={downloadInvoice}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Order Status</h3>
                <p className="text-gray-600 capitalize">{order.status.replace('_', ' ')}</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Estimated Delivery</h3>
                <p className="text-gray-600">
                  {new Date(order.estimated_delivery).toLocaleDateString()}
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                  <span className="text-purple-600 font-bold">₹</span>
                </div>
                <h3 className="font-semibold text-gray-900">Total Amount</h3>
                <p className="text-gray-600">{formatPrice(order.total_amount)}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.order_items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product_image || 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.product_name}</h4>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-gray-600">Price: {formatPrice(item.unit_price)} each</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(item.total_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Delivery Address
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900">{order.delivery_address.full_name}</p>
                <p className="text-gray-700">{order.delivery_address.address_line_1}</p>
                {order.delivery_address.address_line_2 && (
                  <p className="text-gray-700">{order.delivery_address.address_line_2}</p>
                )}
                <p className="text-gray-700">
                  {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.postal_code}
                </p>
                <p className="text-gray-700 flex items-center mt-2">
                  <Phone className="h-4 w-4 mr-2" />
                  {order.delivery_address.phone}
                </p>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Payment Method:</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-700">Payment Status:</span>
                  <span className={`font-semibold capitalize ${
                    order.payment_status === 'paid' ? 'text-green-600' : 
                    order.payment_status === 'cod_pending' ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {order.payment_status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={`/order-tracking/${order.id}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            <Truck className="h-5 w-5 mr-2" />
            Track Order
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};