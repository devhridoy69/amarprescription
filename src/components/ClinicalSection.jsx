import React, { useState } from 'react';
import { 
  Activity, Stethoscope, FileText, Plus, X, HeartPulse, 
  Thermometer, CheckCircle2, ChevronDown, ChevronUp 
} from 'lucide-react';
import { COMMON_COMPLAINTS, COMPLAINT_DURATIONS } from '../data/complaintsData';
import { COMMON_INVESTIGATIONS, COMMON_DIAGNOSES } from '../data/investigationsData';

export const ClinicalSection = ({ 
  complaints, onUpdateComplaints,
  vitals, onUpdateVitals,
  diagnosis, onUpdateDiagnosis,
  investigations, onUpdateInvestigations
}) => {
  // Local input states for custom additions
  const [customComplaint, setCustomComplaint] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('৩ দিন');
  const [customDiagnosis, setCustomDiagnosis] = useState('');
  const [customInvestigation, setCustomInvestigation] = useState('');
  
  // Collapse toggles for mobile compactness
  const [isComplaintsOpen, setIsComplaintsOpen] = useState(true);
  const [isVitalsOpen, setIsVitalsOpen] = useState(true);
  const [isInvOpen, setIsInvOpen] = useState(true);

  // Add Chief Complaint
  const addComplaint = (text, dur = selectedDuration) => {
    if (!text) return;
    const exists = complaints.some(c => c.text === text);
    if (!exists) {
      onUpdateComplaints([...complaints, { text, duration: dur }]);
    }
    setCustomComplaint('');
  };

  const removeComplaint = (index) => {
    onUpdateComplaints(complaints.filter((_, i) => i !== index));
  };

  // Add Investigation
  const addInvestigation = (testName) => {
    if (!testName) return;
    if (!investigations.includes(testName)) {
      onUpdateInvestigations([...investigations, testName]);
    }
    setCustomInvestigation('');
  };

  const removeInvestigation = (index) => {
    onUpdateInvestigations(investigations.filter((_, i) => i !== index));
  };

  // Quick normal vitals filler
  const setNormalVitals = () => {
    onUpdateVitals({
      ...vitals,
      bp: '120/80',
      pulse: '76',
      temp: '98.4',
      spo2: '99'
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
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-500" /> 
              Chief Complaints (C/C - প্রধান লক্ষণ ও উপসর্গ)
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
            
            {/* Quick 1-Click Complaint Tags */}
            <div>
              <p className="text-[11px] text-slate-500 mb-2">
                নিচের বাটনে ক্লিক করে এক ক্লিকে উপসর্গ যুক্ত করুন (টাইপ করতে হবে না):
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50/70 rounded-xl border border-slate-200/60">
                {COMMON_COMPLAINTS.map((item) => {
                  const isSelected = complaints.some(c => c.text.includes(item.bn) || c.text.includes(item.en));
                  return (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => addComplaint(`${item.bn} (${item.en})`, item.defaultDuration)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-700 shadow-2xs font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200'
                      }`}
                    >
                      {item.bn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Complaint Input + Duration */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
              <input
                type="text"
                value={customComplaint}
                onChange={(e) => setCustomComplaint(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addComplaint(customComplaint)}
                placeholder="অন্য কোনো নির্দিষ্ট উপসর্গ লিখুন..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-rose-500"
              />
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
              >
                {COMPLAINT_DURATIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
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
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-blue-500" /> 
              On Examination (O/E) & Diagnosis (শারীরিক পরীক্ষা ও রোগ নির্ণয়)
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
              >
                <CheckCircle2 className="w-3 h-3" /> Fill Normal Vitals (BP 120/80, 98.4°F)
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
                  value={vitals.rbs || ''}
                  onChange={(e) => onUpdateVitals({ ...vitals, rbs: e.target.value })}
                  placeholder="6.2"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Diagnosis (Dx) Section */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Provisional / Confirmed Diagnosis (রোগ নির্ণয়):
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => onUpdateDiagnosis(e.target.value)}
                placeholder="e.g. Acute Viral URTI / Acid Peptic Disease (APD) / Essential Hypertension"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-teal-900 focus:ring-1 focus:ring-teal-500 mb-2"
              />

              {/* Quick Click Diagnoses */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_DIAGNOSES.slice(0, 8).map((diag) => (
                  <button
                    key={diag}
                    type="button"
                    onClick={() => onUpdateDiagnosis(diag)}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-800 border border-slate-200 hover:border-teal-200 transition-colors cursor-pointer"
                  >
                    {diag.split(' / ')[0]}
                  </button>
                ))}
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
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-500" /> 
              Investigations Advised (পরীক্ষা-নিরীক্ষা / ল্যাব টেস্ট)
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
            <p className="text-[11px] text-slate-500">
              প্রয়োজনীয় ল্যাব টেস্টে ক্লিক করে প্রেসক্রিপশনে যুক্ত করুন:
            </p>

            {/* Quick 1-Click Investigation Pills */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50/70 rounded-xl border border-slate-200/60">
              {COMMON_INVESTIGATIONS.map((test) => {
                const isSelected = investigations.includes(test);
                return (
                  <button
                    key={test}
                    type="button"
                    onClick={() => isSelected ? removeInvestigation(investigations.indexOf(test)) : addInvestigation(test)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border cursor-pointer ${
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
