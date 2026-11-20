import React, { useState, useEffect } from 'react';
import { 
  Activity, Stethoscope, FileText, Plus, X, HeartPulse, 
  Thermometer, CheckCircle2, ChevronDown, ChevronUp, History, Sparkles, Search
} from 'lucide-react';
import { COMMON_COMPLAINTS, COMPLAINT_DURATIONS } from '../data/complaintsData';
import { COMMON_INVESTIGATIONS, COMMON_DIAGNOSES } from '../data/investigationsData';
import { fetchInvestigationsChart } from '../lib/supabase';

const RECENT_COMPLAINTS_KEY = 'amar_rx_recent_complaints';
const RECENT_DIAGNOSES_KEY = 'amar_rx_recent_diagnoses';
const RECENT_INVESTIGATIONS_KEY = 'amar_rx_recent_investigations';

export const ClinicalSection = ({ 
  complaints, onUpdateComplaints,
  vitals, onUpdateVitals,
  diagnosis, onUpdateDiagnosis,
  investigations, onUpdateInvestigations
}) => {
  // Local input states for custom additions
  const [customComplaint, setCustomComplaint] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('3 days');
  const [customDiagnosis, setCustomDiagnosis] = useState('');
  const [customInvestigation, setCustomInvestigation] = useState('');
  const [investigationSearch, setInvestigationSearch] = useState('');
  const [allInvestigations, setAllInvestigations] = useState(() => {
    try {
      const cached = localStorage.getItem('amar_rx_investigations_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return COMMON_INVESTIGATIONS;
  });

  // Load from Supabase investigationchart table on mount
  useEffect(() => {
    let isMounted = true;
    fetchInvestigationsChart().then((chartList) => {
      if (isMounted && Array.isArray(chartList) && chartList.length > 0) {
        // Merge with COMMON_INVESTIGATIONS so nothing is lost
        const set = new Set([...COMMON_INVESTIGATIONS, ...chartList]);
        setAllInvestigations(Array.from(set));
      }
    });
    return () => { isMounted = false; };
  }, []);
  
  // Collapse toggles for mobile compactness
  const [isComplaintsOpen, setIsComplaintsOpen] = useState(true);
  const [isVitalsOpen, setIsVitalsOpen] = useState(true);
  const [isInvOpen, setIsInvOpen] = useState(true);

  // Recent Complaints (Limited to 10 recent items)
  const [recentComplaints, setRecentComplaints] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_COMPLAINTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Recent Diagnoses (Limited to 10 recent items)
  const [recentDiagnoses, setRecentDiagnoses] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_DIAGNOSES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Recent Investigations (Limited to 10 recent items)
  const [recentInvestigations, setRecentInvestigations] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_INVESTIGATIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Listen to window focus or storage changes to reload recent suggestions between prescriptions
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const savedC = localStorage.getItem(RECENT_COMPLAINTS_KEY);
        if (savedC) setRecentComplaints(JSON.parse(savedC));
        const savedD = localStorage.getItem(RECENT_DIAGNOSES_KEY);
        if (savedD) setRecentDiagnoses(JSON.parse(savedD));
        const savedI = localStorage.getItem(RECENT_INVESTIGATIONS_KEY);
        if (savedI) setRecentInvestigations(JSON.parse(savedI));
      } catch (e) {}
    };
    window.addEventListener('rx_recent_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('rx_recent_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Add Chief Complaint
  const addComplaint = (text, dur = selectedDuration) => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    const exists = complaints.some(c => c.text === cleanText);
    if (!exists) {
      onUpdateComplaints([...complaints, { text: cleanText, duration: dur }]);
    }
    setCustomComplaint('');
  };

  const removeComplaint = (index) => {
    onUpdateComplaints(complaints.filter((_, i) => i !== index));
  };

  // Helper to parse comma/slash-separated diagnoses into a clean array
  const currentDiagnosisList = diagnosis 
    ? diagnosis.split(',').map(d => d.trim()).filter(Boolean)
    : [];

  // Toggle or add Diagnosis (Multiple selection toggle)
  const handleToggleDiagnosis = (diagText) => {
    if (!diagText || !diagText.trim()) return;
    const clean = diagText.trim();
    const shortName = clean.split(' / ')[0].trim();

    // Check if this diagnosis or its short name is already in the list
    const exists = currentDiagnosisList.some(d => d === clean || d === shortName || clean.includes(d));

    let updatedList;
    if (exists) {
      // Toggle off / remove
      updatedList = currentDiagnosisList.filter(d => d !== clean && d !== shortName && !clean.includes(d));
    } else {
      // Toggle on / append
      updatedList = [...currentDiagnosisList, clean];
    }

    onUpdateDiagnosis(updatedList.join(', '));
  };

  const handleAddCustomDiagnosis = () => {
    if (!customDiagnosis || !customDiagnosis.trim()) return;
    const clean = customDiagnosis.trim();
    const exists = currentDiagnosisList.some(d => d.toLowerCase() === clean.toLowerCase());
    
    if (!exists) {
      const updatedList = [...currentDiagnosisList, clean];
      onUpdateDiagnosis(updatedList.join(', '));
    }
    setCustomDiagnosis('');
  };

  const handleRemoveSingleDiagnosis = (index) => {
    const updatedList = currentDiagnosisList.filter((_, i) => i !== index);
    onUpdateDiagnosis(updatedList.join(', '));
  };

  // Add Investigation
  const addInvestigation = (testName) => {
    if (!testName || !testName.trim()) return;
    const clean = testName.trim();
    if (!investigations.includes(clean)) {
      onUpdateInvestigations([...investigations, clean]);
    }
    setCustomInvestigation('');
    setInvestigationSearch('');
  };

  const removeInvestigation = (index) => {
    onUpdateInvestigations(investigations.filter((_, i) => i !== index));
  };

  // Quick normal vitals filler: BP, Pulse, Temp, SpO2 become 'N' (Normal), leaving Weight and RBS for manual entry
  const setNormalVitals = () => {
    onUpdateVitals({
      ...vitals,
      bp: 'N',
      pulse: 'N',
      temp: 'N',
      spo2: 'N'
    });
  };

  return (
    <div className="space-y-4 mb-5">
      
      {/* 1. Chief Complaints (C/C) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 transition-all">
        <div 
          className="flex items-center justify-between cursor-pointer pb-2 border-b border-slate-100"
          onClick={() => setIsComplaintsOpen(!isComplaintsOpen)}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              Chief Complaints (C/C)
              <span className="text-[11px] bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full">
                {complaints.length}
              </span>
            </h3>
          </div>
          <button type="button" className="text-slate-400 hover:text-slate-600">
            {isComplaintsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isComplaintsOpen && (
          <div className="pt-3 space-y-3">
            
            {/* Recent Suggestions (Limit 5 items) */}
            {recentComplaints.length > 0 && (
              <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
                    <History className="w-3 h-3 text-rose-600" />
                    <span>Recent Suggestions</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRecentComplaints([]);
                      localStorage.removeItem(RECENT_COMPLAINTS_KEY);
                    }}
                    className="text-[10px] text-rose-500 hover:text-rose-700 underline cursor-pointer"
                  >
                    ক্লিয়ার
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentComplaints.map((item, idx) => {
                    const isSelected = complaints.some(c => c.text === item.text);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => addComplaint(item.text, item.duration || '3 days')}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-700'
                            : 'bg-white text-rose-900 border-rose-200 hover:bg-rose-100/70'
                        }`}
                        title={`যোগ করতে ক্লিক করুন (${item.duration || '3 days'})`}
                      >
                        <span>{item.text}</span>
                        {item.duration && (
                          <span className={`text-[10px] ${isSelected ? 'text-rose-100' : 'text-slate-500'}`}>({item.duration})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick 1-Click Complaint Tags (Pure English Only) */}
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">
                Click any tag below to add complaint instantly (1-click):
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                {COMMON_COMPLAINTS.map((item) => {
                  const isSelected = complaints.some(c => c.text === item.en || c.text.includes(item.en));
                  return (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => addComplaint(item.en, item.defaultDuration)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-700 shadow-2xs font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200'
                      }`}
                      title={`${item.en} (${item.defaultDuration})`}
                    >
                      <span>{item.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Complaint Input + Duration + Custom Days */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
              <input
                type="text"
                value={customComplaint}
                onChange={(e) => setCustomComplaint(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addComplaint(customComplaint)}
                placeholder="Type specific complaint in English (e.g. Chest tightness)..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-rose-500"
              />
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                {COMPLAINT_DURATIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded-lg px-1 py-0.5 shrink-0">
                <input
                  type="number"
                  min="1"
                  max="365"
                  placeholder="দিন"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      setSelectedDuration(`${val} days`);
                    }
                  }}
                  className="w-11 text-center text-xs font-bold text-rose-800 bg-transparent outline-none"
                  title="কাস্টম দিন লিখুন (যেমন: 4, 8, 20)"
                />
                <span className="text-[10px] text-slate-500 font-medium pr-0.5">days</span>
              </div>
              <button
                type="button"
                onClick={() => addComplaint(customComplaint)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {/* Added Complaints List */}
            {complaints.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {complaints.map((comp, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 bg-rose-50/50 border border-rose-100 rounded-lg text-xs text-slate-800"
                  >
                    <span className="font-medium">• {comp.text} — <span className="text-rose-700 font-semibold">{comp.duration}</span></span>
                    <button
                      type="button"
                      onClick={() => removeComplaint(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {/* 2. On Examination (O/E) Vitals & Diagnosis */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 transition-all">
        <div 
          className="flex items-center justify-between cursor-pointer pb-2 border-b border-slate-100"
          onClick={() => setIsVitalsOpen(!isVitalsOpen)}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              On Examination (O/E) & Diagnosis
            </h3>
          </div>
          <button type="button" className="text-slate-400 hover:text-slate-600">
            {isVitalsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isVitalsOpen && (
          <div className="pt-3 space-y-3.5">
            
            {/* Quick Normal Vitals preset */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">রোগীর ভাইটালস তথ্য:</span>
              <button
                type="button"
                onClick={setNormalVitals}
                className="text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="BP, Pulse, Temp ও SpO2 ফিল্ডে 'N' (Normal) বসবে। Weight ও RBS ম্যানুয়াল বসান।"
              >
                <CheckCircle2 className="w-3 h-3" /> Fill Normal Vitals (BP, Pulse, Temp, SpO2: N)
              </button>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  BP (mmHg)
                </label>
                <input
                  type="text"
                  inputMode="text"
                  value={vitals.bp || ''}
                  onChange={(e) => onUpdateVitals({ ...vitals, bp: e.target.value })}
                  placeholder="120/80"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Pulse (/min)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={vitals.pulse || ''}
                  onChange={(e) => onUpdateVitals({ ...vitals, pulse: e.target.value })}
                  placeholder="76"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Temp (°F)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vitals.temp || ''}
                  onChange={(e) => onUpdateVitals({ ...vitals, temp: e.target.value })}
                  placeholder="98.4"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  SpO2 (%)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={vitals.spo2 || ''}
                  onChange={(e) => onUpdateVitals({ ...vitals, spo2: e.target.value })}
                  placeholder="99%"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vitals.weight || ''}
                  onChange={(e) => onUpdateVitals({ ...vitals, weight: e.target.value })}
                  placeholder="65"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  RBS (mmol/L)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vitals.rbs || ''}
                  onChange={(e) => onUpdateVitals({ ...vitals, rbs: e.target.value })}
                  placeholder="6.2"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Diagnosis (Dx) Section with Manual Entry & Recent Suggestions */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Provisional / Confirmed Diagnosis (রোগ নির্ণয়):
                </label>
                {diagnosis && (
                  <button
                    type="button"
                    onClick={() => onUpdateDiagnosis('')}
                    className="text-[10px] text-rose-500 hover:text-rose-700 underline cursor-pointer"
                  >
                    ক্লিয়ার
                  </button>
                )}
              </div>

              {/* Selected Multiple Diagnoses Tags with Remove (x) */}
              {currentDiagnosisList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-teal-50/50 rounded-xl border border-teal-100">
                  {currentDiagnosisList.map((d, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-teal-200 text-teal-900 rounded-lg text-xs font-bold shadow-2xs"
                    >
                      <span>• {d}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSingleDiagnosis(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="এই রোগটি বাদ দিন"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Diagnosis Main Display / Direct Editable Input */}
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => onUpdateDiagnosis(e.target.value)}
                placeholder="e.g. Acute Viral URTI, Acid Peptic Disease (APD), Essential Hypertension"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-teal-900 focus:ring-1 focus:ring-teal-500 focus:bg-white"
              />

              {/* Manual Entry Input for Custom/Uncommon Disease */}
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={customDiagnosis}
                  onChange={(e) => setCustomDiagnosis(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDiagnosis()}
                  placeholder="যেকোনো নতুন বা নির্দিষ্ট রোগের নাম লিখে Add চাপুন (ম্যানুয়াল এন্ট্রি)..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDiagnosis}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Diagnosis
                </button>
              </div>

              {/* Recent Suggestions for Diagnosis (Limit 5) */}
              {recentDiagnoses.length > 0 && (
                <div className="p-2 bg-teal-50/60 rounded-xl border border-teal-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1.5">
                      <History className="w-3 h-3 text-teal-600" />
                      <span>Recent Suggestions</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentDiagnoses([]);
                        localStorage.removeItem(RECENT_DIAGNOSES_KEY);
                      }}
                      className="text-[10px] text-teal-600 hover:text-teal-800 underline cursor-pointer"
                    >
                      ক্লিয়ার
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentDiagnoses.map((diag, idx) => {
                      const isSelected = currentDiagnosisList.some(d => d === diag || diag.includes(d));
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleToggleDiagnosis(diag)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                              : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-100/70'
                          }`}
                          title={isSelected ? 'বাদ দিতে ক্লিক করুন' : 'যোগ করতে ক্লিক করুন'}
                        >
                          <span>{diag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Common Diagnoses Quick Tags */}
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1.5">কমন রোগসমূহ (এক ক্লিকে একাধিক রোগ সিলেক্ট/আনসিলেক্ট করুন):</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DIAGNOSES.map((diag) => {
                    const shortName = diag.split(' / ')[0].trim();
                    const isSelected = currentDiagnosisList.some(d => d === diag || d === shortName || diag.includes(d));
                    return (
                      <button
                        key={diag}
                        type="button"
                        onClick={() => handleToggleDiagnosis(diag)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-700 font-bold shadow-2xs'
                            : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border-slate-200 hover:border-teal-200'
                        }`}
                        title={isSelected ? 'বাদ দিতে ক্লিক করুন' : 'যোগ করতে ক্লিক করুন'}
                      >
                        {shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 3. Investigations Advised (Inv) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 transition-all">
        <div 
          className="flex items-center justify-between cursor-pointer pb-2 border-b border-slate-100"
          onClick={() => setIsInvOpen(!isInvOpen)}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              Investigations Advised (ল্যাব টেস্ট)
              <span className="text-[11px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                {investigations.length}
              </span>
            </h3>
          </div>
          <button type="button" className="text-slate-400 hover:text-slate-600">
            {isInvOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isInvOpen && (
          <div className="pt-3 space-y-3">
            
            {/* Recent Suggestions for Investigations (Limit 10) */}
            {recentInvestigations.length > 0 && (
              <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-purple-800 flex items-center gap-1.5">
                    <History className="w-3 h-3 text-purple-600" />
                    <span>Recent Suggestions</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRecentInvestigations([]);
                      localStorage.removeItem(RECENT_INVESTIGATIONS_KEY);
                    }}
                    className="text-[10px] text-purple-600 hover:text-purple-800 underline cursor-pointer"
                  >
                    ক্লিয়ার
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentInvestigations.map((test, idx) => {
                    const isSelected = investigations.includes(test);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => isSelected ? removeInvestigation(investigations.indexOf(test)) : addInvestigation(test)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                            : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100/70'
                        }`}
                        title={isSelected ? 'বাদ দিতে ক্লিক করুন' : 'যোগ করতে ক্লিক করুন'}
                      >
                        <span>{test}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Investigations */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-purple-600 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={investigationSearch}
                  onChange={(e) => setInvestigationSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && investigationSearch.trim()) {
                      const query = investigationSearch.trim().toLowerCase();
                      const match = allInvestigations.find(t => t.toLowerCase() === query) 
                                 || allInvestigations.find(t => t.toLowerCase().includes(query));
                      addInvestigation(match || investigationSearch.trim());
                    }
                  }}
                  placeholder="ল্যাব টেস্ট বা এক্স-রে সার্চ করুন (যেমন: CBC, Sugar, Lipid, X-Ray)..."
                  className="w-full pl-8.5 pr-8 py-2 bg-purple-50/50 hover:bg-purple-50 focus:bg-white border border-purple-200 focus:border-purple-500 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all shadow-2xs"
                />
                {investigationSearch && (
                  <button
                    type="button"
                    onClick={() => setInvestigationSearch('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    title="ক্লিয়ার করুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete / Filtered Dropdown results when searching */}
              {investigationSearch.trim() && (
                <div className="mt-1.5 p-2 bg-white rounded-xl border border-purple-200 shadow-md max-h-56 overflow-y-auto space-y-1 z-20">
                  {(() => {
                    const query = investigationSearch.trim().toLowerCase();
                    // Prioritize exact or prefix matches, limit to top 40 for optimal rendering
                    const matchingList = allInvestigations.filter(test => test.toLowerCase().includes(query));
                    matchingList.sort((a, b) => {
                      const aStarts = a.toLowerCase().startsWith(query);
                      const bStarts = b.toLowerCase().startsWith(query);
                      if (aStarts && !bStarts) return -1;
                      if (!aStarts && bStarts) return 1;
                      return a.localeCompare(b);
                    });
                    const filtered = matchingList.slice(0, 40);
                    const exactMatch = matchingList.some(t => t.toLowerCase() === query);

                    return (
                      <>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1 flex items-center justify-between">
                          <span>সার্চ ফলাফল ({matchingList.length})</span>
                          <span className="text-purple-600 font-semibold">{allInvestigations.length} টেস্ট ডাটাবেস</span>
                        </div>
                        {filtered.length > 0 ? (
                          filtered.map((test) => {
                            const isSelected = investigations.includes(test);
                            return (
                              <button
                                key={test}
                                type="button"
                                onClick={() => isSelected ? removeInvestigation(investigations.indexOf(test)) : addInvestigation(test)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-purple-600 text-white font-bold'
                                    : 'hover:bg-purple-50 text-slate-700'
                                }`}
                              >
                                <span>{test}</span>
                                {isSelected ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5 text-purple-600" />
                                )}
                              </button>
                            );
                          })
                        ) : null}

                        {/* Option to add custom test directly if not found */}
                        {!exactMatch && (
                          <button
                            type="button"
                            onClick={() => addInvestigation(investigationSearch.trim())}
                            className="w-full text-left px-2.5 py-2 mt-1 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all flex items-center justify-between border border-dashed border-purple-300 cursor-pointer"
                          >
                            <span>যুক্ত করুন: <strong>"{investigationSearch.trim()}"</strong></span>
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium">
              প্রয়োজনীয় ল্যাব টেস্টে ক্লিক করে প্রেসক্রিপশনে যুক্ত করুন:
            </p>

            {/* Quick 1-Click Investigation Pills */}
            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
              {COMMON_INVESTIGATIONS.map((test) => {
                const isSelected = investigations.includes(test);
                return (
                  <button
                    key={test}
                    type="button"
                    onClick={() => isSelected ? removeInvestigation(investigations.indexOf(test)) : addInvestigation(test)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-700 shadow-2xs font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-200'
                    }`}
                  >
                    {test}
                  </button>
                );
              })}
            </div>

            {/* Custom Investigation Input */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={customInvestigation}
                onChange={(e) => setCustomInvestigation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addInvestigation(customInvestigation)}
                placeholder="অন্য কোনো ল্যাব টেস্ট বা এক্স-রে লিখুন..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => addInvestigation(customInvestigation)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Test
              </button>
            </div>

            {/* Selected Investigations List */}
            {investigations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {investigations.map((test, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-lg text-xs font-medium"
                  >
                    {test}
                    <button
                      type="button"
                      onClick={() => removeInvestigation(idx)}
                      className="text-purple-400 hover:text-purple-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
};

export default ClinicalSection;
