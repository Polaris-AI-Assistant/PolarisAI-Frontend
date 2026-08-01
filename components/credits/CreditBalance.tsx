/**
 * Credit Balance Component
 * 
 * Displays the user's current credit balance with:
 * - Real-time balance updates
 * - Low balance warning
 * - Link to view transaction history
 * - Visual credit indicator
 * 
 * Usage:
 * <CreditBalance />
 */

'use client';

import { useEffect, useState } from 'react';
import { Coins, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import './CreditBalance.css';

interface CreditData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  isLow: boolean;
  lowBalanceThreshold: number;
}

interface CreditBalanceProps {
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export default function CreditBalance({
  className = '',
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 60000 // refresh every 60 seconds
}: CreditBalanceProps) {
  const [credits, setCredits] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchCredits = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      if (!token) {
        console.log('[CreditBalance] No auth token found in storage');
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      console.log('[CreditBalance] Fetching credits from:', `${apiUrl}/api/credits/balance`);
      
      const response = await fetch(`${apiUrl}/api/credits/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[CreditBalance] Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication expired');
        } else if (response.status === 400) {
          const errorData = await response.json();
          console.error('[CreditBalance] Error 400:', errorData);
          setError(errorData.error || 'Failed to fetch credits');
        } else if (response.status === 404) {
          console.error('[CreditBalance] Error 404: API endpoint not found');
          setError('Credits system not initialized');
        } else {
          const errorText = await response.text();
          console.error('[CreditBalance] Error:', response.status, errorText);
          setError('Failed to fetch credits');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('[CreditBalance] Response data:', data);
      
      if (data.success) {
        setCredits({
          balance: data.balance,
          totalEarned: data.totalEarned,
          totalSpent: data.totalSpent,
          isLow: data.isLow,
          lowBalanceThreshold: data.lowBalanceThreshold
        });
        setError(null);
      } else {
        console.error('[CreditBalance] API returned success=false:', data);
        setError(data.error || 'Failed to fetch credits');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('[CreditBalance] Network error:', err);
      setError('Network error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchCredits, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Listen for credit updates from other components
  useEffect(() => {
    const handleCreditUpdate = () => {
      fetchCredits();
    };

    window.addEventListener('credits-updated', handleCreditUpdate);
    return () => window.removeEventListener('credits-updated', handleCreditUpdate);
  }, []);

  if (loading) {
    return (
      <div className={`credit-balance-loading ${className}`}>
        <div className="animate-pulse flex items-center space-x-2">
          <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
          <div className="h-4 w-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`credit-balance-error ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!credits) {
    return null;
  }

  const balancePercentage = (credits.balance / credits.totalEarned) * 100;
  const isVeryLow = credits.balance < credits.lowBalanceThreshold / 2;

  return (
    <div className={`credit-balance ${className}`}>
      <div className="relative">
        {/* Main Balance Display */}
        <div
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
            isVeryLow
              ? 'bg-red-50 border border-red-200 text-red-700'
              : credits.isLow
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          } hover:shadow-md`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => window.location.href = '/dashboard/credits'}
        >
          <Coins className="h-5 w-5" />
          <span className="font-semibold text-lg">
            {credits.balance.toLocaleString()}
          </span>
          <span className="text-sm opacity-80">credits</span>
          
          {/* Warning Icon */}
          {credits.isLow && (
            <AlertTriangle className="h-4 w-4 ml-1" />
          )}
          
          {/* Info Icon */}
          {!credits.isLow && (
            <Info className="h-4 w-4 ml-1 opacity-50" />
          )}
        </div>

        {/* Tooltip / Details */}
        {showTooltip && (
          <div className="absolute z-50 top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
            <div className="space-y-3">
              {/* Balance Bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Balance</span>
                  <span>{balancePercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isVeryLow
                        ? 'bg-red-500'
                        : credits.isLow
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(balancePercentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Balance:</span>
                  <span className="font-semibold">{credits.balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Earned:</span>
                  <span className="font-semibold text-green-600">
                    +{credits.totalEarned.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Spent:</span>
                  <span className="font-semibold text-red-600">
                    -{credits.totalSpent.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Warning Message */}
              {credits.isLow && (
                <div className={`flex items-start space-x-2 p-2 rounded ${
                  isVeryLow ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  <TrendingDown className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs">
                    {isVeryLow
                      ? 'Your balance is critically low. Purchase more credits to continue.'
                      : 'Your balance is running low. Consider purchasing more credits.'}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => window.location.href = '/dashboard/credits'}
                className={`w-full py-2 px-4 rounded font-medium text-sm transition-colors ${
                  credits.isLow
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {credits.isLow ? 'Purchase Credits' : 'View Details'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Extended Details (Optional) */}
      {showDetails && (
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Available:</span>
            <span className="font-semibold">{credits.balance}</span>
          </div>
          <div className="flex justify-between">
            <span>Earned:</span>
            <span className="font-semibold text-green-600">+{credits.totalEarned}</span>
          </div>
          <div className="flex justify-between">
            <span>Spent:</span>
            <span className="font-semibold text-red-600">-{credits.totalSpent}</span>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard/credits'}
            className="w-full mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          >
            Manage Credits
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Utility function to trigger credit balance refresh
 * Call this from other components after actions that affect credits
 */
export const refreshCreditBalance = () => {
  window.dispatchEvent(new Event('credits-updated'));
};
