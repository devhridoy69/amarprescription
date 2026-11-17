import React, { useState } from 'react';
import { X, Save, Stethoscope, Building, Phone, Mail, Award, Clock } from 'lucide-react';

export const DoctorProfileModal = ({ isOpen, onClose, doctor, onSave }) => {
  const [formData, setFormData] = useState({ ...doctor });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Doctor & Chamber Settings</h2>
              <p className="text-xs text-slate-500">ডাঃ ও চেম্বারের তথ্য সেট করুন (প্রেসক্রিপশন হেডারে প্রদর্শিত হবে)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-sm">
          
          {/* Doctor Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Doctor Credentials
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Doctor Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Md. Rafiqul Islam"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">BMDC Reg. No. *</label>
                <input
                  type="text"
                  name="bmdcReg"
                  value={formData.bmdcReg}
                  onChange={handleChange}
                  placeholder="e.g. A-48920"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Degrees & Qualifications *</label>
              <input
                type="text"
                name="degrees"
                value={formData.degrees}
                onChange={handleChange}
                placeholder="e.g. MBBS (DMC), BCS (Health), FCPS (Medicine), MD"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Specialty / Sub-specialty</label>
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="e.g. Medicine Specialist & Interventional Physician"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Designation & Hospital</label>
                <input
                  type="text"
                  name="workplace"
                  value={formData.workplace}
                  onChange={handleChange}
                  placeholder="e.g. Associate Professor, Dhaka Medical College"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Chamber Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
              <Building className="w-4 h-4" /> Chamber & Hospital Information
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Chamber / Hospital Name *</label>
              <input
                type="text"
                name="chamberName"
                value={formData.chamberName}
                onChange={handleChange}
                placeholder="e.g. Ayan Specialized Digital Chamber & Diagnostic Center"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Chamber Address</label>
              <input
                type="text"
                name="chamberAddress"
                value={formData.chamberAddress}
                onChange={handleChange}
                placeholder="e.g. House #12, Road #04, Dhanmondi, Dhaka"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Consultation Hours
                </label>
                <input
                  type="text"
                  name="visitingHours"
                  value={formData.visitingHours}
                  onChange={handleChange}
                  placeholder="e.g. বিকাল ৫:০০ - রাত ৯:০০ (শুক্রবার বন্ধ)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Serial / Appointment Phone
                </label>
                <input
                  type="text"
                  name="serialPhone"
                  value={formData.serialPhone}
                  onChange={handleChange}
                  placeholder="e.g. +880 1812-998877"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Doctor Personal Phone (Optional)
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +880 1712-345678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. dr.rafiqul@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Notice / Footer Note</label>
              <input
                type="text"
                name="emergencyNote"
                value={formData.emergencyNote}
                onChange={handleChange}
                placeholder="e.g. জরুরী প্রয়োজনে হাসপাতালের ইমার্জেন্সিতে যোগাযোগ করুন।"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>
          </div>

          {/* Branding Toggle */}
          <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-100 flex items-center justify-between">
            <div>
              <span className="font-semibold text-teal-900 text-xs block">Amar Prescription Brand Watermark</span>
              <span className="text-[11px] text-teal-700">"Amar Prescription (আমার প্রেসক্রিপশন) By Ayan Tech" in footer</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="showAyanTechBranding"
                checked={formData.showAyanTechBranding}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfileModal;
