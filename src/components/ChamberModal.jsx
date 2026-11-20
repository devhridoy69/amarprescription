import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Clock, Phone, AlertCircle, Save } from 'lucide-react';

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
          visitingHours: baseDoctor.visitingHours || 'Daily 5:00 PM - 9:00 PM (Friday Closed)',
          appointmentPhone: baseDoctor.appointmentPhone || baseDoctor.phone || '',
          emergencyNote: baseDoctor.emergencyNote || '',
          setAsActive: true
        });
      }
      setError('');
    }
  }, [isOpen, editingChamber, baseDoctor]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const name = formData.chamberName.trim();
    if (!name) {
      setError('Please enter chamber or hospital name.');
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
                {isEditing ? 'Edit Chamber Profile' : 'Add New Chamber'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isEditing ? 'Update details for this chamber profile' : 'Add separate chamber, hospital, or consultation center'}
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

          {/* Chamber Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Chamber / Hospital Name *</span>
            </label>
            <input
              type="text"
              value={formData.chamberName}
              onChange={(e) => setFormData({ ...formData, chamberName: e.target.value })}
              placeholder="e.g. Popular Diagnostic Centre, Dhanmondi"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-hidden transition-all text-xs"
              required
            />
          </div>

          {/* Chamber Address */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>Chamber Full Address *</span>
            </label>
            <textarea
              rows={2}
              value={formData.chamberAddress}
              onChange={(e) => setFormData({ ...formData, chamberAddress: e.target.value })}
              placeholder="e.g. House #16, Road #2, Dhanmondi R/A, Dhaka-1205"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-hidden transition-all text-xs"
            />
          </div>

          {/* Visiting Hours & Appointment Phone in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Visiting Hours / Schedule</span>
              </label>
              <input
                type="text"
                value={formData.visitingHours}
                onChange={(e) => setFormData({ ...formData, visitingHours: e.target.value })}
                placeholder="e.g. Daily 5:00 PM - 9:00 PM (Friday Closed)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-hidden transition-all text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>Serial / Appointment Phone</span>
              </label>
              <input
                type="text"
                value={formData.appointmentPhone}
                onChange={(e) => setFormData({ ...formData, appointmentPhone: e.target.value })}
                placeholder="e.g. +880 1780-960370, 01912-345678"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-hidden transition-all text-xs"
              />
            </div>
          </div>

          {/* Emergency Note */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Emergency Note / Instructions (Optional)
            </label>
            <input
              type="text"
              value={formData.emergencyNote}
              onChange={(e) => setFormData({ ...formData, emergencyNote: e.target.value })}
              placeholder="e.g. Call before 9:00 AM for serial booking"
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
              <span className="font-bold text-slate-700">Set as active chamber immediately upon save</span>
            </label>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Save Chamber'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ChamberModal;
