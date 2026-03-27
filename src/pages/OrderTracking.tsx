import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone, RotateCcw, X } from 'lucide-react';
import { supabase, formatPrice } from '../lib/supabase';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface OrderTracking {
  id: string;
  status: string;
  title: string;
  description: string;
  location: string;
  is_current: boolean;
  created_at: string;
}

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
  delivered_at: string;
  cancelled_at: string;
  cancellation_reason: string;
  order_items: Array<{
    id: string;
    product_name: string;
    product_image: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  tracking: OrderTracking[];
}

export const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [selectedReturnItem, setSelectedReturnItem] = useState<string | null>(null);

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

      const { data: trackingData, error: trackingError } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (trackingError) throw trackingError;

      setOrder({
        ...orderData,
        order_items: itemsData || [],
        tracking: trackingData || [],
      });
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancelReason,
        })
        .eq('id', order.id);

      if (error) throw error;

      // Add tracking entry
      await supabase
        .from('order_tracking')
        .insert({
          order_id: order.id,
          status: 'cancelled',
          title: 'Order Cancelled',
          description: `Order cancelled: ${cancelReason}`,
          is_current: true,
        });

      setShowCancelModal(false);
      fetchOrder(); // Refresh order data
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  };

  const handleReturnRequest = async () => {
    if (!order || !returnReason.trim() || !selectedReturnItem) return;

    try {
      const { error } = await supabase
        .from('return_requests')
        .insert({
          order_id: order.id,
          order_item_id: selectedReturnItem,
          user_id: order.user_id,
          reason: returnReason,
          description: returnDescription,
          status: 'pending',
        });

      if (error) throw error;

      setShowReturnModal(false);
      setReturnReason('');
      setReturnDescription('');
      setSelectedReturnItem(null);
      alert('Return request submitted successfully. We will contact you soon.');
    } catch (error) {
      console.error('Error submitting return request:', error);
      alert('Failed to submit return request. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-orange-500" />;
      case 'confirmed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'processing':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'shipped':
      case 'out_for_delivery':
        return <Truck className="h-6 w-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'cancelled':
        return <X className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  const canCancelOrder = () => {
    return order && ['pending', 'confirmed'].includes(order.status);
  };

  const canReturnOrder = () => {
    return order && order.status === 'delivered' && order.delivered_at &&
           new Date().getTime() - new Date(order.delivered_at).getTime() <= 7 * 24 * 60 * 60 * 1000; // 7 days
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/orders"
              className="inline-flex items-center text-green-600 font-semibold hover:text-green-700"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Orders
            </Link>
          </div>
          <div className="flex space-x-3">
            {canCancelOrder() && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50"
              >
                Cancel Order
              </button>
            )}
            {canReturnOrder() && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-4 py-2 border border-orange-300 text-orange-600 font-semibold rounded-lg hover:bg-orange-50"
              >
                Return Items
              </button>
            )}
          </div>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
              <p className="text-gray-600">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{formatPrice(order.total_amount)}</p>
              <p className="text-gray-600 capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(order.status)}
              <div>
                <p className="font-semibold text-gray-900 capitalize">{order.status.replace('_', ' ')}</p>
                <p className="text-sm text-gray-600">Current Status</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-semibold text-gray-900">{order.delivery_address.city}</p>
                <p className="text-sm text-gray-600">Delivery Location</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-blue-500" />
              <div>
                <p className="font-semibold text-gray-900">
                  {order.delivered_at 
                    ? new Date(order.delivered_at).toLocaleDateString()
                    : new Date(order.estimated_delivery).toLocaleDateString()
                  }
                </p>
                <p className="text-sm text-gray-600">
                  {order.delivered_at ? 'Delivered' : 'Estimated Delivery'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Tracking */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Tracking</h2>
          
          <div className="space-y-6">
            {order.tracking.map((track, index) => (
              <div key={track.id} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  track.is_current ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {getStatusIcon(track.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${track.is_current ? 'text-green-600' : 'text-gray-900'}`}>
                      {track.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(track.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {track.description && (
                    <p className="text-gray-600 mt-1">{track.description}</p>
                  )}
                  
                  {track.location && (
                    <p className="text-sm text-gray-500 mt-1">📍 {track.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h2>
          
          <div className="space-y-4">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.product_image || 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg'}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-green-600" />
            Delivery Address
          </h2>
          
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

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Order</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select a reason</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Found better price elsewhere">Found better price elsewhere</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Delivery taking too long">Delivery taking too long</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelOrder}
                  disabled={!cancelReason}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  Cancel Order
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Keep Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return Items Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Items</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select item to return
                </label>
                <select
                  value={selectedReturnItem || ''}
                  onChange={(e) => setSelectedReturnItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select an item</option>
                  {order.order_items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.product_name} (Qty: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for return
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a reason</option>
                  <option value="Defective product">Defective product</option>
                  <option value="Wrong item delivered">Wrong item delivered</option>
                  <option value="Product damaged">Product damaged</option>
                  <option value="Not as described">Not as described</option>
                  <option value="Quality issues">Quality issues</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe the issue..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleReturnRequest}
                  disabled={!returnReason || !selectedReturnItem}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
                >
                  Submit Return
                </button>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};