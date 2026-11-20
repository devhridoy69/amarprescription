import React from 'react';
import { 
  X, Check, Crown, Sparkles, MessageCircle, Headphones 
} from 'lucide-react';
import { getPlansConfig } from '../data/plansConfig';

export const PricingModal = ({ 
  isOpen, 
  onClose, 
  currentPlan = 'free', 
  plansConfig = null 
}) => {
  if (!isOpen) return null;

  const config = plansConfig || getPlansConfig();
  const plans = config.plans || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="relative px-6 py-6 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between border-b border-teal-900/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-400 text-slate-950 rounded-xl font-bold shadow-xs flex items-center justify-center">
                <Crown className="w-5 h-5 fill-slate-950" />
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Amar Prescription Premium Plans
              </h2>
            </div>
            <p className="text-xs text-teal-200/80">
              আপনার প্রেসক্রিপশন ব্র্যান্ডিং, মাল্টিপল চেম্বার এবং ক্লাউড ব্যাকআপ আনলক করুন
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Dynamic Plans Cards */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6">
          {currentPlan === 'free' && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md font-bold text-[10px]">
                  ফ্রি মোড সক্রিয়
                </span>
                <span className="text-slate-700 font-semibold">
                  বর্তমান সীমা: প্রতি মাসে ১০০টি প্রেসক্রিপশন, ব্র্যান্ডিং ওয়াটারমার্কযুক্ত।
                </span>
              </div>
              <span className="text-amber-900 font-black text-[11px] flex items-center gap-1">
                <span>🔒 ক্লিন প্যাড ও স্মার্ট কিউআর আনলক করতে আপগ্রেড করুন</span>
              </span>
            </div>
          )}

          <div className={`grid grid-cols-1 ${plans.length === 1 ? 'max-w-md mx-auto' : plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-5 sm:gap-6 items-stretch`}>
            
            {plans.map((p) => {
              const isCurrent = currentPlan === p.id;
              const isAmber = p.color === 'amber' || p.popular;

              return (
                <div 
                  key={p.id}
                  className={`rounded-3xl p-6 border-2 flex flex-col justify-between transition-all relative ${
                    isCurrent 
                      ? isAmber
                        ? 'bg-amber-50/70 border-amber-500 shadow-xl ring-2 ring-amber-500/20'
                        : 'bg-teal-50/70 border-teal-600 shadow-xl ring-2 ring-teal-500/20'
                      : isAmber
                        ? 'bg-white border-slate-200 hover:border-amber-400 shadow-md'
                        : 'bg-white border-slate-200 hover:border-teal-300 shadow-sm'
                  }`}
                >
                  {p.popular && (
                    <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-black px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>সবচেয়ে জনপ্রিয় (Popular)</span>
                    </div>
                  )}

                  {isCurrent && !p.popular && (
                    <div className="absolute -top-3.5 right-6 bg-teal-700 text-white text-[11px] font-black px-3 py-0.5 rounded-full shadow-xs">
                      বর্তমান সক্রিয় প্যাক (Active)
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        isAmber ? 'bg-amber-100 text-amber-950' : 'bg-teal-100 text-teal-900'
                      }`}>
                        {p.badge || 'Pro'}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {p.period}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      {p.tagline}
                    </p>

                    <div className="flex items-baseline gap-1 mb-5 pb-5 border-b border-slate-100">
                      <span className="text-3xl font-black text-slate-900">৳{p.price}</span>
                      <span className="text-xs font-bold text-slate-500">/ {p.period}</span>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 mb-6">
                      {(p.features || []).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isAmber ? 'bg-amber-100 text-amber-900' : 'bg-teal-100 text-teal-800'
                          }`}>
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="font-medium leading-relaxed">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <a
                      href={`https://wa.me/88${(config.contact.whatsapp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, I want to activate Amar Prescription ${p.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-black text-center flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer text-white ${
                        isAmber
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-md'
                          : 'bg-teal-700 hover:bg-teal-800'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{isCurrent ? 'প্যাক রিনিউ করতে যোগাযোগ' : `${p.name}-এ আপগ্রেড করুন`}</span>
                    </a>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Payment & Support Info Footer */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="font-bold text-slate-800 block">সরাসরি পেমেন্ট ও অ্যাক্টিভেশন সহায়তা:</span>
              <span className="text-slate-500 font-medium">bKash / Nagad: <strong className="font-mono text-teal-800">{config.contact.bkash}</strong></span>
            </div>
            <a
              href={`https://wa.me/88${(config.contact.whatsapp || '').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Headphones className="w-4 h-4" />
              <span>WhatsApp Support ({config.contact.whatsapp})</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PricingModal;
