import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Check, ArrowRight, Plus, Trash2, BookmarkPlus, 
  Layers, Search, FileText, Pill, AlertCircle, Edit3
} from 'lucide-react';
import { PRESCRIPTION_TEMPLATES } from '../data/templatesData';
import { renderWithFractions } from './StackedFraction';

const CUSTOM_TEMPLATES_KEY = 'amar_rx_custom_templates';

export const TemplatesModal = ({ 
  isOpen, 
  onClose, 
  onSelectTemplate,
  currentPrescription = null 
}) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'custom' | 'builtin' | 'create'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom templates stored in localStorage (and scoped per doctor)
  const [customTemplates, setCustomTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // New Template form state
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('General');
  const [templateDiagnosis, setTemplateDiagnosis] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Keep custom templates in sync with storage
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));
    } catch (e) {}
  }, [customTemplates]);

  if (!isOpen) return null;

  // Handle saving the current prescription or custom form as a new template
  const handleSaveCurrentAsTemplate = (e) => {
    if (e) e.preventDefault();
    if (!templateName.trim()) {
      alert('অনুগ্রহ করে টেমপ্লেটের একটি নাম দিন (যেমন: Fever + Cough Protocol)');
      return;
    }

    const newTpl = {
      id: 'custom-tpl-' + Date.now(),
      title: templateName.trim(),
      category: templateCategory.trim() || 'Custom',
      isCustom: true,
      createdAt: new Date().toISOString(),
      diagnosis: templateDiagnosis.trim() || currentPrescription?.diagnosis || '',
      complaints: currentPrescription?.complaints ? [...currentPrescription.complaints] : [],
      vitals: currentPrescription?.vitals ? { ...currentPrescription.vitals } : {},
      investigations: currentPrescription?.investigations ? [...currentPrescription.investigations] : [],
      medicines: currentPrescription?.medicines ? [...currentPrescription.medicines] : [],
      advice: currentPrescription?.adviceList ? [...currentPrescription.adviceList] : [],
      nextVisit: currentPrescription?.nextVisit || '',
      specialNote: currentPrescription?.specialNote || ''
    };

    const updated = [newTpl, ...customTemplates];
    setCustomTemplates(updated);
    setTemplateName('');
    setTemplateDiagnosis('');
    setSuccessMsg('টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে!');
    setActiveTab('custom');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Delete a custom template
  const handleDeleteCustomTemplate = (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('আপনি কি নিশ্চিতভাবে এই কাস্টম টেমপ্লেটটি মুছে ফেলতে চান?')) {
      const filtered = customTemplates.filter(t => t.id !== id);
      setCustomTemplates(filtered);
    }
  };

  // Filter templates
  const allTemplates = [
    ...customTemplates.map(t => ({ ...t, isCustom: true })),
    ...PRESCRIPTION_TEMPLATES.map(t => ({ ...t, isCustom: false }))
  ];

  const displayedTemplates = allTemplates.filter(tpl => {
    if (activeTab === 'custom' && !tpl.isCustom) return false;
    if (activeTab === 'builtin' && tpl.isCustom) return false;
    
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = (tpl.title || '').toLowerCase().includes(q);
      const matchDiag = (tpl.diagnosis || '').toLowerCase().includes(q);
      const matchCat = (tpl.category || '').toLowerCase().includes(q);
      const matchMeds = (tpl.medicines || []).some(m => (m.brandName || '').toLowerCase().includes(q));
      return matchTitle || matchDiag || matchCat || matchMeds;
    }
    return true;
  });

  const hasCurrentPrescriptionData = currentPrescription && (
    (currentPrescription.medicines && currentPrescription.medicines.length > 0) ||
    currentPrescription.diagnosis ||
    (currentPrescription.complaints && currentPrescription.complaints.length > 0)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Prescription Templates & Protocols</span>
                {customTemplates.length > 0 && (
                  <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                    {customTemplates.length} কাস্টম
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                এক ক্লিকে সম্পূর্ণ প্রটোকল লোড করুন অথবা নিজের কাস্টম টেমপ্লেট বানিয়ে রাখুন
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

        {/* Tab Navigation & Search */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-white space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সবগুলো ({allTemplates.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'custom'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-teal-600" />
                <span>আমার কাস্টম ({customTemplates.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('builtin')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'builtin'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                রেডিমেড ({PRESCRIPTION_TEMPLATES.length})
              </button>
            </div>

            {/* Create Custom Template Button */}
            <button
              type="button"
              onClick={() => {
                setActiveTab(activeTab === 'create' ? 'all' : 'create');
                if (currentPrescription?.diagnosis && !templateDiagnosis) {
                  setTemplateDiagnosis(currentPrescription.diagnosis);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'create'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন কাস্টম টেমপ্লেট তৈরি করুন</span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'create' && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="টেমপ্লেট খুঁজুন (যেমন: Fever, Cold, Gastric, Dental, Napa)..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          )}

          {successMsg && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-3.5 flex-1 bg-slate-50/30">
          
          {/* Create Custom Template Panel */}
          {activeTab === 'create' ? (
            <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookmarkPlus className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    বর্তমান প্রেসক্রিপশনকে কাস্টম টেমপ্লেট হিসেবে সংরক্ষণ করুন
                  </h3>
                </div>
                <span className="text-xs text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full font-semibold">
                  Custom Template Builder
                </span>
              </div>

              {hasCurrentPrescriptionData ? (
                <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-teal-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-600" />
                    বর্তমান প্রেসক্রিপশনের ডেটা পাওয়া গেছে:
                  </p>
                  <p className="text-slate-600 pl-5">
                    • ঔষধ: {currentPrescription?.medicines?.length || 0} টি 
                    {currentPrescription?.diagnosis ? ` • রোগ নির্ণয়: ${currentPrescription.diagnosis}` : ''}
                    {currentPrescription?.complaints?.length ? ` • লক্ষণ: ${currentPrescription.complaints.length} টি` : ''}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">টিপস:</span> আপনি প্রেসক্রিপশনে প্রয়োজনীয় ঔষধ, রোগ ও ডোজ আগে টাইপ করে নিয়ে এখানে এসে সেভ করতে পারেন, অথবা এখনই একটি খালি টেমপ্লেট কাঠামো তৈরি করতে পারেন।
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveCurrentAsTemplate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      টেমপ্লেটের নাম * (যেমন: টাইফয়েড প্রটোকল বা পেডিয়াট্রিক ফিভার)
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g. Adult Acute URTI / Dental Pain Protocol"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ক্যাটাগরি বা বিভাগ (যেমন: Medicine, Pediatric, Surgery)
                    </label>
                    <input
                      type="text"
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value)}
                      placeholder="e.g. General Medicine, Gynecology"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    রোগ নির্ণয় / Diagnosis
                  </label>
                  <input
                    type="text"
                    value={templateDiagnosis}
                    onChange={(e) => setTemplateDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Bronchitis / Enteric Fever"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>টেমপ্লেট সেভ করুন (Save Template)</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Templates List */
            displayedTemplates.length > 0 ? (
              displayedTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    tpl.isCustom
                      ? 'border-teal-300 bg-white hover:border-teal-500 hover:shadow-sm'
                      : 'border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/20'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tpl.isCustom 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {tpl.isCustom ? '★ কাস্টম' : tpl.category}
                      </span>
                      {tpl.isCustom && tpl.category && (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          ({tpl.category})
                        </span>
                      )}
                      <h3 className="font-bold text-slate-900 text-sm">
                        {tpl.title}
                      </h3>
                    </div>

                    {tpl.diagnosis && (
                      <p className="text-xs font-semibold text-teal-900">
                        Diagnosis: <span className="font-normal text-slate-700">{tpl.diagnosis}</span>
                      </p>
                    )}

                    {/* Medicines summary preview */}
                    {tpl.medicines && tpl.medicines.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-medium text-slate-500">ঔষধসমূহ ({tpl.medicines.length}):</span>
                        {tpl.medicines.map((m, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-800"
                          >
                            {m.brandName} {m.dosage ? `(${renderWithFractions(m.dosage, 'sm')})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {tpl.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomTemplate(tpl.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                        title="টেমপ্লেট মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

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
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">কোনো টেমপ্লেট পাওয়া যায়নি</p>
                <p className="text-xs text-slate-400">
                  {activeTab === 'custom' 
                    ? 'আপনি এখনো কোনো কাস্টম টেমপ্লেট তৈরি করেননি। উপরে "+ নতুন কাস্টম টেমপ্লেট তৈরি করুন" বাটনে ক্লিক করে যোগ করুন।'
                    : 'অন্য কোনো নাম দিয়ে সার্চ করুন।'}
                </p>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default TemplatesModal;
