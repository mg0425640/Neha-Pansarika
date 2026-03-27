import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Truck, Shield, Plus, CreditCard as Edit } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRazorpay } from '../hooks/useRazorpay';
import { supabase, formatPrice, UserAddress } from '../lib/supabase';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const Checkout: React.FC = () => {
  const { state: cartState, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { createOrder, openRazorpay } = useRazorpay();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('cod');
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: '',
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address_line_1: '',
    address_line_2: '',
    landmark: '',
    city: '',
    state: '',
    postal_code: '',
    address_type: 'home' as 'home' | 'work' | 'other',
    delivery_instructions: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    
    if (cartState.items.length === 0) {
      navigate('/cart');
      return;
    }

    fetchAddresses();
  }, [user, cartState.items.length, navigate]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAddresses(data || []);
      if (data && data.length > 0) {
        setSelectedAddress(data.find(addr => addr.is_default) || data[0]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          ...newAddress,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setAddresses([...addresses, data]);
      setSelectedAddress(data);
      setShowAddressForm(false);
      setNewAddress({
        title: '',
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        address_line_1: '',
        address_line_2: '',
        landmark: '',
        city: '',
        state: '',
        postal_code: '',
        address_type: 'home',
        delivery_instructions: '',
      });
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address. Please try again.');
    }
  };

  const createOrderInDatabase = async (paymentData?: any) => {
    if (!user || !selectedAddress) return null;

    try {
      // Generate order number
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData || `PN${Date.now()}`;

      // Create order
      const orderData = {
        user_id: user.id,
        order_number: orderNumber,
        status: 'pending',
        payment_status: paymentMethod === 'cod' ? 'cod_pending' : 'pending',
        payment_method: paymentMethod,
        payment_id: paymentData?.razorpay_payment_id || null,
        razorpay_order_id: paymentData?.razorpay_order_id || null,
        razorpay_payment_id: paymentData?.razorpay_payment_id || null,
        razorpay_signature: paymentData?.razorpay_signature || null,
        subtotal: cartState.subtotal,
        delivery_fee: cartState.deliveryFee,
        tax_amount: cartState.taxAmount,
        discount_amount: cartState.discountAmount,
        coupon_code: cartState.couponCode,
        total_amount: cartState.totalAmount,
        delivery_address: selectedAddress,
        estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartState.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        product_image: item.product.image_url,
        product_brand: item.product.brand?.name || '',
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        weight: item.product.weight,
        unit: item.product.unit,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create initial order tracking
      const { error: trackingError } = await supabase
        .from('order_tracking')
        .insert({
          order_id: order.id,
          status: 'pending',
          title: 'Order Placed',
          description: 'Your order has been placed successfully',
          is_current: true,
        });

      if (trackingError) throw trackingError;

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'razorpay') {
        // Create Razorpay order
        const razorpayOrder = await createOrder(cartState.totalAmount);
        
        // Open Razorpay checkout
        await openRazorpay({
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'Pansarika',
          description: 'Grocery Order Payment',
          order_id: razorpayOrder.id,
          handler: async (response: any) => {
            try {
              // Create order in database with payment details
              const order = await createOrderInDatabase({
                razorpay_order_id: razorpayOrder.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (order) {
                // Clear cart
                await clearCart();
                
                // Navigate to success page
                navigate(`/order-success/${order.id}`);
              }
            } catch (error) {
              console.error('Error processing payment:', error);
              alert('Payment successful but order creation failed. Please contact support.');
            }
          },
          prefill: {
            name: profile?.full_name || '',
            email: user?.email || '',
            contact: profile?.phone || '',
          },
          theme: {
            color: '#16a34a',
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
        });
      } else {
        // COD order
        const order = await createOrderInDatabase();
        
        if (order) {
          // Clear cart
          await clearCart();
          
          // Navigate to success page
          navigate(`/order-success/${order.id}`);
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (addressLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-1">Review your order and complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Delivery Address
                </h2>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="inline-flex items-center text-green-600 font-medium hover:text-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No addresses found</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedAddress?.id === address.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{address.title}</h3>
                            {address.is_default && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium">{address.full_name}</p>
                          <p className="text-gray-600">{address.phone}</p>
                          <div className="mt-2 text-gray-700">
                            <p>{address.address_line_1}</p>
                            {address.address_line_2 && <p>{address.address_line_2}</p>}
                            {address.landmark && <p>Near {address.landmark}</p>}
                            <p>{address.city}, {address.state} - {address.postal_code}</p>
                          </div>
                        </div>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Address Form */}
              {showAddressForm && (
                <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Address</h3>
                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Title
                        </label>
                        <input
                          type="text"
                          value={newAddress.title}
                          onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="e.g., Home, Office"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={newAddress.full_name}
                          onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={newAddress.address_line_1}
                        onChange={(e) => setNewAddress({ ...newAddress, address_line_1: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="House/Flat/Building No., Street Name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PIN Code
                        </label>
                        <input
                          type="text"
                          value={newAddress.postal_code}
                          onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                Payment Method
              </h2>

              <div className="space-y-3">
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'cod'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center">
                      {paymentMethod === 'cod' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Cash on Delivery</h3>
                      <p className="text-sm text-gray-600">Pay when your order arrives</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'razorpay'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('razorpay')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center">
                      {paymentMethod === 'razorpay' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Online Payment</h3>
                      <p className="text-sm text-gray-600">Pay securely with Razorpay</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {cartState.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.image_url || 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Price Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cartState.totalItems} items)</span>
                  <span className="font-semibold">{formatPrice(cartState.subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">
                    {cartState.deliveryFee === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      formatPrice(cartState.deliveryFee)
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (5%)</span>
                  <span className="font-semibold">{formatPrice(cartState.taxAmount)}</span>
                </div>
                
                {cartState.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span className="font-semibold">-{formatPrice(cartState.discountAmount)}</span>
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span>{formatPrice(cartState.totalAmount)}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handlePlaceOrder}
                disabled={loading || !selectedAddress}
                className="w-full mt-6 bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Place Order • ${formatPrice(cartState.totalAmount)}`
                )}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Fast Delivery</p>
                    <p className="text-sm text-gray-600">Delivered within 2 days</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Secure Payments</p>
                    <p className="text-sm text-gray-600">100% secure transactions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};