import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Filter } from 'lucide-react';
import { supabase, formatPrice } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface Transaction {
  id: string;
  transaction_type: string;
  payment_method: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  order_id: string;
}

export const TransactionHistorySection: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchTransactions();
  }, [user, filter]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return '💳';
      case 'refund':
        return '↩️';
      case 'wallet_credit':
        return '💰';
      case 'wallet_debit':
        return '💸';
      default:
        return '💳';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'success', label: 'Successful' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <LoadingSpinner size="lg" className="h-32" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-600">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">{getTransactionIcon(transaction.transaction_type)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {transaction.description || `${transaction.transaction_type.replace('_', ' ').toUpperCase()}`}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{transaction.payment_method}</span>
                      <span>•</span>
                      <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                      {transaction.order_id && (
                        <>
                          <span>•</span>
                          <span>Order #{transaction.order_id.slice(-8)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    transaction.transaction_type === 'refund' || transaction.transaction_type === 'wallet_credit'
                      ? 'text-green-600'
                      : 'text-gray-900'
                  }`}>
                    {transaction.transaction_type === 'refund' || transaction.transaction_type === 'wallet_credit' ? '+' : '-'}
                    {formatPrice(transaction.amount)}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};