import React from 'react';
import { X, Sparkles, Check, ArrowRight, BookOpen, Stethoscope } from 'lucide-react';
import { PRESCRIPTION_TEMPLATES } from '../data/templatesData';
import { StackedFraction, renderWithFractions } from './StackedFraction';

export const TemplatesModal = ({ isOpen, onClose, onSelectTemplate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                1-Click Ready Prescription Protocols (রেডিমেড টেমপ্লেট)
              </h2>
              <p className="text-xs text-slate-500">
                এক ক্লিকে সম্পূর্ণ প্রেসক্রিপশন লোড করুন (উপসর্গ, ভাইটালস, ঔষধ, ডোজ ও উপদেশ সহ)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates List */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-3.5">
          {PRESCRIPTION_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/40 hover:bg-teal-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                    {tpl.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {tpl.title}
                  </h3>
                </div>

                <p className="text-xs font-semibold text-teal-900">
                  Diagnosis: <span className="font-normal text-slate-700">{tpl.diagnosis}</span>
                </p>

                {/* Medicines summary preview */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-medium text-slate-500">ঔষধসমূহ:</span>
                  {tpl.medicines.map((m, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-800"
                    >
                      {m.brandName} ({renderWithFractions(m.dosage, 'sm')})
                    </span>
                  ))}
                </div>
              </div>

              {/* Load Button */}
              <button
                type="button"
                onClick={() => {
                  onSelectTemplate(tpl);
                  onClose();
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 group-hover:shadow-md text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Apply Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TemplatesModal;
