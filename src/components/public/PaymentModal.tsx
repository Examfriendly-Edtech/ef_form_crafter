import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

interface PaymentModalProps {
  isOpen?: boolean;
  amount: number;
  currency: string;
  courseTitle: string;
  onClose: () => void;
  onPaymentSuccess: (paymentDetails: {
    method: 'stripe' | 'paypal';
    amount: number;
    transactionId: string;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  amount,
  currency,
  courseTitle,
  onClose,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('884');
  const [cardName, setCardName] = useState('Alex Morgan');
  const [isProcessing, setIsProcessing] = useState(false);


  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const txId =
        paymentMethod === 'stripe'
          ? `pi_${Math.random().toString(36).substring(2, 12)}`
          : `PAYID-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      onPaymentSuccess({
        method: paymentMethod,
        amount,
        transactionId: txId,
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted Checkout
          </div>
          <h2 className="text-xl font-bold tracking-tight">Complete Course Registration</h2>
          <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-3">
            <span className="text-xs text-slate-300 truncate max-w-[220px]">{courseTitle}</span>
            <span className="text-2xl font-black text-white">
              ${amount} <span className="text-xs font-normal text-slate-300">{currency}</span>
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6 space-y-5">
          {/* Method selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('stripe')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                paymentMethod === 'stripe'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span className="text-xs font-bold">Credit / Debit Card</span>
              <span className="text-[10px] text-slate-400">Powered by Stripe</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('paypal')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                paymentMethod === 'paypal'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                P
              </div>
              <span className="text-xs font-bold">PayPal</span>
              <span className="text-[10px] text-slate-400">Instant Express Checkout</span>
            </button>
          </div>

          {/* Form details */}
          {paymentMethod === 'stripe' ? (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Name on Card
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden font-mono"
                  />
                  <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                    VISA / MC
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Expiration
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Security Code (CVC)
                  </label>
                  <input
                    type="password"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-2">
              <div className="text-xs font-semibold text-blue-900">
                You will be connected to PayPal Sandbox
              </div>
              <p className="text-[11px] text-blue-700">
                Authorized with single-click checkout for ${amount} {currency}.
              </p>
            </div>
          )}

          {/* Guarantee pill */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Money-back guarantee & official seat reservation</span>
          </div>

          {/* Submit button */}
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Secure Payment...
              </span>
            ) : (
              <span>Authorize & Pay ${amount} {currency}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
