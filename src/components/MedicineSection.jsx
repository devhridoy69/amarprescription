import React, { useState, useRef, useEffect, useTransition } from 'react';
import { 
  Pill, Plus, Trash2, Search, ArrowUp, ArrowDown, Sparkles, 
  Coffee, HelpCircle, Check, X, Layers, Clock, Database, Loader2
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
import { StackedFraction, renderWithFractions } from './StackedFraction';

export const MedicineSection = ({ medicines, onAddMedicine, onRemoveMedicine, onReorderMedicines, onUpdateMedicine }) => {
  // Input fields state
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Supabase search states
  const [onlineSuggestions, setOnlineSuggestions] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const [currentMed, setCurrentMed] = useState({
    type: 'Tab',
    brandName: '',
    genericName: '',
    strength: '',
    dosage: '1+0+1',
    unit: 'Tablet',
    instruction: 'খাবার পরে (After meal)',
    duration: '৭ দিন',
    isFraction: false,
    fractionDetail: null
  });

  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Filtered local medicine suggestions
  const localSuggestions = COMMON_MEDICINES.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      item.brandName.toLowerCase().includes(term) ||
      item.genericName.toLowerCase().includes(term);
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
        const results = await searchMedicinesOnline(searchTerm.trim(), 20);
        setOnlineSuggestions(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 180);

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
    const t = rawType.toLowerCase();
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
    const medType = normalizeType(med.type);
    const defaultUnit = medType === 'Cap' ? 'Capsule' : 
                        medType === 'Syp' ? 'চামচ (Spoon)' :
                        medType === 'Drop' ? 'ফোঁটা (Drop)' : 'Tablet';

    setCurrentMed({
      type: medType,
      brandName: med.brandName,
      genericName: med.genericName,
      strength: med.strength || '',
      dosage: med.defaultDosage || '1+0+1',
      unit: med.defaultUnit || defaultUnit,
      instruction: med.defaultInstruction || 'খাবার পরে (After meal)',
      duration: med.defaultDuration || '৭ দিন',
      isFraction: med.defaultDosage?.includes('1/2') || med.defaultUnit?.includes('১/২') || false,
      fractionDetail: med.defaultDosage?.includes('1/2') ? { num: 1, den: 2, label: '1/2' } : null
    });
    setSearchTerm(med.brandName);
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

    // Reset input for the next fast entry
    setCurrentMed({
      type: 'Tab',
      brandName: '',
      genericName: '',
      strength: '',
      dosage: '1+0+1',
      unit: 'Tablet',
      instruction: 'খাবার পরে (After meal)',
      duration: '৭ দিন',
      isFraction: false,
      fractionDetail: null
    });
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Apply fraction to dosage (e.g. 1/2)
  const applyFractionDosage = (frac) => {
    if (frac.label === '1/2') {
      setCurrentMed(prev => ({
        ...prev,
        dosage: '1/2+0+1/2',
        isFraction: true,
        fractionDetail: { num: 1, den: 2, label: '1/2' }
      }));
    } else if (frac.label === '1/4') {
      setCurrentMed(prev => ({
        ...prev,
        dosage: '1/4+0+1/4',
        isFraction: true,
        fractionDetail: { num: 1, den: 4, label: '1/4' }
      }));
    } else if (frac.label === '1 1/2') {
      setCurrentMed(prev => ({
        ...prev,
        dosage: '1 1/2+0+1 1/2',
        isFraction: true,
        fractionDetail: { num: 1, den: 2, whole: 1, label: '1 1/2' }
      }));
    } else {
      setCurrentMed(prev => ({
        ...prev,
        dosage: `${frac.label}+0+${frac.label}`,
        isFraction: false,
        fractionDetail: null
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

  // Quick Drop / ফোঁটা selector handler
  const handleSelectDropDose = (dropCount, unitLabel = 'ড্রপ (Drop)') => {
    setCurrentMed(prev => ({
      ...prev,
      type: 'Drop',
      unit: unitLabel,
      dosage: `${dropCount}+${dropCount}+${dropCount}`
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

      {/* Input Builder Form */}
      <div className="bg-slate-50/70 rounded-xl p-3.5 sm:p-4 border border-slate-200/60 mb-5 space-y-3.5">
        
        {/* Row 1: Search & Autocomplete + Dosage Type */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 relative">
          
          {/* Medicine Type */}
          <div className="col-span-12 sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Type (ধরণ)</label>
            <select
              value={currentMed.type}
              onChange={(e) => setCurrentMed({ ...currentMed, type: e.target.value })}
              className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-teal-900 focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="Tab">Tab (ট্যাবলেট)</option>
              <option value="Cap">Cap (ক্যাপসুল)</option>
              <option value="Syp">Syp (সিরাপ)</option>
              <option value="Drop">Drop (ড্রপ)</option>
              <option value="Inj">Inj (ইনজেকশন)</option>
              <option value="Inhaler">Inhaler (ইনহেলার)</option>
              <option value="Sachet">Sachet (স্যাশে)</option>
              <option value="Ointment">Oint (মলম)</option>
            </select>
          </div>

          {/* Medicine Search & Name Input */}
          <div className="col-span-12 sm:col-span-6 relative">
            <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center justify-between">
              <span>Medicine Name * (ব্র্যান্ড বা জেনেরিকের নাম)</span>
              <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
                <Database className="w-3 h-3 text-teal-600 inline" />
                ২১,০০০+ লাইভ ডেটাবেজ
              </span>
            </label>
            <div className="relative">
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
                placeholder="Type 1-2 letters (e.g. Napa, Seclo, Maxpro, Cef-3, Ace)..."
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
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

          {/* Special Drop (ড্রপ / ফোঁটা) Quick Presets Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 pb-0.5 border-t border-slate-100 bg-sky-50/60 -mx-3 px-3 rounded-md">
            <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1 mr-1">
              <span>💧 Drop (ড্রপ / ফোঁটা পরিমাণ):</span>
            </span>
            {[
              { count: '1', label: '১ ফোঁটা (1 Drop)' },
              { count: '2', label: '২ ফোঁটা (2 Drops)' },
              { count: '3', label: '৩ ফোঁটা (3 Drops)' },
              { count: '4', label: '৪ ফোঁটা (4 Drops)' },
              { count: '5', label: '৫ ফোঁটা (5 Drops)' },
              { count: '8', label: '৮ ফোঁটা (8 Drops)' },
              { count: '10', label: '১০ ফোঁটা (10 Drops)' },
              { count: '15', label: '১৫ ফোঁটা (15 Drops)' },
            ].map(dp => (
              <button
                key={dp.count}
                type="button"
                onClick={() => handleSelectDropDose(dp.count, 'ফোঁটা (Drop)')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all cursor-pointer ${
                  currentMed.type === 'Drop' && currentMed.dosage === `${dp.count}+${dp.count}+${dp.count}`
                    ? 'bg-sky-700 text-white border-sky-800 font-bold shadow-2xs'
                    : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-100'
                }`}
                title={`প্রতি বেলা ${dp.label}`}
              >
                {dp.count} ফোঁটা
              </button>
            ))}
          </div>

          {/* Frequency Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 mr-1">Frequency:</span>
            {FREQUENCY_PRESETS.map((freq) => (
              <button
                key={freq.code}
                type="button"
                onClick={() => {
                  const isFrac = freq.code.includes('1/2');
                  setCurrentMed({ 
                    ...currentMed, 
                    dosage: freq.code,
                    isFraction: isFrac,
                    fractionDetail: isFrac ? { num: 1, den: 2, label: '1/2' } : null
                  });
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border cursor-pointer ${
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
            <span className="text-[11px] font-medium text-slate-500 mr-1">Unit / পরিমাপ:</span>
            
            {/* Special Highlighted 1/2 Cup Unit */}
            <button
              type="button"
              onClick={() => setCurrentMed({ ...currentMed, unit: '১/২ কাপ (Half Cup)' })}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
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
                onClick={() => setCurrentMed({ ...currentMed, unit: u.label })}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border cursor-pointer ${
                  currentMed.unit === u.label
                    ? 'bg-teal-600 text-white border-teal-700'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Instructions (খাবার নিয়ম)
            </label>
            <input
              type="text"
              value={currentMed.instruction}
              onChange={(e) => setCurrentMed({ ...currentMed, instruction: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500 mb-1.5"
            />
            <div className="flex flex-wrap gap-1">
              {INSTRUCTION_PRESETS.slice(0, 6).map((inst) => (
                <button
                  key={inst}
                  type="button"
                  onClick={() => setCurrentMed({ ...currentMed, instruction: inst })}
                  className="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer"
                >
                  {inst.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Duration (স্থায়িত্ব / কতদিন)
            </label>
            <input
              type="text"
              value={currentMed.duration}
              onChange={(e) => setCurrentMed({ ...currentMed, duration: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500 mb-1.5"
            />
            <div className="flex flex-wrap gap-1">
              {DURATION_PRESETS.slice(0, 7).map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setCurrentMed({ ...currentMed, duration: dur })}
                  className="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer"
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
                      <span className="inline-flex items-center px-2 py-0.5 bg-teal-50 text-teal-900 border border-teal-200 rounded font-mono font-bold text-[11px]">
                        {renderWithFractions(med.dosage, 'sm')}
                      </span>
                      {med.unit && (
                        <span className="text-slate-600 font-medium">
                          {renderWithFractions(med.unit, 'sm')}
                        </span>
                      )}
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-700">
                        {renderWithFractions(med.instruction, 'sm')}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]">
                        {med.duration}
                      </span>
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
