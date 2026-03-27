import { useCallback } from 'react';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const useRazorpay = () => {
  const loadRazorpay = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const createOrder = useCallback(async (amount: number, currency = 'INR') => {
    try {
      // In production, this should call your backend API
      // For demo purposes, we'll create a mock order
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        id: orderId,
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        status: 'created'
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }, []);

  const openRazorpay = useCallback(async (options: Omit<RazorpayOptions, 'key'>) => {
    const isLoaded = await loadRazorpay();
    
    if (!isLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    const razorpayOptions: RazorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1234567890', // Demo key
      ...options,
    };

    const razorpay = new window.Razorpay(razorpayOptions);
    razorpay.open();
  }, [loadRazorpay]);

  return {
    createOrder,
    openRazorpay,
  };
};