import React, { useState } from 'react';
import { ShieldAlert, Plus, X, Calendar, CheckSquare, Sparkles } from 'lucide-react';
import { COMMON_ADVICE, FOLLOW_UP_PRESETS } from '../data/adviceData';

export const AdviceSection = ({ 
  adviceList, onUpdateAdvice, 
  nextVisit, onUpdateNextVisit,
  specialNote, onUpdateSpecialNote
}) => {
  const [customAdvice, setCustomAdvice] = useState('');

  const addAdvice = (text) => {
    if (!text) return;
    if (!adviceList.includes(text)) {
      onUpdateAdvice([...adviceList, text]);
    }
    setCustomAdvice('');
  };

  const removeAdvice = (index) => {
    onUpdateAdvice(adviceList.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 mb-5 transition-all">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> 
            Advice & Follow-Up (উপদেশ ও পরবর্তী সাক্ষাত)
            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
              {adviceList.length} items
            </span>
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* Quick Advice Pills */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Medical & Dietary Advice (উপদেশ নির্বাচন করুন):
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-slate-50/70 rounded-xl border border-slate-200/60 mb-2.5">
            {COMMON_ADVICE.map((item, idx) => {
              const isSelected = adviceList.includes(item.bn);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => isSelected ? removeAdvice(adviceList.indexOf(item.bn)) : addAdvice(item.bn)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border text-left cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
                  }`}
                >
                  {item.bn}
                </button>
              );
            })}
          </div>

          {/* Custom Advice Input */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={customAdvice}
              onChange={(e) => setCustomAdvice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAdvice(customAdvice)}
              placeholder="অন্য কোনো নির্দিষ্ট উপদেশ লিখুন..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => addAdvice(customAdvice)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Advice
            </button>
          </div>

          {/* Active Advice Items */}
          {adviceList.length > 0 && (
            <div className="space-y-1.5 mt-3">
              {adviceList.map((adv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-1.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs text-slate-800"
                >
                  <span className="font-medium">• {adv}</span>
                  <button
                    type="button"
                    onClick={() => removeAdvice(idx)}
                    className="text-slate-400 hover:text-emerald-700 transition-colors ml-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Next Visit / Follow-up */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" /> Next Visit (পরবর্তী সাক্ষাত)
            </label>
            <input
              type="text"
              value={nextVisit}
              onChange={(e) => onUpdateNextVisit(e.target.value)}
              placeholder="e.g. ৭ দিন পর / টেস্ট রিপোর্ট সহ"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-teal-900 focus:ring-1 focus:ring-teal-500 mb-2"
            />
            <div className="flex flex-wrap gap-1">
              {FOLLOW_UP_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onUpdateNextVisit(p.customText || p.label)}
                  className="px-2 py-0.5 rounded text-[11px] bg-white border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Special Note / Referral (বিশেষ নির্দেশনা / রেফারেল)
            </label>
            <textarea
              rows={3}
              value={specialNote || ''}
              onChange={(e) => onUpdateSpecialNote(e.target.value)}
              placeholder="জরুরী প্রয়োজনে হাসপাতালে যোগাযোগ করুন..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-1 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdviceSection;
