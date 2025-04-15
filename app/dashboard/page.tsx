// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, DollarSign } from 'lucide-react';

type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  account: string;
  counterparty: string;
  date: string;
  reference: string;
};

export default function TransactionDashboard() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/transactions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Please sign in to view your transactions</p>
      </div>
    );
  }

  const totalBalance = transactions.reduce((sum, transaction) => {
    return sum + (transaction.type === 'credit' ? transaction.amount : -transaction.amount);
  }, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transaction Dashboard</h1>
        <button 
          onClick={fetchTransactions} 
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          <RefreshCcw size={16} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm uppercase font-semibold mb-2">Current Balance</h2>
          <div className="flex items-center">
            <DollarSign size={24} className="text-blue-600 mr-2" />
            <span className="text-2xl font-bold">₹{totalBalance.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm uppercase font-semibold mb-2">Income</h2>
          <div className="flex items-center">
            <ArrowDownLeft size={24} className="text-green-600 mr-2" />
            <span className="text-2xl font-bold">₹{transactions
              .filter(t => t.type === 'credit')
              .reduce((sum, t) => sum + t.amount, 0)
              .toFixed(2)}</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm uppercase font-semibold mb-2">Expenses</h2>
          <div className="flex items-center">
            <ArrowUpRight size={24} className="text-red-600 mr-2" />
            <span className="text-2xl font-bold">₹{transactions
              .filter(t => t.type === 'debit')
              .reduce((sum, t) => sum + t.amount, 0)
              .toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <h2 className="p-4 border-b font-semibold">Recent Transactions</h2>
        
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {loading ? 'Loading transactions...' : 'No transactions found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counterparty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.type === 'credit' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Credit
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Debit
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        ₹{transaction.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.counterparty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}