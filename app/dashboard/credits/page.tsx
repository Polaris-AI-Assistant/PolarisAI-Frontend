'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, authenticatedFetch } from '../../../lib/auth'
import { CreditCard, Zap, Clock, AlertCircle, Check } from 'lucide-react'

interface BillingSummary {
  subscription: {
    planId: string
    planName: string
    billingCycle: string
    status: string
    currentPeriodEnd: string
    monthlyCredits: number
    cancelAtPeriodEnd: boolean
  } | null
  onFreePlan: boolean
  credits: {
    balance: number
    totalEarned: number
    totalSpent: number
    isLow: boolean
  }
  payments: {
    total: number
    totalSpent: number
  }
}

interface Plan {
  planId: string
  name: string
  description: string
  pricing: {
    monthly: number
    yearly: number
  }
  credits: {
    monthly: number
    trial: number
  }
  features: string[]
  limitations: any
}

interface CreditPack {
  packId: string
  name: string
  credits: number
  price: number
  pricePerCredit: number
  savingsPercentage: number | null
}

interface PaymentHistory {
  id: number
  type: string
  amount: number
  status: string
  planId: string | null
  packId: string | null
  creditsPurchased: number | null
  createdAt: string
  completedAt: string | null
}

export default function CreditsAndBillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [razorpayReady, setRazorpayReady] = useState(false)
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/signin')
      return
    }

    // Load Razorpay script dynamically
    if (!(window as any).Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => setRazorpayReady(true)
      script.onerror = () => console.error('Failed to load Razorpay SDK')
      document.body.appendChild(script)
    } else {
      setRazorpayReady(true)
    }

    loadData()
  }, [])

  const loadData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

      const [summaryRes, plansRes, packsRes, historyRes] = await Promise.all([
        authenticatedFetch(`${apiUrl}/api/billing/summary`),
        fetch(`${apiUrl}/api/billing/plans`),
        fetch(`${apiUrl}/api/billing/credit-packs`),
        authenticatedFetch(`${apiUrl}/api/billing/payment-history?limit=10`)
      ])

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data.summary)
      }

      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data.plans)
      }

      if (packsRes.ok) {
        const data = await packsRes.json()
        setCreditPacks(data.packs)
      }

      if (historyRes.ok) {
        const data = await historyRes.json()
        setPaymentHistory(data.payments)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading billing data:', error)
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId: string, cycle: string) => {
    try {
      setProcessingPayment(true)
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

      // Create Razorpay order
      const orderRes = await authenticatedFetch(`${apiUrl}/api/billing/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', planId, billingCycle: cycle })
      })

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to create order')
      }

      const orderData = await orderRes.json()

      // Initialize Razorpay checkout
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.order.amount * 100,
        currency: orderData.order.currency,
        name: 'Polaris AI',
        description: `Subscribe to ${planId} plan`,
        order_id: orderData.order.id,
        handler: async (response: any) => {
          const verifyRes = await authenticatedFetch(`${apiUrl}/api/billing/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          })

          if (verifyRes.ok) {
            alert('Subscription activated successfully!')
            loadData()
          } else {
            alert('Payment verification failed')
          }
          setProcessingPayment(false)
        },
        modal: { ondismiss: () => setProcessingPayment(false) },
        theme: { color: '#3B82F6' }
      }

      // @ts-ignore
      if (!window.Razorpay) throw new Error('Razorpay SDK not ready. Please wait a moment and try again.')
      // @ts-ignore
      const razorpay = new window.Razorpay(options)
      razorpay.open()

    } catch (error: any) {
      console.error('Error processing subscription:', error)
      alert(error.message || 'Failed to process subscription')
      setProcessingPayment(false)
    }
  }

  const handlePurchaseCredits = async (packId: string) => {
    try {
      setProcessingPayment(true)
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

      const orderRes = await authenticatedFetch(`${apiUrl}/api/billing/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'credit_pack', packId })
      })

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to create order')
      }

      const orderData = await orderRes.json()

      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.order.amount * 100,
        currency: orderData.order.currency,
        name: 'Polaris AI',
        description: 'Purchase credit pack',
        order_id: orderData.order.id,
        handler: async (response: any) => {
          const verifyRes = await authenticatedFetch(`${apiUrl}/api/billing/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          })

          if (verifyRes.ok) {
            alert('Credits purchased successfully!')
            loadData()
          } else {
            alert('Payment verification failed')
          }
          setProcessingPayment(false)
        },
        modal: { ondismiss: () => setProcessingPayment(false) },
        theme: { color: '#3B82F6' }
      }

      // @ts-ignore
      if (!window.Razorpay) throw new Error('Razorpay SDK not ready. Please wait a moment and try again.')
      // @ts-ignore
      const razorpay = new window.Razorpay(options)
      razorpay.open()

    } catch (error: any) {
      console.error('Error purchasing credits:', error)
      alert(error.message || 'Failed to purchase credits')
      setProcessingPayment(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period.')) {
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

      const res = await authenticatedFetch(`${apiUrl}/api/billing/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediately: false })
      })

      if (res.ok) {
        alert('Subscription cancelled. It will remain active until the end of the current period.')
        loadData()
      } else {
        alert('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Credits & Billing</h1>
            <p className="text-gray-400 mt-1">Manage your subscription and credits</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Credits Balance */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Available Credits</h3>
            </div>
            <p className="text-4xl font-bold">{summary?.credits.balance.toLocaleString() || 0}</p>
            {summary?.credits.isLow && (
              <p className="text-sm text-yellow-300 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Low balance
              </p>
            )}
          </div>

          {/* Current Plan */}
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Current Plan</h3>
            </div>
            <p className="text-2xl font-bold">
              {summary?.subscription?.planName || 'Free'}
            </p>
            {summary?.subscription && (
              <p className="text-sm text-gray-400 mt-2">
                {summary.subscription.billingCycle} • {summary.subscription.monthlyCredits} credits/month
              </p>
            )}
          </div>

          {/* Next Renewal */}
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Next Renewal</h3>
            </div>
            {summary?.subscription ? (
              <>
                <p className="text-2xl font-bold">
                  {new Date(summary.subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
                {summary.subscription.cancelAtPeriodEnd && (
                  <p className="text-sm text-red-400 mt-2">Cancelled - will not renew</p>
                )}
              </>
            ) : (
              <p className="text-gray-400">No active subscription</p>
            )}
          </div>
        </div>

        {/* Subscription Plans */}
        {(!summary || summary?.onFreePlan) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Upgrade Your Plan</h2>
              <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-md transition ${
                    billingCycle === 'monthly' ? 'bg-blue-600' : 'hover:bg-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-md transition ${
                    billingCycle === 'yearly' ? 'bg-blue-600' : 'hover:bg-gray-700'
                  }`}
                >
                  Yearly (Save 20%)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.filter(p => p.planId !== 'free').map(plan => (
                <div key={plan.planId} className="bg-gray-800 rounded-xl p-6 flex flex-col">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      ₹{billingCycle === 'monthly' ? plan.pricing.monthly : plan.pricing.yearly}
                    </span>
                    <span className="text-gray-400 ml-2">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>{plan.credits.monthly.toLocaleString()} credits/month</span>
                  </div>

                  <ul className="space-y-2 mb-6 flex-grow">
                    {plan.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.planId, billingCycle)}
                    disabled={processingPayment}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
                  >
                    {processingPayment ? 'Processing...' : 'Subscribe Now'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit Top-ups */}
        {summary && !summary?.onFreePlan && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Purchase Additional Credits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creditPacks.map(pack => (
                <div key={pack.packId} className="bg-gray-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-xl font-semibold">{pack.credits.toLocaleString()} Credits</h3>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold">₹{pack.price}</span>
                    <span className="text-gray-400 text-sm ml-2">₹{pack.pricePerCredit.toFixed(2)}/credit</span>
                  </div>

                  {pack.savingsPercentage && (
                    <div className="mb-4 px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm inline-block">
                      Save {pack.savingsPercentage}%
                    </div>
                  )}

                  <button
                    onClick={() => handlePurchaseCredits(pack.packId)}
                    disabled={processingPayment}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
                  >
                    {processingPayment ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manage Subscription */}
        {summary?.subscription && !summary.subscription.cancelAtPeriodEnd && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Subscription</h2>
            <button
              onClick={handleCancelSubscription}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
            >
              Cancel Subscription
            </button>
          </div>
        )}

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Payment History</h2>
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map(payment => (
                    <tr key={payment.id} className="border-t border-gray-700">
                      <td className="p-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 capitalize">{payment.type.replace('_', ' ')}</td>
                      <td className="p-4">₹{payment.amount}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          payment.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                          payment.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                          'bg-yellow-600/20 text-yellow-400'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
