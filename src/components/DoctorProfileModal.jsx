import React, { useState } from 'react';
import { X, Save, Stethoscope, Building, Phone, Mail, Award, Clock, Lock, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { updateUserPassword } from '../lib/supabase';

export const DoctorProfileModal = ({ isOpen, onClose, doctor, onSave, currentUser = null }) => {
  const [formData, setFormData] = useState({ ...doctor });

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passStatus, setPassStatus] = useState(null); // { type: 'success' | 'error', text: '' }

  if (!isOpen) return null;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassStatus(null);

    const userPhone = currentUser?.phone || formData.phone;
    if (!userPhone) {
      setPassStatus({ type: 'error', text: 'ব্যবহারকারীর ফোন নম্বর পাওয়া যায়নি।' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassStatus({ type: 'error', text: 'নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।' });
      return;
    }

    setPassLoading(true);
    try {
      const res = await updateUserPassword(userPhone, passwordData.currentPassword, passwordData.newPassword);
      if (res.success) {
        setPassStatus({ type: 'success', text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setShowPasswordSection(false), 2000);
      } else {
        setPassStatus({ type: 'error', text: res.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' });
      }
    } catch (err) {
      setPassStatus({ type: 'error', text: 'সার্ভারে সমস্যা হয়েছে।' });
    } finally {
      setPassLoading(false);
    }
  };

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

          {/* User Password Change Section */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowPasswordSection(!showPasswordSection);
                setPassStatus(null);
              }}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors text-xs font-bold text-slate-800 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 text-teal-600" />
                <span>পাসওয়ার্ড পরিবর্তন করুন (Change Password)</span>
              </span>
              <span className="text-[11px] text-teal-700">
                {showPasswordSection ? 'বন্ধ করুন ▲' : 'পরিবর্তন করুন ▼'}
              </span>
            </button>

            {showPasswordSection && (
              <div className="mt-3 p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-3 animate-in slide-in-from-top-2">
                {passStatus && (
                  <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    passStatus.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {passStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{passStatus.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বর্তমান পাসওয়ার্ড (Current Password)</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">নতুন পাসওয়ার্ড (New Password)</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="মিনিমাম ৬ অক্ষর"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">কনফার্ম নতুন পাসওয়ার্ড</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="মিনিমাম ৬ অক্ষর"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    disabled={passLoading}
                    onClick={handlePasswordChange}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{passLoading ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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
