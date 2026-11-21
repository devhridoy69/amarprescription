import React, { useState, useRef, useEffect, useTransition } from 'react';
import { 
  Pill, Plus, Trash2, Search, ArrowUp, ArrowDown, Sparkles, 
  Coffee, HelpCircle, Check, X, Layers, Clock, Database, Loader2, History,
  Edit3, PlusCircle, GripVertical
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

// ─────────────────────────────────────────────────────────────────────────────
// MedicineEditModal – opens after selecting a medicine from search
// White-mode, matches Admin Panel aesthetic
// ─────────────────────────────────────────────────────────────────────────────
const MEAL_TIMES = ['সকাল', 'দুপুর', 'রাত', 'বিকাল'];
const TAKE_FOR_OPTIONS = [3, 5, 7, 14, 30];
const DEFAULT_INSTRUCTIONS = [
  'খাবার পরে (ভরা পেটে)',
  'খাবার ৩০ মিনিট আগে (খালি পেটে)',
  'জ্বর বা ব্যথা থাকলে',
  'রাতে ঘুমানোর পূর্বে',
  'প্রতিদিন একই নির্দিষ্ট সময়ে',
  'প্রচুর পরিমাণে পানি পান করবেন',
  'ঠান্ডা পানি ও তৈলাক্ত খাবার পরিহার করবেন',
  'চুষে খাবেন',
  'কুসুম গরম পানিতে মিশিয়ে খাবেন',
  'বমি বা অস্বস্তি অনুভূত হলে'
];
const DEFAULT_QUICK_DOSES = ['1/4', '1/2', '3/4', '1', '1 1/2', '2', '2 1/2', '3', '5'];
const DEFAULT_UNITS = ['চামচ', 'ফোঁটা', 'মিলি', 'পাম্প', 'কাপ'];

function MedicineEditModal({ med, onClose, onConfirm, isEdit = false, userPhone = 'default' }) {
  const INST_KEY = `amar_rx_instructions_${userPhone}`;
  const DOSE_KEY = `amar_rx_quick_doses_${userPhone}`;

  // Load custom instructions list with defaults from localStorage
  const [customInsts, setCustomInsts] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(INST_KEY) || 'null');
      if (Array.isArray(saved) && saved.length > 0) {
        const merged = [...saved];
        DEFAULT_INSTRUCTIONS.forEach(inst => {
          if (!merged.includes(inst)) merged.push(inst);
        });
        return merged;
      }
      return DEFAULT_INSTRUCTIONS;
    } catch {
      return DEFAULT_INSTRUCTIONS;
    }
  });

  // Load quick doses list with defaults from localStorage
  const [quickDoses, setQuickDoses] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DOSE_KEY) || 'null');
      if (Array.isArray(saved) && saved.length > 0) {
        const merged = [...saved];
        DEFAULT_QUICK_DOSES.forEach(d => {
          if (!merged.includes(d)) merged.push(d);
        });
        return merged;
      }
      return DEFAULT_QUICK_DOSES;
    } catch {
      return DEFAULT_QUICK_DOSES;
    }
  });

  const [newDoseInput, setNewDoseInput] = useState('');

  const handleAddQuickDose = () => {
    const val = newDoseInput.trim();
    if (!val || quickDoses.includes(val)) return;
    const updated = [...quickDoses, val];
    setQuickDoses(updated);
    try { localStorage.setItem(DOSE_KEY, JSON.stringify(updated)); } catch {}
    setNewDoseInput('');
  };

  const handleRemoveQuickDose = (val, e) => {
    e.stopPropagation();
    const updated = quickDoses.filter(d => d !== val);
    setQuickDoses(updated);
    try { localStorage.setItem(DOSE_KEY, JSON.stringify(updated)); } catch {}
  };

  const UNIT_KEY = `amar_rx_units_${userPhone}`;
  const [unitsList, setUnitsList] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(UNIT_KEY) || 'null');
      if (Array.isArray(saved) && saved.length > 0) {
        const merged = [...saved];
        DEFAULT_UNITS.forEach(u => {
          if (!merged.includes(u)) merged.push(u);
        });
        return merged;
      }
      return DEFAULT_UNITS;
    } catch {
      return DEFAULT_UNITS;
    }
  });

  const [newUnitInput, setNewUnitInput] = useState('');

  const handleAddUnit = () => {
    const val = newUnitInput.trim();
    if (!val || unitsList.includes(val)) return;
    const updated = [...unitsList, val];
    setUnitsList(updated);
    try { localStorage.setItem(UNIT_KEY, JSON.stringify(updated)); } catch {}
    setNewUnitInput('');
    setForm(f => ({ ...f, unit: val }));
  };

  const handleRemoveUnit = (val, e) => {
    e.stopPropagation();
    const updated = unitsList.filter(u => u !== val);
    setUnitsList(updated);
    try { localStorage.setItem(UNIT_KEY, JSON.stringify(updated)); } catch {}
    if (form.unit === val) {
      setForm(f => ({ ...f, unit: '' }));
    }
  };

  const [form, setForm] = useState({
    type:        med.type        || 'Tab',
    brandName:   med.brandName   || '',
    genericName: med.genericName || '',
    strength:    med.strength    || '',
    slots: {
      'সকাল':  med.slots?.['সকাল']  ?? true,
      'দুপুর': med.slots?.['দুপুর'] ?? true,
      'রাত':   med.slots?.['রাত']   ?? true,
      'বিকাল': med.slots?.['বিকাল'] ?? false,
    },
    doses: {
      'সকাল':  med.doses?.['সকাল']  ?? '1',
      'দুপুর': med.doses?.['দুপুর'] ?? '1',
      'রাত':   med.doses?.['রাত']   ?? '1',
      'বিকাল': med.doses?.['বিকাল'] ?? '0',
    },
    unit:         med.unit        || (med.type === 'Syp' ? 'চামচ' : med.type === 'Drop' ? 'ফোঁটা' : ''),
    instruction:  med.instruction || '',
    duration:     med.duration    || '',
    takeForDays:  med.takeForDays || null,
    setAsDefault: false,
  });

  const MEAL_TIMES = ['সকাল', 'দুপুর', 'রাত', 'বিকাল'];
  const TAKE_FOR_OPTIONS = [3, 5, 7, 14, 30];

  const buildDosage = (slots, doses) => {
    const parts = MEAL_TIMES.map(t => slots[t] ? (doses[t] || '1') : '0');
    return parts.slice(0, 3).join('+') + (slots['বিকাল'] ? `+${parts[3]}` : '');
  };

  const handleSlotToggle = (t) => setForm(f => ({ ...f, slots: { ...f.slots, [t]: !f.slots[t] } }));
  const handleDoseChange = (t, val) => setForm(f => ({ ...f, doses: { ...f.doses, [t]: val } }));

  // Auto-save instruction to recent list on blur (if non-empty & not duplicate)
  const handleInstructionBlur = () => {
    const text = (form.instruction || '').trim();
    if (!text || customInsts.includes(text)) return;
    const updated = [text, ...customInsts.filter(i => i !== text)].slice(0, 20);
    setCustomInsts(updated);
    try { localStorage.setItem(INST_KEY, JSON.stringify(updated)); } catch {}
  };

  // Remove from custom list
  const removeCustomInst = (item, e) => {
    e.stopPropagation();
    const updated = customInsts.filter(i => i !== item);
    setCustomInsts(updated);
    try { localStorage.setItem(INST_KEY, JSON.stringify(updated)); } catch {}
  };

  const handleConfirm = () => {
    // Auto-save instruction on confirm too
    const text = (form.instruction || '').trim();
    if (text && !customInsts.includes(text)) {
      const updated = [text, ...customInsts].slice(0, 20);
      setCustomInsts(updated);
      try { localStorage.setItem(INST_KEY, JSON.stringify(updated)); } catch {}
    }
    const dosage = buildDosage(form.slots, form.doses);
    onConfirm({ ...form, dosage, id: med.id || ('rx-med-' + Date.now()) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl mx-auto rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wide">
                {form.type}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {isEdit ? 'Edit' : 'Configure'} — <span className="text-teal-700">{form.brandName}</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {form.strength ? `${form.strength}` : ''}
              {form.genericName ? ` • ${form.genericName}` : ''}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200/70 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
            title="বন্ধ করুন (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">

          {/* Strength (পাওয়ার) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Strength (পাওয়ার / সাইজ)</label>
            <input 
              type="text" 
              value={form.strength} 
              onChange={e => setForm(f => ({ ...f, strength: e.target.value }))}
              placeholder="e.g. 500mg, 20mg, 10ml, 1 puff..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-2xs" 
            />
          </div>

          {/* সময় ও ডোজ নির্বাচন (Morning, Noon, Night, Evening) */}
          <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            <label className="block text-xs font-bold text-slate-800 mb-2.5">
              সময় ও ডোজ নির্বাচন করুন (ডোজ পরিবর্তন করতে ঘরে টাইপ করুন)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MEAL_TIMES.map(t => (
                <div 
                  key={t} 
                  className={`rounded-xl border p-2.5 transition-all ${
                    form.slots[t] 
                      ? 'border-teal-500 bg-white shadow-xs ring-1 ring-teal-400/30' 
                      : 'border-slate-200 bg-slate-100/60 opacity-60'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input 
                      type="checkbox" 
                      checked={form.slots[t]} 
                      onChange={() => handleSlotToggle(t)} 
                      className="accent-teal-600 w-4 h-4 rounded cursor-pointer" 
                    />
                    <span className={`text-xs font-bold ${form.slots[t] ? 'text-teal-900' : 'text-slate-500'}`}>
                      {t}
                    </span>
                  </label>
                  <input 
                    type="text" 
                    value={form.doses[t]} 
                    disabled={!form.slots[t]} 
                    onChange={e => handleDoseChange(t, e.target.value)}
                    className="w-full text-center px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-extrabold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition-all" 
                  />
                </div>
              ))}
            </div>

            {/* Quick Dosage Buttons with custom add and remove */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/80">
              <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Quick Dose:</span>
              {quickDoses.map(v => (
                <div 
                  key={v} 
                  className="inline-flex items-center rounded-lg border border-teal-200 bg-white hover:bg-teal-50 transition-all shadow-2xs group"
                >
                  <button 
                    type="button"
                    onClick={() => {
                      const enabled = Object.keys(form.slots).filter(t => form.slots[t]);
                      const newDoses = { ...form.doses };
                      enabled.forEach(t => { newDoses[t] = v; });
                      setForm(f => ({ ...f, doses: newDoses }));
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-teal-900 cursor-pointer"
                    title={`সব ঘরে ${v} ডোজ বসান`}
                  >
                    {v}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveQuickDose(v, e)}
                    className="pr-1.5 pl-0.5 text-slate-300 hover:text-rose-500 transition-colors text-xs font-bold cursor-pointer"
                    title="ডোজটি তালিকা থেকে মুছে ফেলুন"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add custom quick dose input & button */}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-0.5 shadow-2xs ml-1">
                <input
                  type="text"
                  value={newDoseInput}
                  onChange={e => setNewDoseInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddQuickDose(); } }}
                  placeholder="+ ডোজ..."
                  className="w-14 sm:w-16 text-center text-xs font-bold text-teal-800 outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddQuickDose}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 px-1 py-0.5 hover:bg-teal-50 rounded cursor-pointer transition-colors"
                  title="নতুন ডোজ যোগ করুন"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Unit / পরিমাপ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Unit / পরিমাপ</label>
              {form.unit && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, unit: '' }))}
                  className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer transition-colors"
                  title="পরিমাপ বাদ দিন"
                >
                  ✕ পরিমাপ বাদ দিন (Clear)
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {/* None button */}
              <button 
                type="button"
                onClick={() => setForm(f => ({ ...f, unit: '' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                  !form.unit 
                    ? 'bg-slate-700 text-white border-slate-800 shadow-2xs' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                None
              </button>

              {/* Units from list: চামচ, ফোঁটা, মিলি, পাম্প, কাপ + custom */}
              {unitsList.map(u => (
                <div 
                  key={u}
                  className={`inline-flex items-center rounded-lg border transition-all shadow-2xs group ${
                    form.unit === u 
                      ? 'bg-teal-600 text-white border-teal-700 shadow-2xs ring-1 ring-teal-500' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900'
                  }`}
                >
                  <button 
                    type="button"
                    onClick={() => setForm(f => ({ ...f, unit: f.unit === u ? '' : u }))}
                    className="px-3 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    {u}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveUnit(u, e)}
                    className={`pr-1.5 pl-0.5 text-xs font-bold cursor-pointer transition-colors ${
                      form.unit === u ? 'text-teal-200 hover:text-white' : 'text-slate-300 hover:text-rose-500'
                    }`}
                    title="তালিকা থেকে মুছে ফেলুন"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add custom unit input & button */}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-0.5 shadow-2xs ml-1">
                <input
                  type="text"
                  value={newUnitInput}
                  onChange={e => setNewUnitInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUnit(); } }}
                  placeholder="+ ইউনিট..."
                  className="w-16 sm:w-20 text-center text-xs font-bold text-teal-800 outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddUnit}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 px-1.5 py-1 hover:bg-teal-50 rounded cursor-pointer transition-colors"
                  title="নতুন ইউনিট যোগ করুন"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Take For (কতদিন) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Take For (কতদিন চলবে)</label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {TAKE_FOR_OPTIONS.map(d => (
                <button 
                  key={d} 
                  type="button"
                  onClick={() => setForm(f => ({ 
                    ...f, 
                    takeForDays: f.takeForDays === d ? null : d, 
                    duration: f.takeForDays === d ? '' : `${d} দিন` 
                  }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                    form.takeForDays === d 
                      ? 'bg-teal-600 text-white border-teal-700 shadow-2xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900'
                  }`}
                >
                  {d} দিন
                </button>
              ))}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs">
                <input 
                  type="number" 
                  min="1" 
                  max="365" 
                  value={form.takeForDays || ''}
                  onChange={e => { 
                    const v = e.target.value; 
                    setForm(f => ({ 
                      ...f, 
                      takeForDays: v ? Number(v) : null, 
                      duration: v ? `${v} দিন` : '' 
                    })); 
                  }}
                  placeholder="কাস্টম"
                  className="w-12 text-center text-xs font-bold text-teal-800 outline-none bg-transparent" 
                />
                <span className="text-xs text-slate-500 font-semibold">দিন</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer ml-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100">
                <input 
                  type="checkbox"
                  checked={!!form.duration && form.duration.trim().toLowerCase() === 'n/a'}
                  onChange={e => setForm(f => ({ ...f, duration: e.target.checked ? 'N/A' : '', takeForDays: null }))}
                  className="accent-teal-600 w-4 h-4 cursor-pointer" 
                />
                <span className="text-xs text-slate-700 font-bold">চলবে (N/A)</span>
              </label>
            </div>
          </div>

          {/* Instruction — auto-saves on blur/confirm, custom list with Add option */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Instruction or custom time (খাবার নিয়ম / পরামর্শ)</label>
              {form.instruction?.trim() && !customInsts.includes(form.instruction.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    const text = form.instruction.trim();
                    if (!text || customInsts.includes(text)) return;
                    const updated = [text, ...customInsts].slice(0, 20);
                    setCustomInsts(updated);
                    try { localStorage.setItem(INST_KEY, JSON.stringify(updated)); } catch {}
                  }}
                  className="text-xs text-teal-700 hover:text-teal-900 font-bold bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="এই নিয়মটি নিচের তালিকায় সেভ করে রাখুন"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>তালিকায় সেভ রাখুন (+ Add)</span>
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.instruction}
              onChange={e => setForm(f => ({ ...f, instruction: e.target.value }))}
              onBlur={handleInstructionBlur}
              placeholder="যেমন: জ্বর থাকলে, খাবার পরে, ভরা পেটে..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-2 transition-all shadow-2xs"
            />
            {/* Custom / preset instruction pills with click-to-select and delete */}
            {customInsts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                {customInsts.map(inst => (
                  <span 
                    key={inst} 
                    className={`group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                      form.instruction === inst 
                        ? 'bg-teal-600 text-white border-teal-700 shadow-2xs ring-1 ring-teal-500' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900'
                    }`}
                    onClick={() => setForm(f => ({ ...f, instruction: f.instruction === inst ? '' : inst }))}
                  >
                    <span>{inst}</span>
                    <button 
                      type="button" 
                      onClick={e => removeCustomInst(inst, e)}
                      className={`font-bold cursor-pointer transition-colors p-0.5 rounded-full ${
                        form.instruction === inst 
                          ? 'text-teal-200 hover:text-white' 
                          : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                      }`}
                      title="তালিকা থেকে মুছে ফেলুন"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {customInsts.length === 0 && (
              <p className="text-[11px] text-slate-400 italic">উপরে নিয়ম লিখুন — অটোমেটিক সেভ হবে অথবা (+ Add) বাটনে চাপুন</p>
            )}
          </div>

          {/* Set as default */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input 
              type="checkbox" 
              checked={form.setAsDefault}
              onChange={e => setForm(f => ({ ...f, setAsDefault: e.target.checked }))}
              className="accent-teal-600 w-4 h-4 rounded cursor-pointer" 
            />
            <span className="text-xs font-medium text-slate-600">ভবিষ্যতের জন্য এই ওষুধের ডিফল্ট সেটিং হিসেবে রাখুন</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer transition-all shadow-2xs"
          >
            Close (বন্ধ করুন)
          </button>
          <button 
            type="button" 
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer transition-all shadow-md hover:shadow-lg"
          >
            {isEdit ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {isEdit ? 'Update Medicine' : 'Add to Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
}

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

  // Modal state: null = closed; { med, isEdit, editIdx } = open
  const [medModal, setMedModal] = useState(null);

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

  // Debounced search to local IndexedDB (0ms) and Supabase (21,000+ medicines)
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 1) {
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
        const query = searchTerm.trim();
        // 1. Try local IndexedDB offline search first (0ms latency, works completely without net!)
        let results = await searchMedicinesOffline(query, 25);
        
        // 2. If online and local results are less than 5, supplement with Supabase query
        if (navigator.onLine && (!results || results.length < 5)) {
          try {
            const onlineResults = await searchMedicinesOnline(query, 25);
            if (onlineResults && onlineResults.length > 0) {
              const existingIds = new Set((results || []).map(r => String(r.id)));
              const merged = [...(results || [])];
              for (const item of onlineResults) {
                if (!existingIds.has(String(item.id))) {
                  existingIds.add(String(item.id));
                  merged.push(item);
                }
              }
              results = merged;
            }
          } catch (onlineErr) {
            console.warn('Online medicine query skipped/failed, keeping offline results:', onlineErr);
          }
        }

        // 3. Absolute offline safety net: if still no results, search COMMON_MEDICINES
        if (!results || results.length === 0) {
          const lowerQ = query.toLowerCase();
          results = (COMMON_MEDICINES || []).filter(item => {
            if (!item) return false;
            const b = (item.brandName || '').toLowerCase();
            const g = (item.genericName || '').toLowerCase();
            return b.includes(lowerQ) || g.includes(lowerQ);
          }).slice(0, 20);
        }

        setOnlineSuggestions(results || []);
      } catch (e) {
        console.error('Medicine search error:', e);
        // Fallback to local
        const lowerQ = searchTerm.trim().toLowerCase();
        const fallback = (COMMON_MEDICINES || []).filter(item => {
          if (!item) return false;
          const b = (item.brandName || '').toLowerCase();
          const g = (item.genericName || '').toLowerCase();
          return b.includes(lowerQ) || g.includes(lowerQ);
        }).slice(0, 20);
        setOnlineSuggestions(fallback);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 100);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Merge suggestions: prioritize online/offline matched results, then fallback to local
  const combinedSuggestions = React.useMemo(() => {
    if (onlineSuggestions && onlineSuggestions.length > 0) {
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

  // Quick select a medicine from database -> open configure modal
  const handleSelectMedicine = (med) => {
    if (!med) return;
    const rawType = med.type || med.Type || '';
    const bName = med.brandName || med.brand_name || '';
    const gName = med.genericName || med.generic_name || '';
    const str = med.strength || '';
    const medType = normalizeType(rawType);
    const defaultUnit = medType === 'Syp' ? 'চামচ' : medType === 'Supp' ? 'টি' : '';
    const initialUnit = (med.defaultUnit && med.defaultUnit !== 'Tablet' && med.defaultUnit !== 'Capsule') ? med.defaultUnit : defaultUnit;

    setShowSuggestions(false);
    setMedModal({
      isEdit: false,
      editIdx: null,
      med: {
        type: medType,
        brandName: bName,
        genericName: gName,
        strength: str,
        dosage: med.defaultDosage || '1+0+1',
        unit: initialUnit,
        instruction: '',
        duration: '',
        slots: { 'সকাল': true, 'দুপুর': true, 'রাত': true, 'বিকাল': false },
        doses: { 'সকাল': '1', 'দুপুর': '1', 'রাত': '1', 'বিকাল': '0' },
      }
    });
    setCurrentMed(prev => ({ ...prev, brandName: '', genericName: '', strength: '' }));
    setSearchTerm('');
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

  // Modal: confirm add new medicine
  const handleModalConfirm = (medData) => {
    onAddMedicine({ ...medData, id: 'rx-med-' + Date.now() });
    setMedModal(null);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Modal: confirm update existing medicine
  const handleModalUpdate = (medData) => {
    if (medModal && medModal.editIdx !== null) {
      onUpdateMedicine(medModal.editIdx, medData);
    }
    setMedModal(null);
  };

  // Open edit modal for an existing medicine
  const handleEditMedicine = (idx) => {
    const med = medicines[idx];
    const parts = (med.dosage || '1+0+1').split('+');
    const slots = {
      'সকাল': parts[0] !== '0',
      'দুপুর': (parts[1] || '0') !== '0',
      'রাত': (parts[2] || '0') !== '0',
      'বিকাল': parts.length > 3 && parts[3] !== '0',
    };
    const doses = {
      'সকাল': parts[0] || '1',
      'দুপুর': parts[1] || '0',
      'রাত': parts[2] || '0',
      'বিকাল': parts[3] || '0',
    };
    setMedModal({ isEdit: true, editIdx: idx, med: { ...med, slots, doses } });
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

  // Drag & drop reorder states and handlers
  const [draggedMedIdx, setDraggedMedIdx] = useState(null);
  const [dragOverMedIdx, setDragOverMedIdx] = useState(null);

  const handleMedDragStart = (e, index) => {
    if (e.target.closest('button')) {
      e.preventDefault();
      return;
    }
    setDraggedMedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(index)); } catch {}
  };

  const handleMedDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverMedIdx !== index) {
      setDragOverMedIdx(index);
    }
  };

  const handleMedDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedMedIdx === null || draggedMedIdx === targetIndex) {
      setDraggedMedIdx(null);
      setDragOverMedIdx(null);
      return;
    }
    const updated = [...medicines];
    const [moved] = updated.splice(draggedMedIdx, 1);
    updated.splice(targetIndex, 0, moved);
    onReorderMedicines(updated);
    setDraggedMedIdx(null);
    setDragOverMedIdx(null);
  };

  const handleMedDragEnd = () => {
    setDraggedMedIdx(null);
    setDragOverMedIdx(null);
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
              Prescribe Medication
              <span className="text-[11px] bg-teal-100/70 text-teal-800 px-2 py-0.5 rounded-full font-medium">
                {medicines.length} added
              </span>
            </h2>
          </div>
        </div>

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

      {/* Search & Select Medicine Bar */}
      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/80 mb-5 shadow-2xs">
        <div className="relative">
          <label className="block text-[11px] font-medium text-slate-600 mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Search Medicine (ঔষধের নাম বা জেনেরিক দিয়ে খুঁজুন)</span>
            <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
              <Database className="w-3 h-3 text-teal-600 inline" />
              ২১,০০০+ লাইভ ডেটাবেজ
            </span>
          </label>
          <div className="relative flex items-center">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="ঔষধের নাম লিখুন ও সিলেক্ট করুন (যেমন: Napa, Cef-3, Ace, Sergel)..."
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            
            {isSearchingOnline ? (
              <Loader2 className="w-4 h-4 text-teal-600 animate-spin absolute right-3 top-3" />
            ) : searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div 
              ref={suggestionsRef}
              className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto"
            >
              <div className="p-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-[11px] text-slate-500 sticky top-0 z-10">
                <span className="flex items-center gap-1 font-medium">
                  <Database className="w-3 h-3 text-teal-600" />
                  <span>{navigator.onLine ? 'ক্লিক করলেই Configure/Dose উইন্ডো চালু হবে (21k+ DB)' : 'অফলাইন সার্চ (Offline Mode)'}</span>
                </span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  {combinedSuggestions.length} টি পাওয়া গেছে
                </span>
              </div>
              {combinedSuggestions.length > 0 ? (
                combinedSuggestions.map((item, idx) => (
                  <button
                    key={item.id ? `med-${item.id}-${idx}` : `med-idx-${idx}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectMedicine(item);
                    }}
                    onClick={() => handleSelectMedicine(item)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-teal-50/90 transition-colors flex items-center justify-between border-b border-slate-50 last:border-none cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 max-w-[70%]">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 whitespace-nowrap">
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
                          <span className="block text-[10px] text-slate-400 truncate mt-0.5">
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
                <div className="p-4 text-center text-xs text-slate-500">
                  {isSearchingOnline ? 'খোঁজা হচ্ছে...' : 'কোনো তথ্য পাওয়া যায়নি, নতুন কোনো ঔষধ থাকলে টাইপ করে এন্টার চাপুন'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Added Medicines List */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Prescribed Medicines List ({medicines.length})</span>
          {medicines.length > 0 && (
            <span className="text-[11px] text-slate-400 font-normal">
              টেনে (Drag) বা তীরচিহ্ন দিয়ে ক্রম সাজাতে পারেন
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
                draggable
                onDragStart={(e) => handleMedDragStart(e, idx)}
                onDragOver={(e) => handleMedDragOver(e, idx)}
                onDragLeave={() => { if (dragOverMedIdx === idx) setDragOverMedIdx(null); }}
                onDrop={(e) => handleMedDrop(e, idx)}
                onDragEnd={handleMedDragEnd}
                className={`group flex items-center justify-between p-3 bg-white hover:bg-teal-50/40 border rounded-xl transition-all shadow-2xs cursor-grab active:cursor-grabbing select-none ${
                  draggedMedIdx === idx
                    ? 'opacity-40 scale-[0.99] border-dashed border-teal-400 bg-teal-50/50'
                    : dragOverMedIdx === idx
                      ? 'border-teal-500 ring-2 ring-teal-400/40 bg-teal-50/30'
                      : 'border-slate-200 hover:border-teal-200'
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  
                  {/* Drag Handle & Sequence number */}
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-colors" />
                    <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-teal-600 group-hover:text-white text-slate-600 font-bold text-xs flex items-center justify-center transition-colors">
                      {idx + 1}
                    </span>
                  </div>

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
                      {med.unit && (
                        <span className="text-slate-800 font-bold">
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

                {/* Actions: Edit, Reorder & Delete */}
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditMedicine(idx)}
                    className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                    title="Edit Medicine"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
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

      {/* Medicine Configure / Edit Modal */}
      {medModal && (
        <MedicineEditModal
          key={medModal.editIdx !== null ? 'edit-' + medModal.editIdx : 'add-new'}
          med={medModal.med}
          isEdit={medModal.isEdit}
          onClose={() => setMedModal(null)}
          onConfirm={medModal.isEdit ? handleModalUpdate : handleModalConfirm}
          userPhone={userPhone}
        />
      )}
    </div>
  );
};

export default MedicineSection;
