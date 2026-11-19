import React, { useState, useRef, useEffect, useTransition } from 'react';
import { 
  Pill, Plus, Trash2, Search, ArrowUp, ArrowDown, Sparkles, 
  Coffee, HelpCircle, Check, X, Layers, Clock, Database, Loader2, History
} from 'lucide-react';
import { 
  COMMON_MEDICINES, 
  FRACTION_PRESETS, 
  FREQUENCY_PRESETS, 
  UNIT_PRESETS, 
  INSTRUCTION_PRESETS, 
  DURATION_PRESETS 
} from '../data/medicinesData';
import { searchMedicinesOnline } from '../lib/supabase';
import { searchMedicinesOffline } from '../lib/offlineSync';
import { StackedFraction, renderWithFractions } from './StackedFraction';

const RECENT_MEDICINES_KEY = 'amar_rx_recent_medicines';

export const MedicineSection = ({ 
  medicines, 
  onAddMedicine, 
  onRemoveMedicine, 
  onReorderMedicines, 
  onUpdateMedicine,
  currentUser = null 
}) => {
  // Input fields state
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // User-specific custom instructions storage key
  const userPhone = currentUser?.phone || 'default';
  const CUSTOM_INSTRUCTIONS_KEY = `amar_rx_custom_instructions_${userPhone}`;
  const CUSTOM_DURATIONS_KEY = `amar_rx_custom_durations_${userPhone}`;

  const [customInstructionsList, setCustomInstructionsList] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_INSTRUCTIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [customDurationsList, setCustomDurationsList] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_DURATIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Save custom instruction
  const handleSaveCustomInstruction = () => {
    const text = (currentMed.instruction || '').trim();
    if (!text) return;
    if (customInstructionsList.includes(text) || INSTRUCTION_PRESETS.some(p => p.startsWith(text))) {
      alert('এই নিয়মটি ইতিমধ্যে তালিকায় রয়েছে');
      return;
    }
    const updated = [...customInstructionsList, text];
    setCustomInstructionsList(updated);
    try {
      localStorage.setItem(CUSTOM_INSTRUCTIONS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  // Remove custom instruction
  const handleRemoveCustomInstruction = (itemToRemove, e) => {
    if (e) e.stopPropagation();
    const updated = customInstructionsList.filter(item => item !== itemToRemove);
    setCustomInstructionsList(updated);
    try {
      localStorage.setItem(CUSTOM_INSTRUCTIONS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  // Save custom duration
  const handleSaveCustomDuration = () => {
    const text = (currentMed.duration || '').trim();
    if (!text) return;
    if (customDurationsList.includes(text) || DURATION_PRESETS.includes(text)) {
      alert('এই স্থায়িত্বটি ইতিমধ্যে তালিকায় রয়েছে');
      return;
    }
    const updated = [...customDurationsList, text];
    setCustomDurationsList(updated);
    try {
      localStorage.setItem(CUSTOM_DURATIONS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  // Remove custom duration
  const handleRemoveCustomDuration = (itemToRemove, e) => {
    if (e) e.stopPropagation();
    const updated = customDurationsList.filter(item => item !== itemToRemove);
    setCustomDurationsList(updated);
    try {
      localStorage.setItem(CUSTOM_DURATIONS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  // Recent Medicines (Limited to 10 recent items)
  // Static during current prescription editing, refreshes on next prescription via event
  const [recentMedicines, setRecentMedicines] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_MEDICINES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Reload recent medicines when a prescription is finalized / saved (for next patient)
  useEffect(() => {
    const handleRecentUpdate = () => {
      try {
        const saved = localStorage.getItem(RECENT_MEDICINES_KEY);
        setRecentMedicines(saved ? JSON.parse(saved) : []);
      } catch (e) {}
    };

    window.addEventListener('rx_recent_updated', handleRecentUpdate);
    window.addEventListener('storage', handleRecentUpdate);
    return () => {
      window.removeEventListener('rx_recent_updated', handleRecentUpdate);
      window.removeEventListener('storage', handleRecentUpdate);
    };
  }, []);

  // Supabase search states
  const [onlineSuggestions, setOnlineSuggestions] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const [currentMed, setCurrentMed] = useState({
    type: 'Tab',
    brandName: '',
    genericName: '',
    strength: '',
    dosage: '1+0+1',
    unit: '', // No default repetitive 'Tablet'
    instruction: '', // Blank by default
    duration: '', // Blank by default
    isFraction: false,
    fractionDetail: null
  });

  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Filtered local medicine suggestions (safe from undefined)
  const localSuggestions = COMMON_MEDICINES.filter((item) => {
    if (!item) return false;
    const term = (searchTerm || '').toLowerCase();
    const bName = (item.brandName || '').toLowerCase();
    const gName = (item.genericName || '').toLowerCase();
    const matchesSearch = bName.includes(term) || gName.includes(term);
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).slice(0, 8);

  // Debounced search to Supabase (21,000+ medicines)
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setOnlineSuggestions([]);
      setIsSearchingOnline(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        // 1. Try local IndexedDB offline search first (0ms latency, works without net!)
        let results = await searchMedicinesOffline(searchTerm.trim(), 20);
        
        // 2. If no local results or online is available, fallback to Supabase query
        if (!results || results.length === 0) {
          if (navigator.onLine) {
            results = await searchMedicinesOnline(searchTerm.trim(), 20);
          }
        }
        setOnlineSuggestions(results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 120);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Merge suggestions: prioritize matching online 21k medicines, then local
  const combinedSuggestions = React.useMemo(() => {
    if (onlineSuggestions.length > 0) {
      return onlineSuggestions;
    }
    return localSuggestions;
  }, [onlineSuggestions, localSuggestions]);

  // Handle outside click for suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize Type string for select dropdown
  const normalizeType = (rawType = '') => {
    if (!rawType || typeof rawType !== 'string') return 'Tab';
    const t = rawType.toLowerCase();
    if (t.includes('supp')) return 'Supp';
    if (t.includes('tab')) return 'Tab';
    if (t.includes('cap')) return 'Cap';
    if (t.includes('syp') || t.includes('susp') || t.includes('syrup')) return 'Syp';
    if (t.includes('drop')) return 'Drop';
    if (t.includes('inj')) return 'Inj';
    if (t.includes('inhal')) return 'Inhaler';
    if (t.includes('sachet')) return 'Sachet';
    if (t.includes('oint') || t.includes('cream') || t.includes('gel')) return 'Ointment';
    return rawType || 'Tab';
  };

  // Quick select a medicine from database
  const handleSelectMedicine = (med) => {
    if (!med) return;
    const rawType = med.type || med.Type || '';
    const bName = med.brandName || med.brand_name || '';
    const gName = med.genericName || med.generic_name || '';
    const str = med.strength || '';
    const medType = normalizeType(rawType);
    const defaultUnit = medType === 'Cap' ? '' : 
                        medType === 'Syp' ? 'চামচ' :
                        medType === 'Drop' ? '' :
                        medType === 'Supp' ? 'টি' : '';

    let initialDosage = med.defaultDosage || '1+0+1';
    let initialUnit = med.defaultUnit && med.defaultUnit !== 'Tablet' && med.defaultUnit !== 'Capsule' ? med.defaultUnit : defaultUnit;
    let initialInstruction = '';
    if (medType === 'Drop') {
      const bnNums = { '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '10': '১০', '15': '১৫' };
      if (dropLang === 'bn') {
        const bnCount = bnNums[dropCount] || dropCount;
        initialInstruction = `প্রতিবার ${bnCount} ফোঁটা করে`;
        initialUnit = ''; // Keep unit empty so redundant "ফোঁটা" doesn't show next to dosage
      } else {
        initialInstruction = `${dropCount} drops each time`;
        initialUnit = '';
      }
    } else if (medType === 'Supp') {
      initialInstruction = 'পায়খানার রাস্তায় ব্যবহার করবেন';
      initialDosage = 'SOS';
      initialUnit = 'টি';
    } else if (medType === 'Inj') {
      initialInstruction = 'মাংসে বা শিরায় পুশ করবেন (IM/IV)';
      initialDosage = '0+0+1';
      initialUnit = 'ভায়াল';
    }

    setCurrentMed({
      type: medType,
      brandName: bName,
      genericName: gName,
      strength: str,
      dosage: initialDosage,
      unit: initialUnit,
      instruction: initialInstruction, // Auto-populated with drop guidance for Drop
      duration: '', // Blank by default as requested
      isFraction: med.defaultDosage?.includes('1/2') || med.defaultUnit?.includes('১/২') || false,
      fractionDetail: med.defaultDosage?.includes('1/2') ? { num: 1, den: 2, label: '1/2' } : null
    });
    setSearchTerm(bName);
    setShowSuggestions(false);
  };

  // Add the medicine to prescription list
  const handleAdd = (e) => {
    if (e) e.preventDefault();
    if (!currentMed.brandName.trim()) {
      alert('অনুগ্রহ করে ঔষধের নাম লিখুন অথবা নির্বাচন করুন');
      return;
    }

    onAddMedicine({
      ...currentMed,
      id: 'rx-med-' + Date.now()
    });

    // Reset input for the next fast entry - keep instruction & duration blank
    setCurrentMed({
      type: 'Tab',
      brandName: '',
      genericName: '',
      strength: '',
      dosage: '1+0+1',
      unit: '',
      instruction: '',
      duration: '',
      isFraction: false,
      fractionDetail: null
    });
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Apply fraction to dosage (e.g. 1/2) with toggle unselect support
  const applyFractionDosage = (frac) => {
    let targetDosage = '';
    let isFraction = false;
    let fractionDetail = null;

    if (frac.label === '1/2') {
      targetDosage = '1/2+0+1/2';
      isFraction = true;
      fractionDetail = { num: 1, den: 2, label: '1/2' };
    } else if (frac.label === '1/4') {
      targetDosage = '1/4+0+1/4';
      isFraction = true;
      fractionDetail = { num: 1, den: 4, label: '1/4' };
    } else if (frac.label === '3/4') {
      targetDosage = '3/4+0+3/4';
      isFraction = true;
      fractionDetail = { num: 3, den: 4, label: '3/4' };
    } else if (frac.label === '1 1/2') {
      targetDosage = '1 1/2+0+1 1/2';
      isFraction = true;
      fractionDetail = { num: 1, den: 2, whole: 1, label: '1 1/2' };
    } else {
      targetDosage = `${frac.label}+0+${frac.label}`;
      isFraction = false;
      fractionDetail = null;
    }

    // Toggle behavior: if already selected or matches current dosage, unselect (clear dosage)
    if (
      currentMed.dosage === targetDosage || 
      currentMed.dosage === frac.label ||
      (frac.label === '1/2' && currentMed.dosage === '1/2+0+1/2')
    ) {
      setCurrentMed(prev => ({
        ...prev,
        dosage: '',
        isFraction: false,
        fractionDetail: null
      }));
    } else {
      const isDrop = currentMed.type === 'Drop';
      const unitForDrop = isDrop 
        ? (currentMed.unit || (dropLang === 'en' ? 'drops' : 'ফোঁটা'))
        : currentMed.unit;
      setCurrentMed(prev => ({
        ...prev,
        dosage: targetDosage,
        unit: unitForDrop,
        isFraction,
        fractionDetail
      }));
    }
  };

  // Special Half Cup selector handler
  const handleSelectHalfCup = () => {
    setCurrentMed(prev => ({
      ...prev,
      type: 'Syp',
      unit: '১/২ কাপ (Half Cup)',
      dosage: '1+1+1',
      instruction: '১/২ কাপ কুসুম গরম পানিতে মিশিয়ে খাবেন',
      isFraction: true,
      fractionDetail: { num: 1, den: 2, label: '1/2 Cup' }
    }));
  };

  // Drop builder states: drops count and language (bn / en)
  const [dropCount, setDropCount] = useState('2');
  const [dropLang, setDropLang] = useState('bn'); // 'bn' | 'en'

  // Sync drop count into currentMed whenever dropCount or dropLang changes
  const applyDropDosage = (count, lang = dropLang) => {
    const bnNums = { '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '10': '১০', '15': '১৫' };
    const bnCount = bnNums[count] || count;

    let instructionStr = '';
    if (lang === 'en') {
      instructionStr = `${count} drops each time`;
    } else {
      instructionStr = `প্রতিবার ${bnCount} ফোঁটা করে`;
    }

    setCurrentMed(prev => ({
      ...prev,
      type: 'Drop',
      unit: '', // No extra unit pill so redundant "ফোঁটা" is omitted
      instruction: instructionStr
    }));
  };

  // Move medicine up / down
  const moveMed = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= medicines.length) return;
    const updated = [...medicines];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onReorderMedicines(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 mb-5 transition-all">
      
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg font-serif">
            ℞
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              Prescribe Medication (ঔষধ প্রেসক্রিপশন)
              <span className="text-[11px] bg-teal-100/70 text-teal-800 px-2 py-0.5 rounded-full font-medium">
                {medicines.length} added
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              টাইপ না করে সরাসরি ক্লিক করে ঔষধ, ডোজ ও <span className="font-semibold text-teal-700">১/২ কাপ (Half Cup)</span> অপশন যুক্ত করুন
            </p>
          </div>
        </div>

        {/* Half Cup Quick Feature Badge */}
        <button
          type="button"
          onClick={handleSelectHalfCup}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          title="Quick 1/2 Cup Option"
        >
          <Coffee className="w-3.5 h-3.5 text-amber-700" />
          <span>Quick </span>
          <StackedFraction num={1} den={2} size="sm" />
          <span> Cup (আধা কাপ অপশন)</span>
        </button>
      </div>

      {/* Recent Medicines Quick Suggestions (Limit 10) */}
      {recentMedicines.length > 0 && (
        <div className="mb-4 p-2.5 bg-teal-50/60 rounded-xl border border-teal-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1.5">
              <History className="w-3 h-3 text-teal-600" />
              <span>Recent Medicines (সর্বশেষ ব্যবহৃত ঔষধ - সর্বোচ্চ ১০টি):</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setRecentMedicines([]);
                localStorage.removeItem(RECENT_MEDICINES_KEY);
              }}
              className="text-[10px] text-teal-600 hover:text-teal-800 underline cursor-pointer"
            >
              ক্লিয়ার
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentMedicines.map((medItem, idx) => {
              const isAdded = medicines.some(m => 
                (m.brandName || '').toLowerCase() === (medItem.brandName || '').toLowerCase() &&
                m.type === medItem.type
              );
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    handleSelectMedicine({
                      type: medItem.type,
                      brandName: medItem.brandName,
                      genericName: medItem.genericName,
                      strength: medItem.strength,
                      defaultDosage: medItem.dosage,
                      defaultUnit: medItem.unit
                    });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    isAdded
                      ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900 shadow-2xs'
                  }`}
                  title={`${medItem.type} ${medItem.brandName} ${medItem.strength || ''}`}
                >
                  <span className="text-[10px] px-1 py-0.2 rounded font-bold uppercase bg-teal-100 text-teal-800">
                    {medItem.type}
                  </span>
                  <span>{medItem.brandName}</span>
                  {medItem.strength && (
                    <span className="text-[10px] text-slate-400 font-normal">({medItem.strength})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Builder Form */}
      <div className="bg-slate-50/70 rounded-xl p-3.5 sm:p-4 border border-slate-200/60 mb-5 space-y-3.5">
        
        {/* Row 1: Search & Autocomplete with Type Selector inside */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 relative">
          
          {/* Medicine Search & Name Input with Type Selector attached */}
          <div className="col-span-12 sm:col-span-9 relative">
            <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center justify-between">
              <span>Medicine Name * (ব্র্যান্ড বা জেনেরিকের নাম)</span>
              <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
                <Database className="w-3 h-3 text-teal-600 inline" />
                ২১,০০০+ লাইভ ডেটাবেজ
              </span>
            </label>
            <div className="relative flex items-center">
              {/* Type selector inside / attached to left of medicine search */}
              <select
                value={currentMed.type}
                onChange={(e) => setCurrentMed({ ...currentMed, type: e.target.value })}
                className="h-[38px] px-2.5 py-1.5 bg-teal-50 border border-r-0 border-slate-300 rounded-l-lg text-xs font-bold text-teal-900 hover:bg-teal-100/70 focus:ring-2 focus:ring-teal-500 cursor-pointer shrink-0 transition-colors"
                title="ঔষধের ধরণ (যেমন: Tab, Cap, Syp, Drop, Inj ইত্যাদি)"
              >
                <option value="Tab">Tab</option>
                <option value="Cap">Cap</option>
                <option value="Syp">Syp</option>
                <option value="Supp">Supp</option>
                <option value="Drop">Drop</option>
                <option value="Inj">Inj</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Sachet">Sachet</option>
                <option value="Ointment">Oint</option>
              </select>

              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={currentMed.brandName}
                  onChange={(e) => {
                    setCurrentMed({ ...currentMed, brandName: e.target.value });
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="ঔষধের নাম বা ধরণ লিখুন (যেমন: Napa, Napa Drop, Napa Syrup, Cef-3, Ace)..."
                  className="w-full pl-8 pr-8 py-2 bg-white border border-slate-300 rounded-r-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                
                {isSearchingOnline ? (
                  <Loader2 className="w-4 h-4 text-teal-600 animate-spin absolute right-2.5 top-2.5" />
                ) : currentMed.brandName ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMed({ ...currentMed, brandName: '', genericName: '', strength: '' });
                      setSearchTerm('');
                    }}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div 
                ref={suggestionsRef}
                className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto"
              >
                <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-[11px] text-slate-500 sticky top-0 z-10">
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3 text-teal-600" />
                    <span>ক্লিক করে সিলেক্ট করুন (Supabase 21k+ DB)</span>
                  </span>
                  <span className="font-semibold text-teal-700">
                    {combinedSuggestions.length} টি পাওয়া গেছে
                  </span>
                </div>
                {combinedSuggestions.length > 0 ? (
                  combinedSuggestions.map((item, idx) => (
                    <button
                      key={item.id ? `med-${item.id}-${idx}` : `med-idx-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        // Prevent search input from losing focus prematurely
                        e.preventDefault();
                        handleSelectMedicine(item);
                      }}
                      onClick={() => handleSelectMedicine(item)}
                      className="w-full text-left px-3 py-2 hover:bg-teal-50/90 transition-colors flex items-center justify-between border-b border-slate-50 last:border-none cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 max-w-[70%]">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 whitespace-nowrap">
                          {normalizeType(item.type)}
                        </span>
                        <div className="truncate">
                          <span className="font-semibold text-xs text-slate-900 group-hover:text-teal-900">
                            {item.brandName}
                          </span>
                          {item.genericName && (
                            <span className="text-[11px] text-slate-500 ml-1.5 font-normal truncate">
                              ({item.genericName})
                            </span>
                          )}
                          {item.company && (
                            <span className="block text-[10px] text-slate-400 truncate">
                              {item.company}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap pl-2">
                        <span className="text-[11px] font-bold text-teal-700 block">{item.strength || ''}</span>
                        {item.defaultDosage && (
                          <span className="text-[10px] text-slate-400">{item.defaultDosage}</span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500">
                    {isSearchingOnline ? 'খোঁজা হচ্ছে...' : 'কোনো তথ্য পাওয়া যায়নি, আপনি সরাসরি নতুন নাম টাইপ করতে পারেন'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Strength */}
          <div className="col-span-12 sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Strength (পাওয়ার)</label>
            <input
              type="text"
              value={currentMed.strength}
              onChange={(e) => setCurrentMed({ ...currentMed, strength: e.target.value })}
              placeholder="e.g. 500 mg / 20 mg"
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Row 2: Dosage Fraction Builder & Half Cup Feature (Highlight) */}
        <div className="bg-white rounded-xl p-3 border border-teal-100/80 shadow-2xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              Dosage & Fractions Builder (ডোজ ও ভগ্নাংশ নির্বাচন):
            </span>
            <span className="text-[11px] text-slate-500">
              নিচে ১-ক্লিকে <span className="font-bold text-teal-700">১/২</span> বা আধা কাপ সিলেক্ট করুন
            </span>
          </div>

          {/* Fractions Row with 1 Up and 2 Down Stacked Fraction & Custom Fraction Box */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 mr-1">Fractions / ডোজ:</span>
            
            {/* Special Highlighted 1/2 Option */}
            <button
              type="button"
              onClick={() => applyFractionDosage({ label: '1/2' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                currentMed.dosage?.includes('1/2')
                  ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                  : 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100'
              }`}
              title="Half (1 up and 2 down)"
            >
              <StackedFraction num={1} den={2} size="md" />
              <span>(আধা / Half)</span>
            </button>

            {/* Other fractions */}
            {FRACTION_PRESETS.filter(f => f.label !== '1/2').map((frac) => (
              <button
                key={frac.label}
                type="button"
                onClick={() => applyFractionDosage(frac)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                  currentMed.dosage === frac.label || currentMed.dosage?.startsWith(frac.label + '+')
                    ? 'bg-teal-600 text-white border-teal-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {frac.label === '1/4' ? (
                  <StackedFraction num={1} den={4} size="sm" />
                ) : frac.label === '3/4' ? (
                  <StackedFraction num={3} den={4} size="sm" />
                ) : frac.label === '1 1/2' ? (
                  <StackedFraction num={1} den={2} whole={1} size="sm" />
                ) : frac.label === '2 1/2' ? (
                  <StackedFraction num={1} den={2} whole={2} size="sm" />
                ) : (
                  frac.label
                )}
              </button>
            ))}

            {/* Custom Dosage / Fraction Input Box */}
            <div className="inline-flex items-center gap-1 ml-auto sm:ml-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-300">
              <span className="text-[11px] font-semibold text-slate-600">কাস্টম ডোজ:</span>
              <input
                type="text"
                value={currentMed.dosage}
                onChange={(e) => {
                  const val = e.target.value;
                  const isFrac = val.includes('/');
                  setCurrentMed({
                    ...currentMed,
                    dosage: val,
                    isFraction: isFrac
                  });
                }}
                placeholder="যেমন: 5 drops বা 1/2+0+1/2"
                className="w-32 sm:w-40 px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-bold text-teal-900 focus:ring-1 focus:ring-teal-500"
                title="ডোজ বেশি হলে বা ড্রপের সংখ্যা কাস্টম লিখতে এখানে টাইপ করুন"
              />
            </div>
          </div>

          {/* Special Drop (ড্রপ / ফোঁটা) Interactive Builder Bar - Only shown when medicine type is Drop */}
          {currentMed.type === 'Drop' && (
            <div className="pt-2 pb-2.5 px-3 border border-sky-200/90 bg-gradient-to-r from-sky-50 via-teal-50/40 to-sky-50/60 -mx-1 sm:-mx-2 rounded-xl space-y-2 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sky-950 flex items-center gap-1.5">
                    <span>Drop Builder (ড্রপ ও পরিমাণ নির্বাচন):</span>
                  </span>

                  {/* Language Switch: বাংলা / English */}
                  <div className="inline-flex items-center bg-white p-0.5 rounded-lg border border-sky-200 shadow-2xs text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setDropLang('bn');
                        applyDropDosage(dropCount, 'bn');
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        dropLang === 'bn'
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-teal-900'
                      }`}
                      title="বাংলা ভাষায় প্রেসক্রিপশনে লিখুন"
                    >
                      বাংলা
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDropLang('en');
                        applyDropDosage(dropCount, 'en');
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        dropLang === 'en'
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-teal-900'
                      }`}
                      title="Write in English on prescription"
                    >
                      English
                    </button>
                  </div>
                </div>

                <span className="text-[10.5px] font-semibold text-sky-900 bg-white/90 px-2.5 py-0.5 rounded-lg border border-sky-200 shadow-2xs">
                  {currentMed.instruction ? `${currentMed.dosage} • ${currentMed.instruction}` : `প্রতিবার ${dropCount} ফোঁটা করে`}
                </span>
              </div>

              {/* কত ফোঁটা নির্বাচন */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-700 min-w-[70px]">
                  {dropLang === 'bn' ? 'কত ফোঁটা:' : 'Drop count:'}
                </span>
                {[
                  { count: '1', bnLabel: '১ ফোঁটা', enLabel: '1 drop' },
                  { count: '2', bnLabel: '২ ফোঁটা', enLabel: '2 drops' },
                  { count: '3', bnLabel: '৩ ফোঁটা', enLabel: '3 drops' },
                  { count: '4', bnLabel: '৪ ফোঁটা', enLabel: '4 drops' },
                  { count: '5', bnLabel: '৫ ফোঁটা', enLabel: '5 drops' },
                  { count: '6', bnLabel: '৬ ফোঁটা', enLabel: '6 drops' },
                  { count: '8', bnLabel: '৮ ফোঁটা', enLabel: '8 drops' },
                  { count: '10', bnLabel: '১০ ফোঁটা', enLabel: '10 drops' },
                  { count: '15', bnLabel: '১৫ ফোঁটা', enLabel: '15 drops' },
                ].map(dp => {
                  const bnNums = { '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '10': '১০', '15': '১৫' };
                  const isSelected = (dropCount === dp.count || currentMed.instruction?.includes(`${bnNums[dp.count] || dp.count} ফোঁটা`) || currentMed.instruction?.includes(`${dp.count} drops`)) && currentMed.type === 'Drop';
                  const label = dropLang === 'bn' ? dp.bnLabel : dp.enLabel;
                  return (
                    <button
                      key={dp.count}
                      type="button"
                      onClick={() => {
                        setDropCount(dp.count);
                        applyDropDosage(dp.count, dropLang);
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-700 text-white border-sky-800 shadow-xs ring-1 ring-sky-400'
                          : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-100'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Frequency Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600 mr-1">Frequency:</span>
            {FREQUENCY_PRESETS.map((freq) => (
              <button
                key={freq.code}
                type="button"
                onClick={() => {
                  if (currentMed.dosage === freq.code) {
                    // Unselect if clicked again
                    setCurrentMed({
                      ...currentMed,
                      dosage: '',
                      isFraction: false,
                      fractionDetail: null
                    });
                  } else {
                    const isFrac = freq.code.includes('1/2');
                    const isDrop = currentMed.type === 'Drop';
                    const unitVal = isDrop ? (currentMed.unit || '') : currentMed.unit;
                    
                    // If Drop type, preserve or ensure drop instructions
                    let inst = currentMed.instruction;
                    if (isDrop && (!inst || !inst.includes('ফোঁটা'))) {
                      const bnNums = { '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '10': '১০', '15': '১৫' };
                      const bnCount = bnNums[dropCount] || dropCount;
                      inst = `প্রতিবার ${bnCount} ফোঁটা করে`;
                    }

                    setCurrentMed({ 
                      ...currentMed, 
                      dosage: freq.code,
                      unit: unitVal,
                      instruction: inst,
                      isFraction: isFrac,
                      fractionDetail: isFrac ? { num: 1, den: 2, label: '1/2' } : null
                    });
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
                  currentMed.dosage === freq.code
                    ? 'bg-teal-600 text-white border-teal-700 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-teal-50 hover:text-teal-900'
                }`}
                title={freq.bn}
              >
                {renderWithFractions(freq.code, 'sm')}
              </button>
            ))}
          </div>

          {/* Unit Selector including 1/2 Cup (Half Cup) and 1 Cup */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600 mr-1">Unit / পরিমাপ:</span>
            
            {/* Special Highlighted 1/2 Cup Unit */}
            <button
              type="button"
              onClick={() => {
                if (currentMed.unit?.includes('১/২ কাপ')) {
                  setCurrentMed({ ...currentMed, unit: '' });
                } else {
                  setCurrentMed({ ...currentMed, unit: '১/২ কাপ (Half Cup)' });
                }
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                currentMed.unit?.includes('১/২ কাপ')
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <StackedFraction num={1} den={2} size="sm" />
              <span>কাপ (Half Cup)</span>
            </button>

            {UNIT_PRESETS.filter(u => u.id !== 'half_cup').map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  if (currentMed.unit === u.label) {
                    setCurrentMed({ ...currentMed, unit: '' });
                  } else {
                    setCurrentMed({ ...currentMed, unit: u.label });
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border cursor-pointer ${
                  currentMed.unit === u.label
                    ? 'bg-teal-600 text-white border-teal-700 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {u.isFraction ? renderWithFractions(u.short, 'sm') : u.short}
              </button>
            ))}

            {/* Custom Unit Input Box */}
            <div className="inline-flex items-center gap-1 ml-auto sm:ml-2 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-300">
              <span className="text-[11px] font-semibold text-slate-600">কাস্টম পরিমাপ:</span>
              <input
                type="text"
                value={currentMed.unit}
                onChange={(e) => setCurrentMed({ ...currentMed, unit: e.target.value })}
                placeholder="যেমন: ফোঁটা বা চামচ"
                className="w-28 sm:w-32 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-semibold text-teal-900 focus:ring-1 focus:ring-teal-500"
                title="নিজের মতো পরিমাপের একক লিখতে এখানে টাইপ করুন"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Instructions & Duration Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Instructions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-600">
                Instructions (খাবার নিয়ম)
              </label>
              {currentMed.instruction?.trim() && (
                <button
                  type="button"
                  onClick={handleSaveCustomInstruction}
                  className="text-[10.5px] text-teal-700 hover:text-teal-900 font-bold bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1 cursor-pointer transition-colors"
                  title="ভবিষ্যতের জন্য এই নিয়মটি আপনার একাউন্টে সেভ করে রাখুন"
                >
                  <Plus className="w-3 h-3" />
                  <span>সেভ রাখুন (Next time)</span>
                </button>
              )}
            </div>
            <input
              type="text"
              value={currentMed.instruction}
              onChange={(e) => setCurrentMed({ ...currentMed, instruction: e.target.value })}
              placeholder="খাবার নিয়ম লিখুন বা নিচের বাটন ক্লিক করুন..."
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500 mb-1.5"
            />
              <div className="flex flex-wrap gap-1.5">
                {/* Doctor's Custom Saved Instructions */}
                {customInstructionsList.map((cInst) => (
                  <button
                    key={cInst}
                    type="button"
                    onClick={() => {
                      if (currentMed.instruction === cInst) {
                        setCurrentMed({ ...currentMed, instruction: '' });
                      } else {
                        setCurrentMed({ ...currentMed, instruction: cInst });
                      }
                    }}
                    className={`group px-2.5 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentMed.instruction === cInst
                        ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                        : 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                    }`}
                    title="আপনার ব্যক্তিগত কাস্টম নিয়ম"
                  >
                    <span>{cInst}</span>
                    <span
                      onClick={(e) => handleRemoveCustomInstruction(cInst, e)}
                      className="text-slate-400 group-hover:text-rose-600 hover:scale-125 transition-transform"
                      title="মুছে ফেলুন"
                    >
                      ×
                    </span>
                  </button>
                ))}

                {/* Default Preset Instructions */}
                {INSTRUCTION_PRESETS.slice(0, 14).map((inst) => (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => {
                      if (currentMed.instruction === inst) {
                        setCurrentMed({ ...currentMed, instruction: '' });
                      } else {
                        setCurrentMed({ ...currentMed, instruction: inst });
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                      currentMed.instruction === inst
                        ? 'bg-teal-600 text-white border-teal-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-teal-50 hover:text-teal-900 shadow-2xs'
                    }`}
                  >
                    {inst.split(' (')[0]}
                  </button>
                ))}
              </div>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-600">
                Duration (স্থায়িত্ব / কতদিন)
              </label>
              {currentMed.duration?.trim() && (
                <button
                  type="button"
                  onClick={handleSaveCustomDuration}
                  className="text-[10.5px] text-teal-700 hover:text-teal-900 font-bold bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1 cursor-pointer transition-colors"
                  title="ভবিষ্যতের জন্য এই মেয়াদটি আপনার একাউন্টে সেভ করে রাখুন"
                >
                  <Plus className="w-3 h-3" />
                  <span>সেভ রাখুন (Next time)</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <input
                type="text"
                value={currentMed.duration}
                onChange={(e) => setCurrentMed({ ...currentMed, duration: e.target.value })}
                placeholder="যেমন: ৩ দিন / 5 days / ১ মাস"
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500"
              />
              {/* Quick Custom Day selector / counter */}
              <div className="flex items-center gap-0.5 bg-white border border-slate-300 rounded-lg px-1 py-1 shrink-0">
                <input
                  type="number"
                  min="1"
                  max="365"
                  placeholder="দিন"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      setCurrentMed({ ...currentMed, duration: `${val} দিন` });
                    }
                  }}
                  className="w-12 text-center text-xs font-bold text-teal-800 bg-transparent outline-none"
                  title="কাস্টম দিন লিখুন (যেমন: ৪, ৮, ১২)"
                />
                <span className="text-[10px] text-slate-500 font-semibold pr-1">দিন</span>
              </div>
            </div>
              <div className="flex flex-wrap gap-1.5">
                {/* Doctor's Custom Saved Durations */}
                {customDurationsList.map((cDur) => (
                  <button
                    key={cDur}
                    type="button"
                    onClick={() => {
                      if (currentMed.duration === cDur) {
                        setCurrentMed({ ...currentMed, duration: '' });
                      } else {
                        setCurrentMed({ ...currentMed, duration: cDur });
                      }
                    }}
                    className={`group px-2.5 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentMed.duration === cDur
                        ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                        : 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                    }`}
                    title="আপনার ব্যক্তিগত কাস্টম স্থায়িত্ব"
                  >
                    <span>{cDur}</span>
                    <span
                      onClick={(e) => handleRemoveCustomDuration(cDur, e)}
                      className="text-slate-400 group-hover:text-rose-600 hover:scale-125 transition-transform"
                      title="মুছে ফেলুন"
                    >
                      ×
                    </span>
                  </button>
                ))}

                {/* Default Preset Durations */}
                {DURATION_PRESETS.slice(0, 7).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => {
                      if (currentMed.duration === dur) {
                        setCurrentMed({ ...currentMed, duration: '' });
                      } else {
                        setCurrentMed({ ...currentMed, duration: dur });
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                      currentMed.duration === dur
                        ? 'bg-teal-600 text-white border-teal-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-teal-50 hover:text-teal-900 shadow-2xs'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
          </div>

        </div>

        {/* Add Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200/60">
          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5 bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-none border-slate-200">
            <span className="font-semibold text-slate-700">Preview:</span>
            <span className="font-bold text-teal-800">{currentMed.type} {currentMed.brandName || '...'}</span>
            <span>-</span>
            <span className="font-mono text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
              {renderWithFractions(currentMed.dosage, 'sm')}
            </span>
            <span className="text-slate-600 font-medium">({renderWithFractions(currentMed.unit, 'sm')})</span>
            <span className="text-slate-500 font-medium">[{currentMed.duration}]</span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add to Prescription (প্রেসক্রিপশনে যুক্ত করুন)
          </button>
        </div>

      </div>

      {/* Added Medicines List */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Prescribed Medicines List ({medicines.length})</span>
          {medicines.length > 0 && (
            <span className="text-[11px] text-slate-400 font-normal">
              তীরচিহ্ন দিয়ে ক্রম সাজাতে পারেন
            </span>
          )}
        </h3>

        {medicines.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">কোনো ঔষধ যুক্ত করা হয়নি</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              উপরে সার্চ করে অথবা নিচে দেওয়া টেমপ্লেট থেকে দ্রুত ঔষধ যুক্ত করুন
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {medicines.map((med, idx) => (
              <div
                key={med.id || idx}
                className="group flex items-center justify-between p-3 bg-white hover:bg-teal-50/40 border border-slate-200 hover:border-teal-200 rounded-xl transition-all shadow-2xs"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  
                  {/* Sequence number */}
                  <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-teal-600 group-hover:text-white text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 transition-colors">
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px] uppercase">
                        {med.type}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {med.brandName}
                      </span>
                      {med.strength && (
                        <span className="text-xs text-slate-500 font-medium">
                          {med.strength}
                        </span>
                      )}
                      {med.genericName && (
                        <span className="text-[11px] text-slate-400 italic">
                          ({med.genericName})
                        </span>
                      )}
                    </div>

                    {/* Dosage and instructions line */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs">
                      {med.dosage && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-teal-50 text-teal-900 border border-teal-200 rounded font-mono font-bold text-[11px]">
                          {renderWithFractions(med.dosage, 'sm')}
                        </span>
                      )}
                      {med.unit && 
                       med.unit.toLowerCase() !== 'tablet' && 
                       med.unit.toLowerCase() !== 'tab' && 
                       med.unit.toLowerCase() !== 'capsule' && 
                       med.unit.toLowerCase() !== 'cap' && 
                       med.unit !== 'ফোঁটা' && 
                       med.unit !== 'drops' && 
                       med.unit !== 'ড্রপ' && (
                        <span className="text-slate-600 font-medium">
                          {renderWithFractions(med.unit, 'sm')}
                        </span>
                      )}
                      {med.instruction && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-700">
                            {renderWithFractions(med.instruction, 'sm')}
                          </span>
                        </>
                      )}
                      {med.duration && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]">
                            {med.duration}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Reorder & Delete */}
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveMed(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMed(idx, 1)}
                    disabled={idx === medicines.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveMedicine(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded ml-1 transition-colors cursor-pointer"
                    title="Delete Medicine"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default MedicineSection;
