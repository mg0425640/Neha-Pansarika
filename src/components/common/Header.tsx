import React, { useState } from 'react';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { LocationSelector } from '../ui/LocationSelector';
import { SearchBar } from '../ui/SearchBar';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { state: cartState } = useCart();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">P</span>
              </div>
              <span className="text-white font-bold text-xl">Pansarika</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-white hover:text-green-100 transition-colors text-sm font-medium">
              Home
            </a>
            <a href="#" className="text-white hover:text-green-100 transition-colors text-sm font-medium">
              Categories
            </a>
            <a href="#" className="text-white hover:text-green-100 transition-colors text-sm font-medium">
              Offers
            </a>
            <a href="#" className="text-white hover:text-green-100 transition-colors text-sm font-medium">
              About
            </a>
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
            <button className="relative text-white hover:text-green-100 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartState.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartState.totalItems}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="text-white hover:text-green-100 transition-colors"
              >
                <User className="h-6 w-6" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Profile
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Orders
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Settings
                  </a>
                  <hr className="my-2" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
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
            <a href="#" className="block text-white hover:text-green-100 py-2 text-sm font-medium">
              Home
            </a>
            <a href="#" className="block text-white hover:text-green-100 py-2 text-sm font-medium">
              Categories
            </a>
            <a href="#" className="block text-white hover:text-green-100 py-2 text-sm font-medium">
              Offers
            </a>
            <a href="#" className="block text-white hover:text-green-100 py-2 text-sm font-medium">
              About
            </a>
          </div>
        </div>
      )}
    </header>
  );
};