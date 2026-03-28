import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { LocationSelector } from '../ui/LocationSelector';
import { SearchBar } from '../ui/SearchBar';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { state: cartState } = useCart();
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const handleAuthAction = (action: 'signin' | 'signup') => {
    setIsUserMenuOpen(false);
    navigate(action === 'signin' ? '/signin' : '/signup');
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white hover:text-green-100 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <button 
              onClick={handleLogoClick}
              className="flex items-center space-x-2 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">P</span>
              </div>
              <span className="text-white font-bold text-xl ml-2">Pansarika</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-white hover:text-green-100 transition-colors text-sm font-medium">
              Home
            </Link>
            <Link to="/categories" className="text-white hover:text-green-100 transition-colors text-sm font-medium">
              Categories
            </Link>
            <Link to="/offers" className="text-white hover:text-green-100 transition-colors text-sm font-medium">
              Offers
            </Link>
            <Link to="/contact" className="text-white hover:text-green-100 transition-colors text-sm font-medium">
              Contact
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:block flex-1 max-w-2xl mx-8">
            <SearchBar />
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Location Selector */}
            <div className="hidden md:block">
              <LocationSelector />
            </div>

            {/* Cart */}
            <button 
              onClick={handleCartClick}
              className="relative text-white hover:text-green-100 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartState.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartState.totalItems}
                </span>
              )}
            </button>

            {/* User Menu / Auth */}
            <div className="relative">
              {authLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="text-white hover:text-green-100 transition-colors"
                  >
                    <User className="h-6 w-6" />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <Link
                          to="/addresses"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Addresses
                        </Link>
                        <hr className="my-2" />
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAuthAction('signin')}
                    className="text-white hover:text-green-100 transition-colors text-sm font-medium hidden sm:block"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleAuthAction('signup')}
                    className="bg-white text-green-600 hover:bg-green-50 transition-colors px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    Sign Up
                  </button>
                  {/* Mobile auth buttons */}
                  <button
                    onClick={() => handleAuthAction('signin')}
                    className="sm:hidden text-white hover:text-green-100 transition-colors"
                  >
                    <LogIn className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-4">
          <SearchBar />
        </div>

        {/* Mobile Location Selector */}
        <div className="md:hidden pb-4">
          <LocationSelector />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-green-500">
          <div className="px-4 py-2 space-y-2">
            <Link 
              to="/" 
              className="block text-white hover:text-green-100 py-2 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/categories" 
              className="block text-white hover:text-green-100 py-2 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Categories
            </Link>
            <Link 
              to="/offers" 
              className="block text-white hover:text-green-100 py-2 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Offers
            </Link>
            <Link
              to="/contact"
              className="block text-white hover:text-green-100 py-2 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            {!user && (
              <>
                <hr className="border-green-500" />
                <Link
                  to="/signin"
                  className="block text-white hover:text-green-100 py-2 text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="block text-white hover:text-green-100 py-2 text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};