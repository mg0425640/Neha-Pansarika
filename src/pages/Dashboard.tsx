import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Sun, Cloud, CloudRain, User, Heart, Package, CreditCard, Lock, ChevronRight, Calendar, Phone, Mail, CreditCard as Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWeather } from '../hooks/useWeather';
import { useWishlist } from '../hooks/useWishlist';
import { ProfileSection } from '../components/dashboard/ProfileSection';
import { AddressSection } from '../components/dashboard/AddressSection';
import { WishlistSection } from '../components/dashboard/WishlistSection';
import { OrderHistorySection } from '../components/dashboard/OrderHistorySection';
import { TransactionHistorySection } from '../components/dashboard/TransactionHistorySection';
import { PasswordSection } from '../components/dashboard/PasswordSection';

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState('Mumbai, Maharashtra');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSection, setActiveSection] = useState('overview');
  
  const { weather, loading: weatherLoading } = useWeather({ 
    city: selectedLocation.split(',')[0] 
  });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getWeatherIcon = (description: string) => {
    if (description.includes('rain')) return <CloudRain className="h-6 w-6 text-blue-500" />;
    if (description.includes('cloud')) return <Cloud className="h-6 w-6 text-gray-500" />;
    return <Sun className="h-6 w-6 text-yellow-500" />;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatLastLogin = (lastLogin: string) => {
    const date = new Date(lastLogin);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <User className="h-5 w-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
    { id: 'addresses', label: 'Addresses', icon: <MapPin className="h-5 w-5" /> },
    { id: 'wishlist', label: 'Wishlist', icon: <Heart className="h-5 w-5" /> },
    { id: 'orders', label: 'Order History', icon: <Package className="h-5 w-5" /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'password', label: 'Password', icon: <Lock className="h-5 w-5" /> },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'addresses':
        return <AddressSection />;
      case 'wishlist':
        return <WishlistSection />;
      case 'orders':
        return <OrderHistorySection />;
      case 'transactions':
        return <TransactionHistorySection />;
      case 'password':
        return <PasswordSection />;
      default:
        return (
          <div className="space-y-6">
            {/* Weather and Location Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Current Location</h3>
                <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                  Change Location
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <MapPin className="h-5 w-5 text-green-600" />
                <span className="text-gray-900 font-medium">{selectedLocation}</span>
              </div>
              
              {weather && !weatherLoading && (
                <div className="mt-4 flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    {getWeatherIcon(weather.description)}
                    <span className="text-2xl font-bold text-gray-900">{weather.temperature}°C</span>
                  </div>
                  <div className="text-gray-600">
                    <p className="capitalize">{weather.description}</p>
                    <p className="text-sm">Humidity: {weather.humidity}%</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                    <p className="text-gray-600 text-sm">Total Orders</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                    <p className="text-gray-600 text-sm">Wishlist Items</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">₹2,450</p>
                    <p className="text-gray-600 text-sm">Total Spent</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Order #PN20241201-0001 delivered</p>
                    <p className="text-sm text-gray-600">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Heart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Added 3 items to wishlist</p>
                    <p className="text-sm text-gray-600">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getGreeting()}, {profile?.full_name || 'User'}! 👋
              </h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{formatTime(currentTime)}</span>
                </div>
                {profile?.last_login && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Last login: {formatLastLogin(profile.last_login)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome to your dashboard</p>
              <p className="text-lg font-semibold text-green-600">Pansarika</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};