import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Clock, Phone, AlertCircle, Save, Sparkles, Plus, Check } from 'lucide-react';

const CHAMBER_PRESETS = [
  {
    name: 'পপুলার ডায়াগনস্টিক সেন্টার',
    address: 'বাড়ি #১৬, রোড #২, ধানমন্ডি, ঢাকা',
    hours: 'প্রতিদিন বিকাল ৫:০০ টা - রাত ৯:০০ টা (শুক্রবার বন্ধ)',
    phone: '০৯৬১৩-৭৮৭৮৭৮'
  },
  {
    name: 'ইবনে সিনা ডায়াগনস্টিক ও কনসালটেশন সেন্টার',
    address: 'বাড়ি #৪৮, রোড #৯/এ, ধানমন্ডি, ঢাকা',
    hours: 'শনিবার - বৃহস্পতিবার: সন্ধ্যা ৬:০০ টা - রাত ৯:৩০ টা',
    phone: '০৯৬১০-০১০৬১৬'
  },
  {
    name: 'ল্যাবএইড স্পেশালাইজড হসপিটাল',
    address: 'বাড়ি #১, রোড #৪, ধানমন্ডি, ঢাকা-১২০৫',
    hours: 'প্রতিদিন সকাল ১০:০০ টা - দুপুর ১:০০ টা',
    phone: '১০৬০৬, ০১৭১১-০০২২১১'
  },
  {
    name: 'নিজস্ব ব্যক্তিগত চেম্বার',
    address: 'মেডিকেল রোড, ঢাকা',
    hours: 'প্রতিদিন বিকাল ৪:০০ টা - রাত ৮:০০ টা',
    phone: '০১৭১১-২২৩৩৪৪'
  }
];

export const ChamberModal = ({
  isOpen,
  onClose,
  editingChamber = null, // null for new, chamber object for editing
  baseDoctor = {},
  onSaveChamber,
  darkMode = false
}) => {
  const isEditing = Boolean(editingChamber && editingChamber.id);

  const [formData, setFormData] = useState({
    chamberName: '',
    chamberAddress: '',
    visitingHours: '',
    appointmentPhone: '',
    emergencyNote: '',
    setAsActive: true
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingChamber) {
        setFormData({
          chamberName: editingChamber.chamberName || '',
          chamberAddress: editingChamber.chamberAddress || '',
          visitingHours: editingChamber.visitingHours || '',
          appointmentPhone: editingChamber.appointmentPhone || '',
          emergencyNote: editingChamber.emergencyNote || '',
          setAsActive: true
        });
      } else {
        setFormData({
          chamberName: '',
          chamberAddress: '',
          visitingHours: baseDoctor.visitingHours || 'প্রতিদিন বিকাল ৫:০০ টা - রাত ৯:০০ টা',
          appointmentPhone: baseDoctor.appointmentPhone || baseDoctor.phone || '',
          emergencyNote: baseDoctor.emergencyNote || '',
          setAsActive: true
        });
      }
      setError('');
    }
  }, [isOpen, editingChamber, baseDoctor]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      chamberName: preset.name,
      chamberAddress: preset.address,
      visitingHours: preset.hours,
      appointmentPhone: preset.phone
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const name = formData.chamberName.trim();
    if (!name) {
      setError('অনুগ্রহ করে চেম্বার বা হাসপাতালের নাম লিখুন।');
      return;
    }

    const payload = {
      ...(editingChamber || {}),
      ...baseDoctor, // Retain doctor name, degrees, specialty, BMDC, etc.
      id: isEditing ? editingChamber.id : ('chamber_' + Date.now()),
      chamberName: name,
      chamberAddress: formData.chamberAddress.trim(),
      visitingHours: formData.visitingHours.trim(),
      appointmentPhone: formData.appointmentPhone.trim(),
      emergencyNote: formData.emergencyNote.trim()
    };

    onSaveChamber(payload, !isEditing, formData.setAsActive);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEditing ? 'চেম্বার প্রোফাইল সম্পাদনা (Edit Chamber)' : 'নতুন চেম্বার যুক্ত করুন (Add New Chamber)'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isEditing ? 'এই চেম্বারের তথ্য আপডেট করুন' : 'আলাদা চেম্বার, হাসপাতাল বা ক্লিনিকের ঠিকানা যোগ করুন'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets (Only when adding or if name is empty) */}
          {!isEditing && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>দ্রুত ব্যবহারের জন্য চেম্বার প্রি-সেট সিলেক্ট করুন:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CHAMBER_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded-lg text-[10px] font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chamber Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>চেম্বার / হাসপাতালের নাম *</span>
            </label>
            <input
              type="text"
              value={formData.chamberName}
              onChange={(e) => setFormData({ ...formData, chamberName: e.target.value })}
              placeholder="যেমন: পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-hidden transition-all text-xs"
              required
            />
          </div>

          {/* Chamber Address */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>চেম্বারের সম্পূর্ণ ঠিকানা (Address) *</span>
            </label>
            <textarea
              rows={2}
              value={formData.chamberAddress}
              onChange={(e) => setFormData({ ...formData, chamberAddress: e.target.value })}
              placeholder="যেমন: বাড়ি #১৬, রোড #২, ধানমন্ডি আ/এ, ঢাকা-১২০৫"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-hidden transition-all text-xs"
            />
          </div>

          {/* Visiting Hours & Appointment Phone in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>রোগী দেখার সময় (Visiting Hours)</span>
              </label>
              <input
                type="text"
                value={formData.visitingHours}
                onChange={(e) => setFormData({ ...formData, visitingHours: e.target.value })}
                placeholder="যেমন: বিকাল ৫:০০ - রাত ৯:০০ (শুক্রবার বন্ধ)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-hidden transition-all text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>সিরিয়াল / বুকিং নম্বর</span>
              </label>
              <input
                type="text"
                value={formData.appointmentPhone}
                onChange={(e) => setFormData({ ...formData, appointmentPhone: e.target.value })}
                placeholder="যেমন: ০১৭৮০-৯৬০৩৭০, ০১৯১২-৩৪৫৬৭৮"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-hidden transition-all text-xs"
              />
            </div>
          </div>

          {/* Emergency Note */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              জরুরি বার্তা / নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={formData.emergencyNote}
              onChange={(e) => setFormData({ ...formData, emergencyNote: e.target.value })}
              placeholder="যেমন: সিরিয়ালের জন্য সকাল ৯টার মধ্যে কল দিন"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-hidden transition-all text-xs"
            />
          </div>

          {/* Option: Set as active chamber now */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.setAsActive}
                onChange={(e) => setFormData({ ...formData, setAsActive: e.target.checked })}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-bold text-slate-700">সংরক্ষণের পর এই চেম্বারটি এখনই সক্রিয় (Active) করুন</span>
            </label>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'আপডেট সংরক্ষণ করুন' : 'চেম্বার যুক্ত করুন'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
