import React from 'react';
import { User, Calendar, Hash, HeartPulse, Scale, RefreshCw, Phone } from 'lucide-react';

export const PatientInfoBar = ({ patient, onChange, onReset, isEditing = false, onCancelEdit = null }) => {
  const handleInputChange = (field, value) => {
    onChange({ ...patient, [field]: value });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-4 mb-4 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Patient Information (রোগীর তথ্য)
          </span>
          {isEditing && (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-300">
              এডিটিং মোড (Re-editing)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-[11px] text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer"
              title="এডিটিং শেষ করে নতুন প্রেসক্রিপশনে যান"
            >
              Cancel Edit
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-rose-50 font-medium cursor-pointer"
            title="Reset Patient Details"
          >
            <RefreshCw className="w-3 h-3" /> New Patient
          </button>
        </div>
      </div>

      {/* Robust Responsive Grid - Avoids Narrow Column Squishing */}
      <div className="grid grid-cols-12 gap-2.5 sm:gap-3 text-xs">
        
        {/* Row 1: Patient Name (Wider) */}
        <div className="col-span-12 sm:col-span-6">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Patient Name * (রোগীর নাম)
          </label>
          <input
            type="text"
            inputMode="text"
            value={patient.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g. মোঃ করিম উদ্দিন"
            className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Row 1: Age & Age Unit (Unified Input Group) */}
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Age (বয়স)
          </label>
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 focus-within:bg-white overflow-hidden">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={patient.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="35"
              className="w-full px-2.5 py-2 bg-transparent text-slate-900 font-medium text-center focus:outline-hidden"
            />
            <select
              value={patient.ageUnit || 'Y'}
              onChange={(e) => handleInputChange('ageUnit', e.target.value)}
              className="bg-slate-100 border-l border-slate-200 px-2 py-2 text-slate-700 font-medium text-[11px] focus:outline-hidden cursor-pointer"
            >
              <option value="Y">Yrs</option>
              <option value="M">Mos</option>
              <option value="D">Days</option>
            </select>
          </div>
        </div>

        {/* Row 1: Gender */}
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Gender (লিঙ্গ)
          </label>
          <div className="flex h-[38px] rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {[
              { key: 'Male', label: 'Male (পু.)', short: 'M' },
              { key: 'Female', label: 'Female (মহি.)', short: 'F' }
            ].map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => handleInputChange('gender', g.key)}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  patient.gender === g.key
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g.short}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Date */}
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Date (তারিখ)
          </label>
          <input
            type="date"
            value={patient.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Row 2: Rx ID */}
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Rx / ID No.
          </label>
          <input
            type="text"
            value={patient.rxId}
            onChange={(e) => handleInputChange('rxId', e.target.value)}
            placeholder="RX-1001"
            className="w-full px-2.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg font-mono text-xs font-semibold focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Row 2: Weight & Unit (KG / Gram) */}
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            <Scale className="w-3 h-3 text-slate-400" /> Wt (ওজন)
          </label>
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 focus-within:bg-white overflow-hidden">
            <input
              type="text"
              inputMode="decimal"
              value={patient.weight || ''}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              placeholder="65"
              className="w-full px-2.5 py-2 bg-transparent text-slate-900 font-medium text-center focus:outline-hidden"
            />
            <select
              value={patient.weightUnit || 'kg'}
              onChange={(e) => handleInputChange('weightUnit', e.target.value)}
              className="bg-slate-100 border-l border-slate-200 px-2 py-2 text-slate-700 font-bold text-[11px] focus:outline-hidden cursor-pointer"
            >
              <option value="kg">kg</option>
              <option value="gm">gm</option>
            </select>
          </div>
        </div>

        {/* Row 2: Patient Phone Number (Optional) */}
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" /> Patient Phone (রোগীর মোবাইল - ঐচ্ছিক)
          </label>
          <input
            type="tel"
            inputMode="tel"
            value={patient.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="01700-000000"
            className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          />
        </div>

      </div>
    </div>
  );
};

export default PatientInfoBar;
