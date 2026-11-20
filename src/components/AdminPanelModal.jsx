import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, ShieldCheck, Users, Clock, CheckCircle2, 
  XCircle, Ban, Trash2, Calendar, Search, RefreshCw, 
  X, Phone, Award, Stethoscope, AlertTriangle, Key, LogOut,
  Sliders, UserCheck, UserX, FileText, ChevronRight, Edit3, Save, Sparkles, Building, Lock, UserPlus, QrCode
} from 'lucide-react';
import { 
  adminFetchAllUsers, 
  adminUpdateUserStatus, 
  adminUpdateUserFullDetails, 
  adminDeleteUser,
  updateAdminMasterPassword,
  adminCreateUser
} from '../lib/supabase';

export const AdminPanelModal = ({ 
  isOpen, 
  onClose, 
  adminUser, 
  onAdminLogout,
  darkMode = false 
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [notification, setNotification] = useState(null);

  // Modal Sub-state: Edit Doctor Details
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Modal Sub-state: Admin Change Password
  const [isAdminPassModalOpen, setIsAdminPassModalOpen] = useState(false);
  const [adminPassForm, setAdminPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [adminPassLoading, setAdminPassLoading] = useState(false);
  const [adminPassError, setAdminPassError] = useState('');

  // Modal Sub-state: Create New Doctor by Admin
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    fullName: '',
    phone: '',
    password: '',
    degrees: 'MBBS',
    specialty: 'General Physician',
    bmdcReg: '',
    status: 'approved',
    validityDays: '30'
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminFetchAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Approval with days and default watermark option
  const handleApprove = async (user, days = 30, withWatermark = true) => {
    const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await adminUpdateUserStatus(user.id, user.phone, 'approved', validUntil, withWatermark);
    showToast(`ডাক্তার "${user.full_name}"-কে অনুমোদন দেওয়া হয়েছে (${days} দিন, Watermark: ${withWatermark ? 'On' : 'Off'})।`);
    loadUsers();
  };

  const handleToggleWatermark = async (user) => {
    const currentVal = user.has_watermark !== false; // Default true if not set
    const newVal = !currentVal;
    await adminUpdateUserFullDetails(user.id, user.phone, { has_watermark: newVal });
    showToast(`"${user.full_name}"-এর প্রেসক্রিপশনে Watermark ${newVal ? 'যুক্ত করা হয়েছে' : 'মুছে ফেলা হয়েছে (Clean Paper)'}।`);
    loadUsers();
  };

  const handleToggleQrCode = async (user) => {
    const currentVal = user.show_qr !== false; // Default true if not set
    const newVal = !currentVal;
    await adminUpdateUserFullDetails(user.id, user.phone, { show_qr: newVal });
    showToast(`"${user.full_name}"-এর প্রেসক্রিপশনে QR Code ${newVal ? 'অন (Active)' : 'বন্ধ (Disabled)'} করা হয়েছে।`);
    loadUsers();
  };

  const handleReject = async (user) => {
    if (!window.confirm(`আপনি কি "${user.full_name}"-এর রেজিস্ট্রেশন আবেদন বাতিল করতে চান?`)) return;
    await adminUpdateUserStatus(user.id, user.phone, 'rejected');
    showToast(`"${user.full_name}"-এর আবেদন বাতিল করা হয়েছে।`, 'warning');
    loadUsers();
  };

  const handleSuspend = async (user) => {
    const newStatus = user.status === 'suspended' ? 'approved' : 'suspended';
    await adminUpdateUserStatus(user.id, user.phone, newStatus);
    showToast(newStatus === 'suspended' ? `"${user.full_name}"-এর অ্যাকাউন্ট সাসপেন্ড করা হয়েছে।` : `"${user.full_name}"-এর অ্যাকাউন্ট সক্রিয় করা হয়েছে।`);
    loadUsers();
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`সতর্কতা: আপনি কি ডাক্তার "${user.full_name}" (${user.phone}) অ্যাকাউন্টটি ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলতে চান?`)) return;
    await adminDeleteUser(user.id, user.phone);
    showToast(`"${user.full_name}" অ্যাকাউন্ট মুছে ফেলা হয়েছে।`);
    loadUsers();
  };

  const handleOpenEditModal = (user) => {
    setEditingDoctor(user);
    setEditFormData({
      full_name: user.full_name || '',
      phone: user.phone || '',
      password_hash: user.password_hash || '',
      degrees: user.degrees || '',
      specialty: user.specialty || '',
      bmdc_reg: user.bmdc_reg || '',
      workplace: user.workplace || '',
      chamber_name: user.chamber_name || '',
      chamber_address: user.chamber_address || '',
      visiting_hours: user.visiting_hours || '',
      appointment_phone: user.appointment_phone || '',
      valid_until: user.valid_until || '',
      has_watermark: user.has_watermark !== false,
      show_qr: user.show_qr !== false,
      status: user.status || 'approved'
    });
  };

  const handleSaveDoctorEdit = async (e) => {
    e.preventDefault();
    if (!editingDoctor) return;
    await adminUpdateUserFullDetails(editingDoctor.id, editingDoctor.phone, editFormData);
    showToast(`ডাক্তার "${editFormData.full_name}"-এর সকল তথ্য সফলভাবে আপডেট করা হয়েছে।`);
    setEditingDoctor(null);
    loadUsers();
  };

  const handleAdminPasswordSubmit = async (e) => {
    e.preventDefault();
    setAdminPassError('');

    if (!adminPassForm.currentPassword) {
      setAdminPassError('অনুগ্রহ করে বর্তমান এডমিন পাসওয়ার্ড দিন।');
      return;
    }
    if (!adminPassForm.newPassword || adminPassForm.newPassword.length < 4) {
      setAdminPassError('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    if (adminPassForm.newPassword !== adminPassForm.confirmPassword) {
      setAdminPassError('নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!');
      return;
    }

    setAdminPassLoading(true);
    try {
      const res = await updateAdminMasterPassword(adminPassForm.currentPassword, adminPassForm.newPassword);
      if (res.success) {
        showToast('এডমিন পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
        setIsAdminPassModalOpen(false);
        setAdminPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setAdminPassError(res.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setAdminPassError('একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setAdminPassLoading(false);
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setCreateUserError('');

    if (!createUserForm.phone || !createUserForm.password) {
      setCreateUserError('ফোন নম্বর ও পাসওয়ার্ড আবশ্যক।');
      return;
    }
    if (createUserForm.password.length < 4) {
      setCreateUserError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    setCreateUserLoading(true);
    try {
      const res = await adminCreateUser(createUserForm);
      if (res.success) {
        showToast(`ডাক্তার "${res.data.full_name}" সফলভাবে যুক্ত করা হয়েছে!`);
        setIsCreateUserModalOpen(false);
        setCreateUserForm({
          fullName: '',
          phone: '',
          password: '',
          degrees: 'MBBS',
          specialty: 'General Physician',
          bmdcReg: '',
          status: 'approved',
          validityDays: '30'
        });
        loadUsers();
      } else {
        setCreateUserError(res.error || 'ইউজার তৈরি ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setCreateUserError('ইউজার তৈরিতে সমস্যা দেখা দিয়েছে।');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchTerm.toLowerCase();
      const matchSearch = 
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.bmdc_reg || '').toLowerCase().includes(q) ||
        (u.specialty || '').toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (statusFilter === 'all') return true;
      return u.status === statusFilter;
    });
  }, [users, searchTerm, statusFilter]);

  if (!isOpen) return null;

  const totalUsers = users.length;
  const pendingUsers = users.filter(u => u.status === 'pending').length;
  const approvedUsers = users.filter(u => u.status === 'approved').length;
  const rejectedUsers = users.filter(u => u.status === 'rejected' || u.status === 'suspended').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Admin Panel Main Container */}
      <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Admin Bar Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  Amar Prescription • Master Admin Panel
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                  Super Admin Control
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ডাক্তার ইউজারদের ডাটা ও প্রোফাইল এডিট, অনুমোদন, ওয়াটারমার্ক নিয়ন্ত্রণ ও ভ্যালিডিটি টাইম সেটিং
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCreateUserError('');
                setCreateUserForm({
                  fullName: '',
                  phone: '',
                  password: '',
                  degrees: 'MBBS',
                  specialty: 'General Physician',
                  bmdcReg: '',
                  status: 'approved',
                  validityDays: '30'
                });
                setIsCreateUserModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="এডমিন থেকে সরাসরি নতুন ডাক্তার অ্যাকাউন্ট তৈরি করুন"
            >
              <UserPlus className="w-3.5 h-3.5 text-white" />
              <span>+ নতুন ইউজার তৈরি (Create User)</span>
            </button>
            <button
              onClick={() => {
                setAdminPassError('');
                setAdminPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setIsAdminPassModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs hover:border-teal-400"
              title="এডমিন পাসওয়ার্ড পরিবর্তন করুন"
            >
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>এডমিন পাসওয়ার্ড (Change Key)</span>
            </button>
            <button
              onClick={loadUsers}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onAdminLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="এডমিন প্যানেল থেকে লগআউট করুন"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট (Logout)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
          
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">সর্বমোট ডাক্তার</span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalUsers}
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">অনুমোদনের অপেক্ষায় (Pending)</span>
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {pendingUsers}
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">সক্রিয় ইউজার (Approved)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {approvedUsers}
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-rose-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700">স্থগিত / বাতিল (Rejected)</span>
              <Ban className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {rejectedUsers}
            </div>
          </div>

        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border-b border-slate-100">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ডাক্তারের নাম, ফোন নম্বর, BMDC নম্বর বা বিশেষজ্ঞতা দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start md:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-teal-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সকল ({totalUsers})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              পেন্ডিং ({pendingUsers})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              অনুমোদিত ({approvedUsers})
            </button>
          </div>

        </div>

        {/* Toast Notification */}
        {notification && (
          <div className={`mx-5 mt-2 p-2.5 rounded-xl text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2 ${
            notification.type === 'warning'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}>
            <span>{notification.msg}</span>
            <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-slate-800 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* User Accounts List Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-2xl">
              {searchTerm 
                ? `"${searchTerm}" দিয়ে কোনো ডাক্তার অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।`
                : 'বর্তমানে কোনো ডাক্তার অ্যাকাউন্ট সংরক্ষিত নেই। ডাক্তাররা রেজিস্ট্রেশন করলে এখানে প্রদর্শিত হবে।'}
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isPending = user.status === 'pending';
              const isApproved = user.status === 'approved';
              const isSuspended = user.status === 'suspended';
              const isRejected = user.status === 'rejected';
              const hasWatermark = user.has_watermark !== false; // default true
              const showQr = user.show_qr !== false; // default true

              const todayStr = new Date().toISOString().split('T')[0];
              const isExpired = user.valid_until && user.valid_until < todayStr;

              return (
                <div
                  key={user.id || user.phone}
                  className={`p-4 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isPending
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                      : isApproved
                        ? 'bg-white border-slate-200 shadow-2xs hover:border-teal-300'
                        : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  
                  {/* Left Column: Doctor Identity Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">
                        {user.full_name || 'Dr. User'}
                      </span>
                      
                      {/* Status Badges */}
                      {isPending && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                          অনুমোদনের অপেক্ষায় (Pending)
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          অনুমোদিত (Approved)
                        </span>
                      )}
                      {isSuspended && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          স্থগিত (Suspended)
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          বাতিল (Rejected)
                        </span>
                      )}
                      {isExpired && isApproved && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                          মেয়াদ উত্তীর্ণ (Expired)
                        </span>
                      )}

                      {/* Watermark Status Pill (Admin Controlled) */}
                      <button
                        type="button"
                        onClick={() => handleToggleWatermark(user)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          hasWatermark
                            ? 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                            : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                        }`}
                        title="ক্লিক করে এই ডাক্তারের ওয়াটারমার্ক অন/অফ করুন"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Watermark: {hasWatermark ? 'Active (ON)' : 'Removed (OFF)'}</span>
                      </button>

                      {/* QR Code Status Pill (Admin Controlled) */}
                      <button
                        type="button"
                        onClick={() => handleToggleQrCode(user)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          showQr
                            ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="ক্লিক করে প্রেসক্রিপশনের হেডার QR কোড অন/অফ করুন"
                      >
                        <QrCode className="w-2.5 h-2.5" />
                        <span>QR Code: {showQr ? 'Active (ON)' : 'Hidden (OFF)'}</span>
                      </button>

                    </div>

                    {/* Metadata & Contact */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span className="font-mono font-bold text-teal-700 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {user.phone}
                      </span>
                      {user.degrees && (
                        <>
                          <span>•</span>
                          <span>{user.degrees}</span>
                        </>
                      )}
                      {user.specialty && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-slate-800">{user.specialty}</span>
                        </>
                      )}
                      {user.bmdc_reg && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                            BMDC: {user.bmdc_reg}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Registration Date & Current Validity */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                      <span>রেজিস্ট্রেশন: <strong>{user.created_at ? user.created_at.split('T')[0] : 'N/A'}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-teal-600" />
                        মেয়াদ (Validity): 
                        <strong className={`font-mono ${isExpired ? 'text-rose-600 font-black' : 'text-emerald-700'}`}>
                          {user.valid_until || 'আনলিমিটেড'}
                        </strong>
                      </span>
                    </div>

                  </div>

                  {/* Right Column: Admin Actions */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    
                    {/* EDIT DOCTOR FULL DETAILS BUTTON */}
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="ডাক্তারের নাম, পদবী, পাসওয়ার্ড, চেম্বার ও সকল তথ্য এডিট করুন"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                      <span>এডিট প্রোফাইল</span>
                    </button>

                    {/* Approval Action for Pending Accounts */}
                    {isPending && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleApprove(user, 30, true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          title="অনুমোদন দিন ও ৩০ দিনের মেয়াদ সেট করুন"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>অনুমোদন (৩০ দিন)</span>
                        </button>

                        <button
                          onClick={() => handleApprove(user, 365, false)}
                          className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          title="১ বছর মেয়াদ ও ওয়াটারমার্ক ছাড়া অনুমোদন"
                        >
                          ১ বছর (No Watermark)
                        </button>

                        <button
                          onClick={() => handleReject(user)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                          title="আবেদন বাতিল করুন"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Suspend Toggle */}
                    {isApproved && (
                      <button
                        onClick={() => handleSuspend(user)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                        title="অ্যাকাউন্ট সাময়িকভাবে সাসপেন্ড / স্থগিত করুন"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}

                    {isSuspended && (
                      <button
                        onClick={() => handleSuspend(user)}
                        className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        পুনরায় সক্রিয় করুন
                      </button>
                    )}

                    {/* Permanent Delete Button */}
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-1"
                      title="এই ডাক্তার অ্যাকাউন্ট সম্পূর্ণ মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Admin Footer Bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            লগইন করা আছে: <strong className="text-slate-800">{adminUser?.full_name || 'System Admin'}</strong> ({adminUser?.phone || '01780960370'})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>

      {/* ===================== SUB-MODAL: EDIT DOCTOR FULL DETAILS ===================== */}
      {editingDoctor && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">
                  ডাক্তার প্রোফাইল ও তথ্যাবলী এডিট করুন (Admin Master Edit)
                </h3>
              </div>
              <button
                onClick={() => setEditingDoctor(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoctorEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ডাক্তারের পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর (Login Phone) *</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-teal-600" />
                    <span>লগইন পাসওয়ার্ড (Change Password)</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.password_hash}
                    onChange={(e) => setEditFormData({ ...editFormData, password_hash: e.target.value })}
                    placeholder="পাসওয়ার্ড লিখুন"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 font-bold text-teal-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">এডমিন চাইলে এখান থেকে সরাসরি ইউজারের পাসওয়ার্ড পরিবর্তন করতে পারবেন।</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">BMDC Reg. No.</label>
                  <input
                    type="text"
                    value={editFormData.bmdc_reg}
                    onChange={(e) => setEditFormData({ ...editFormData, bmdc_reg: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ডিগ্রী ও পদবী (Degrees & Qualifications)</label>
                <input
                  type="text"
                  value={editFormData.degrees}
                  onChange={(e) => setEditFormData({ ...editFormData, degrees: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">বিশেষজ্ঞতা (Specialty)</label>
                  <input
                    type="text"
                    value={editFormData.specialty}
                    onChange={(e) => setEditFormData({ ...editFormData, specialty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">কর্মস্থল / হাসপাতাল (Workplace)</label>
                  <input
                    type="text"
                    value={editFormData.workplace}
                    onChange={(e) => setEditFormData({ ...editFormData, workplace: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">চেম্বারের নাম (Chamber Name)</label>
                  <input
                    type="text"
                    value={editFormData.chamber_name}
                    onChange={(e) => setEditFormData({ ...editFormData, chamber_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">রোগী দেখার সময় (Visiting Hours)</label>
                  <input
                    type="text"
                    value={editFormData.visiting_hours}
                    onChange={(e) => setEditFormData({ ...editFormData, visiting_hours: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Validity Date, Watermark & QR Code Toggle */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">মেয়াদ শেষ হওয়ার তারিখ (Valid Until)</label>
                    <input
                      type="date"
                      value={editFormData.valid_until}
                      onChange={(e) => setEditFormData({ ...editFormData, valid_until: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 block">প্রেসক্রিপশন ওয়াটারমার্ক</span>
                      <span className="text-[10px] text-slate-500">Ayan Tech Software Branding</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFormData.has_watermark}
                        onChange={(e) => setEditFormData({ ...editFormData, has_watermark: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>প্রেসক্রিপশন QR কোড (Prescription QR Code)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">রোগীর স্ক্যান করে প্রেসক্রিপশন ডাউনলোড ও ভেরিফিকেশন QR কোড</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.show_qr}
                      onChange={(e) => setEditFormData({ ...editFormData, show_qr: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>তথ্য সংরক্ষণ করুন</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Admin Change Password Modal */}
      {isAdminPassModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">এডমিন পাসওয়ার্ড পরিবর্তন</h3>
                  <p className="text-[11px] text-slate-400">Master Super Admin Security Key</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminPassModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAdminPasswordSubmit} className="p-6 space-y-4">
              {adminPassError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{adminPassError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বর্তমান এডমিন পাসওয়ার্ড (Current Password) *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={adminPassForm.currentPassword}
                    onChange={(e) => setAdminPassForm({ ...adminPassForm, currentPassword: e.target.value })}
                    placeholder="বর্তমান পাসওয়ার্ড লিখুন (Default: admin)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">প্রথমবার পরিবর্তন করলে ডিফল্ট পাসওয়ার্ড <span className="font-mono font-bold text-slate-600">admin</span> দিন।</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড (New Password) *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={adminPassForm.newPassword}
                    onChange={(e) => setAdminPassForm({ ...adminPassForm, newPassword: e.target.value })}
                    placeholder="কমপক্ষে ৪ অক্ষরের নতুন পাসওয়ার্ড দিন"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কনফার্ম নতুন পাসওয়ার্ড (Confirm New Password) *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={adminPassForm.confirmPassword}
                    onChange={(e) => setAdminPassForm({ ...adminPassForm, confirmPassword: e.target.value })}
                    placeholder="নতুন পাসওয়ার্ডটি পুনরায় লিখুন"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdminPassModalOpen(false)}
                  disabled={adminPassLoading}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={adminPassLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {adminPassLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{adminPassLoading ? 'সংরক্ষণ হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Admin Create New Doctor User Modal */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">নতুন ডাক্তার ইউজার তৈরি</h3>
                  <p className="text-[11px] text-slate-400">এডমিন থেকে সরাসরি অ্যাকাউন্ট তৈরি ও সক্রিয়করণ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUserSubmit} className="p-6 space-y-3.5 text-xs">
              {createUserError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{createUserError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    ডাক্তারের নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={createUserForm.fullName}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, fullName: e.target.value })}
                    placeholder="e.g. Dr. Md. Rafiqul Islam"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর (Login Phone) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={createUserForm.phone}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    লগইন পাসওয়ার্ড (Password) *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                    placeholder="পাসওয়ার্ড লিখুন"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ডিগ্রি (Degrees)
                  </label>
                  <input
                    type="text"
                    value={createUserForm.degrees}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, degrees: e.target.value })}
                    placeholder="MBBS, FCPS"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    বিশেষজ্ঞতা (Specialty)
                  </label>
                  <input
                    type="text"
                    value={createUserForm.specialty}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, specialty: e.target.value })}
                    placeholder="General Physician / Medicine"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    BMDC Reg No
                  </label>
                  <input
                    type="text"
                    value={createUserForm.bmdcReg}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, bmdcReg: e.target.value })}
                    placeholder="A-12345"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ভ্যালিডিটি মেয়াদ (Days)
                  </label>
                  <select
                    value={createUserForm.validityDays}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, validityDays: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  >
                    <option value="7">৭ দিন (ট্রায়াল)</option>
                    <option value="30">৩০ দিন (১ মাস)</option>
                    <option value="90">৯০ দিন (৩ মাস)</option>
                    <option value="180">১৮০ দিন (৬ মাস)</option>
                    <option value="365">৩৬৫ দিন (১ বছর)</option>
                    <option value="1825">৫ বছর</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  disabled={createUserLoading}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createUserLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>{createUserLoading ? 'তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি ও অনুমোদন'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanelModal;
