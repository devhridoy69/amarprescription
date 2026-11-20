import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, ShieldCheck, Users, Clock, CheckCircle2, 
  XCircle, Ban, Trash2, Calendar, Search, RefreshCw, 
  X, Phone, Award, Stethoscope, AlertTriangle, Key, LogOut,
  Sliders, UserCheck, UserX, FileText, ChevronRight, Edit3, Save, Sparkles, Building, Lock, UserPlus, QrCode, Crown, Settings2, Plus
} from 'lucide-react';
import { 
  adminFetchAllUsers, 
  adminUpdateUserStatus, 
  adminUpdateUserFullDetails, 
  adminDeleteUser,
  updateAdminMasterPassword,
  adminCreateUser
} from '../lib/supabase';
import { getPlansConfig, savePlansConfig, getPlanPermissions, normalizePlanId } from '../data/plansConfig';

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

  // Plans & Pricing Config State
  const [plansConfig, setPlansConfig] = useState(getPlansConfig);
  const [isPlanSettingsModalOpen, setIsPlanSettingsModalOpen] = useState(false);
  const [editPlanConfig, setEditPlanConfig] = useState(getPlansConfig);

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

  // Sync active logged-in doctor session if updated by admin
  const syncActiveUserIfMatches = (phone, updates) => {
    try {
      const raw = localStorage.getItem('amar_rx_current_user');
      if (raw) {
        const active = JSON.parse(raw);
        if (active.phone === phone) {
          const updated = { ...active, ...updates };
          localStorage.setItem('amar_rx_current_user', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('amar_rx_user_updated', { detail: updated }));
        }
      }
      const docRaw = localStorage.getItem('amar_rx_doctor');
      if (docRaw) {
        const doc = JSON.parse(docRaw);
        if (doc.phone === phone) {
          const updatedDoc = { ...doc, ...updates };
          localStorage.setItem('amar_rx_doctor', JSON.stringify(updatedDoc));
        }
      }
    } catch (e) {}
  };

  // Approval with days and default watermark option
  const handleApprove = async (user, days = 30, withWatermark = true) => {
    const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await adminUpdateUserStatus(user.id, user.phone, 'approved', validUntil, withWatermark);
    showToast(`ডাক্তার "${user.full_name}"-কে অনুমোদন দেওয়া হয়েছে (${days} দিন, Watermark: ${withWatermark ? 'On' : 'Off'})।`);
    await loadUsers();
  };

  const handleToggleWatermark = async (user) => {
    const currentVal = user.has_watermark !== false; // Default true if not set
    const newVal = !currentVal;
    const updates = { has_watermark: newVal };
    setUsers(prev => prev.map(u => (u.phone === user.phone ? { ...u, ...updates } : u)));
    await adminUpdateUserFullDetails(user.id, user.phone, updates);
    syncActiveUserIfMatches(user.phone, updates);
    showToast(`"${user.full_name}"-এর প্রেসক্রিপশনে Watermark ${newVal ? 'যুক্ত করা হয়েছে' : 'মুছে ফেলা হয়েছে (Clean Paper)'}।`);
    await loadUsers();
  };

  const handleToggleQrCode = async (user) => {
    const currentVal = user.show_qr !== false; // Default true if not set
    const newVal = !currentVal;
    const updates = { show_qr: newVal };
    setUsers(prev => prev.map(u => (u.phone === user.phone ? { ...u, ...updates } : u)));
    await adminUpdateUserFullDetails(user.id, user.phone, updates);
    syncActiveUserIfMatches(user.phone, updates);
    showToast(`"${user.full_name}"-এর প্রেসক্রিপশনে QR Code ${newVal ? 'অন (Active)' : 'বন্ধ (Disabled)'} করা হয়েছে।`);
    await loadUsers();
  };

  const handleUpdateDoctorPlan = async (user, newPlan) => {
    const updates = { plan: newPlan };
    if (newPlan === 'free') {
      updates.has_watermark = true;
      updates.show_qr = false;
    } else {
      const perms = getPlanPermissions(newPlan);
      updates.has_watermark = !perms.canRemoveWatermark;
      updates.show_qr = perms.canUseQrCode;
    }
    setUsers(prev => prev.map(u => (u.phone === user.phone ? { ...u, ...updates } : u)));
    await adminUpdateUserFullDetails(user.id, user.phone, updates);
    syncActiveUserIfMatches(user.phone, updates);
    showToast(`"${user.full_name}"-কে ${newPlan} প্ল্যান সফলভাবে অ্যাসাইন করা হয়েছে।`);
    await loadUsers();
  };

  const handleSavePlanConfig = (e) => {
    e.preventDefault();
    savePlansConfig(editPlanConfig);
    setPlansConfig(editPlanConfig);
    setIsPlanSettingsModalOpen(false);
    showToast('প্যাকেজ ও প্রাইসিং কনফিগ সফলভাবে আপডেট করা হয়েছে!');
    window.dispatchEvent(new Event('amar_rx_plans_updated'));
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
      plan: user.plan || 'free',
      status: user.status || 'approved'
    });
  };

  const handleSaveDoctorEdit = async (e) => {
    e.preventDefault();
    if (!editingDoctor) return;
    await adminUpdateUserFullDetails(editingDoctor.id, editingDoctor.phone, editFormData);
    syncActiveUserIfMatches(editingDoctor.phone, editFormData);
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
      
      {/* Ember-style Dark Sleek Container */}
      <div className="bg-[#111214] text-slate-200 rounded-3xl shadow-2xl border border-white/5 w-full max-w-6xl max-h-[92vh] flex flex-col md:flex-row overflow-hidden font-sans">
        
        {/* ======================= LEFT SIDEBAR (Ember Navigation) ======================= */}
        <div className="w-full md:w-64 bg-[#0d0e10] border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-5">
            {/* Brand Logo & Switcher */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-white to-slate-400 flex items-center justify-center shadow-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
                </div>
                <span className="font-bold text-sm tracking-tight text-white">Amar Admin</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 font-mono border border-white/5">
                v2.0
              </span>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search doctors..."
                className="w-full pl-8 pr-12 py-1.5 bg-[#17181c] border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-white/20 transition-all font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <div className="absolute right-2 top-1.5 flex items-center gap-0.5 text-[9px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase px-2 mb-2">
                Navigation
              </div>
              
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={"w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer " + (statusFilter === 'all' ? 'bg-[#22242a] text-white shadow-xs font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5')}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>All Doctors</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">{totalUsers}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={"w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer " + (statusFilter === 'pending' ? 'bg-[#22242a] text-white shadow-xs font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5')}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Pending</span>
                </div>
                {pendingUsers > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    {pendingUsers}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={"w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer " + (statusFilter === 'approved' ? 'bg-[#22242a] text-white shadow-xs font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5')}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Approved</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">{approvedUsers}</span>
              </button>
            </div>

            {/* Plans Breakdown Section (Like Ember Plans list) */}
            <div className="pt-3 border-t border-white/5 space-y-1">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
                  Plans
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditPlanConfig(getPlansConfig());
                    setIsPlanSettingsModalOpen(true);
                  }}
                  className="text-[10px] text-teal-400 hover:underline cursor-pointer"
                >
                  Manage
                </button>
              </div>

              {(() => {
                const plans = plansConfig?.plans || [
                  { id: 'enterprise', name: 'Enterprise VIP' },
                  { id: 'standard', name: 'Standard Pro' },
                  { id: 'free', name: 'Free Plan' }
                ];

                const colorDots = {
                  enterprise: 'bg-amber-400',
                  standard: 'bg-teal-400',
                  free: 'bg-purple-400'
                };

                return plans.map((p) => {
                  const count = users.filter(u => normalizePlanId(u.plan) === p.id).length;
                  return (
                    <div 
                      key={p.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={"w-2 h-2 rounded-full " + (colorDots[p.id] || 'bg-slate-500')}></span>
                        <span className="truncate">{p.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{count}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Bottom Admin User Pill */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between px-2 text-xs">
              <div className="min-w-0">
                <p className="font-semibold text-white truncate text-xs">{adminUser?.full_name || 'System Admin'}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{adminUser?.phone || 'admin'}</p>
              </div>
              <button
                type="button"
                onClick={onAdminLogout}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ======================= RIGHT MAIN CONTENT ======================= */}
        <div className="flex-1 flex flex-col bg-[#111214] min-w-0 overflow-hidden">
          
          {/* Top Bar Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between gap-3 bg-[#111214]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Master Terminal</span>
                <span className="text-slate-600">/</span>
                <span className="text-xs font-bold text-white">Doctor Accounts</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                Overview <span className="text-slate-500 font-normal text-lg">2026</span>
              </h1>
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-black rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Doctor</span>
              </button>

              <button
                onClick={() => {
                  setAdminPassError('');
                  setAdminPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setIsAdminPassModalOpen(true);
                }}
                className="p-2 bg-[#1b1c21] hover:bg-[#24252c] text-slate-300 border border-white/5 rounded-xl transition-all cursor-pointer"
                title="Admin Security Key"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={loadUsers}
                className="p-2 bg-[#1b1c21] hover:bg-[#24252c] text-slate-300 border border-white/5 rounded-xl transition-all cursor-pointer"
                title="Refresh data"
              >
                <RefreshCw className={"w-3.5 h-3.5 " + (loading ? 'animate-spin' : '')} />
              </button>

              <button
                onClick={onClose}
                className="p-2 bg-[#1b1c21] hover:bg-[#24252c] text-slate-400 hover:text-white border border-white/5 rounded-xl transition-all cursor-pointer ml-1"
                title="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ember-style Top Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 border-b border-white/5">
            
            {/* Card 1: Total Doctors with Card Graphics */}
            <div className="bg-[#17181c] p-4 rounded-2xl border border-white/5 flex items-center justify-between relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">Registered Doctors</span>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">
                  {totalUsers}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span>+100%</span>
                  <span className="text-slate-500 font-normal">cloud synchronized</span>
                </div>
              </div>
              
              {/* Subtle credit card visual graphic like Ember */}
              <div className="w-16 h-11 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 shadow-lg p-1.5 flex flex-col justify-between shrink-0 opacity-80">
                <div className="w-2.5 h-2 rounded bg-amber-400/80"></div>
                <div className="font-mono text-[7px] text-slate-400">•••• 2026</div>
              </div>
            </div>

            {/* Card 2: Active & Approved */}
            <div className="bg-[#17181c] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">Active Approved</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                  {approvedUsers}
                </div>
                <div className="text-[11px] text-slate-500">
                  Practicing on platform
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Pending Approval */}
            <div className="bg-[#17181c] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">Pending Review</span>
                <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
                  {pendingUsers}
                </div>
                <div className="text-[11px] text-slate-500">
                  Awaiting license verification
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Toast Notification */}
          {notification && (
            <div className={"mx-5 mt-3 p-2.5 rounded-xl text-xs font-medium flex items-center justify-between " + (notification.type === 'warning' ? 'bg-amber-950/40 text-amber-300 border border-amber-800/60' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60')}>
              <span>{notification.msg}</span>
              <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* Doctor Accounts Ledger List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
            {filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-white/5 rounded-2xl">
                {searchTerm 
                  ? ('No doctors found matching "' + searchTerm + '".')
                  : 'No doctor records currently found.'}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isPending = user.status === 'pending';
                const isApproved = user.status === 'approved';
                const isSuspended = user.status === 'suspended';
                const isRejected = user.status === 'rejected';
                const hasWatermark = user.has_watermark !== false;
                const showQr = user.show_qr !== false;

                const todayStr = new Date().toISOString().split('T')[0];
                const isExpired = user.valid_until && user.valid_until < todayStr;

                return (
                  <div
                    key={user.id || user.phone}
                    className={"p-3.5 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs " + (isPending ? 'bg-[#1a1714] border-amber-500/30' : isApproved ? 'bg-[#17181c] border-white/5 hover:border-white/10' : 'bg-[#141518] border-white/5 opacity-60')}
                  >
                    
                    {/* Left: Doctor Details */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">
                          {user.full_name || 'Dr. User'}
                        </span>
                        
                        {/* Status Badges */}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                            Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Approved
                          </span>
                        )}
                        {isSuspended && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-400/10 text-rose-300 border border-rose-400/20">
                            Suspended
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 text-slate-400 border border-white/5">
                            Rejected
                          </span>
                        )}
                        {isExpired && isApproved && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white">
                            Expired
                          </span>
                        )}

                        {/* Watermark Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleWatermark(user)}
                          className={"px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer flex items-center gap-1 " + (hasWatermark ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10' : 'bg-teal-500/10 text-teal-300 border-teal-500/20 hover:bg-teal-500/20')}
                          title="Toggle watermark print visibility"
                        >
                          <span>Watermark: {hasWatermark ? 'On' : 'Off (Clean)'}</span>
                        </button>

                        {/* QR Code Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleQrCode(user)}
                          className={"px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer flex items-center gap-1 " + (showQr ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10' : 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20')}
                          title="Toggle QR code visibility"
                        >
                          <QrCode className="w-2.5 h-2.5 text-slate-400" />
                          <span>QR: {showQr ? 'Active' : 'Off'}</span>
                        </button>

                        {/* Plan Selector Dropdown */}
                        <div className="flex items-center gap-1 bg-[#1e2026] px-2 py-0.5 rounded-md border border-white/10">
                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                          <select
                            value={normalizePlanId(user.plan)}
                            onChange={(e) => handleUpdateDoctorPlan(user, e.target.value)}
                            className="bg-transparent text-[10px] font-semibold text-slate-200 border-none outline-hidden cursor-pointer"
                          >
                            <option value="free" className="bg-[#17181c] text-white">Free Plan</option>
                            {(plansConfig.plans || []).map((p) => (
                              <option key={p.id} value={p.id} className="bg-[#17181c] text-white">
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Doctor Credential Info */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400">
                        <span className="font-mono text-white flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {user.phone}
                        </span>
                        {user.degrees && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span>{user.degrees}</span>
                          </>
                        )}
                        {user.specialty && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-300">{user.specialty}</span>
                          </>
                        )}
                        {user.bmdc_reg && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="font-mono text-[11px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-slate-300">
                              BMDC: {user.bmdc_reg}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                        <span>Reg: <strong className="font-mono font-normal text-slate-400">{user.created_at ? user.created_at.split('T')[0] : '—'}</strong></span>
                        <span className="text-slate-700">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Valid: 
                          <strong className={"font-mono " + (isExpired ? 'text-rose-400 font-semibold' : 'text-slate-300')}>
                            {user.valid_until || 'Unlimited'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="px-2.5 py-1.5 bg-[#22242a] hover:bg-[#2c2e36] text-slate-200 border border-white/5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Edit Doctor Details"
                      >
                        <Edit3 className="w-3 h-3 text-slate-400" />
                        <span>Edit</span>
                      </button>

                      {isPending && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApprove(user, 30, true)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve (30d)</span>
                          </button>

                          <button
                            onClick={() => handleApprove(user, 365, false)}
                            className="px-2.5 py-1.5 bg-[#22242a] hover:bg-[#2c2e36] text-slate-200 border border-white/5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                          >
                            1 Year (Clean)
                          </button>

                          <button
                            onClick={() => handleReject(user)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Reject"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <button
                          onClick={() => handleSuspend(user)}
                          className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          title="Suspend"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isSuspended && (
                        <button
                          onClick={() => handleSuspend(user)}
                          className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 rounded-lg text-xs font-medium transition-all cursor-pointer"
                        >
                          Reactivate
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(user)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer ml-1"
                        title="Delete Doctor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-2.5 bg-[#0d0e10] border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>
              Doctor Verification Engine • Encrypted
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-[#1c1d22] hover:bg-[#25262c] text-slate-300 border border-white/5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              Close
            </button>
          </div>

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

              <div>
                <label className="block font-bold text-slate-700 mb-1">সাবস্ক্রিপশন প্ল্যান (Subscription Plan)</label>
                <select
                  value={normalizePlanId(editFormData.plan)}
                  onChange={(e) => {
                    const newPlan = e.target.value;
                    const updates = { plan: newPlan };
                    if (newPlan === 'free') {
                      updates.has_watermark = true;
                      updates.show_qr = false;
                    } else {
                      const perms = getPlanPermissions(newPlan);
                      updates.has_watermark = !perms.canRemoveWatermark;
                      updates.show_qr = perms.canUseQrCode;
                    }
                    setEditFormData({ ...editFormData, ...updates });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-teal-900"
                >
                  <option value="free">Free Plan</option>
                  {(plansConfig.plans || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.badgeText || p.tagline || p.period})
                    </option>
                  ))}
                </select>
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

      {/* Dynamic Plans & Pricing Settings Modal */}
      {isPlanSettingsModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                  <Crown className="w-4 h-4 fill-slate-950" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">প্যাকেজ, প্রেসক্রিপশন লিমিট ও প্রাইসিং কনফিগারেশন</h3>
                  <p className="text-[11px] text-teal-300">এডমিন প্যানেল থেকে প্যাকেজ লিমিট (৫০০ থেকে ১০০০), ফিচার ও মূল্য নিয়ন্ত্রণ করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanConfig} className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Free Plan Policy & Limit Editor */}
              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-800 text-white rounded-md text-[10px] font-black uppercase">
                      ডিফল্ট মোড
                    </span>
                    <span className="font-black text-sm text-slate-900">Free Plan (ফ্রি মোড পলিসি ও লিমিট)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">
                    নতুন রেজিস্টার করা সকল ডাক্তার এই পলিসিতে থাকবেন
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      ফ্রি প্রেসক্রিপশন লিমিট (Rx Limit)
                    </label>
                    <input
                      type="number"
                      value={editPlanConfig.freePlan?.prescriptionLimit ?? 100}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 100;
                        setEditPlanConfig({
                          ...editPlanConfig,
                          freePlan: { ...(editPlanConfig.freePlan || {}), prescriptionLimit: val }
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-teal-900"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      প্রতি মাসে সর্বোচ্চ সেভ ও প্রিন্ট সীমা
                    </span>
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-700">Watermark:</span>
                    <span className="text-[11px] text-teal-800 font-bold">অন (ব্র্যান্ডিংযুক্ত)</span>
                    <span className="text-[10px] text-slate-500">এডমিন চাইলে টগল করতে পারেন</span>
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-700">Smart QR Code:</span>
                    <span className="text-[11px] text-rose-700 font-bold">লকড (🔒 বন্ধ)</span>
                    <span className="text-[10px] text-slate-500">স্ক্রিনে লকড ব্যাজ দেখাবে</span>
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-700">Multiple Chamber:</span>
                    <span className="text-[11px] text-rose-700 font-bold">লকড (🔒 বন্ধ)</span>
                    <span className="text-[10px] text-slate-500">সিঙ্গেল চেম্বার সক্রিয়</span>
                  </div>
                </div>
              </div>

              {/* Header: Dynamic Plans List */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 text-sm block">প্যাকেজ তালিকা ({editPlanConfig.plans?.length || 0} টি প্যাক)</span>
                  <span className="text-[10px] text-slate-500">এডমিন প্যানেল থেকে যেকোনো নতুন প্ল্যান তৈরি করুন অথবা এডিট / ডিলিট করুন</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = 'plan_' + Date.now();
                    const newPlan = {
                      id: newId,
                      name: 'নতুন প্যাকেজ',
                      tagline: 'প্যাকেজের সংক্ষিপ্ত বিবরণ',
                      badgeText: 'প্যাকেজ হাইলাইট টেক্সট',
                      price: '৭৯৯',
                      period: 'মাসিক',
                      badge: 'Pro',
                      popular: false,
                      color: 'teal',
                      features: [
                        'Watermark Remove (ক্লিন প্যাড প্রিন্টিং)',
                        '১০০০টি প্রেসক্রিপশন সেভ ও প্রিন্ট',
                        'Daily Cloud Backup'
                      ],
                      permissions: {
                        removeWatermark: true,
                        qrCode: false,
                        multipleChambers: false,
                        prescriptionLimit: 1000
                      }
                    };
                    setEditPlanConfig({
                      ...editPlanConfig,
                      plans: [...(editPlanConfig.plans || []), newPlan]
                    });
                  }}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ নতুন প্ল্যান যোগ করুন</span>
                </button>
              </div>

              {/* Dynamic Plans List Editor */}
              <div className="space-y-4">
                {(editPlanConfig.plans || []).map((p, pIdx) => (
                  <div 
                    key={p.id || pIdx}
                    className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                          {pIdx + 1}
                        </span>
                        <span className="font-black text-sm text-slate-900">{p.name || 'প্যাকেজ'}</span>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-amber-700 cursor-pointer ml-2">
                          <input
                            type="checkbox"
                            checked={Boolean(p.popular)}
                            onChange={(e) => {
                              const updated = [...editPlanConfig.plans];
                              updated[pIdx] = { ...updated[pIdx], popular: e.target.checked };
                              setEditPlanConfig({ ...editPlanConfig, plans: updated });
                            }}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span>Most Popular Badge</span>
                        </label>
                      </div>

                      {editPlanConfig.plans.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`আপনি কি "${p.name}" প্যাকেজটি ডিলিট করতে চান?`)) {
                              const updated = editPlanConfig.plans.filter((_, idx) => idx !== pIdx);
                              setEditPlanConfig({ ...editPlanConfig, plans: updated });
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>মুছে ফেলুন</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">প্যাকেজের নাম</label>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => {
                            const updated = [...editPlanConfig.plans];
                            updated[pIdx] = { ...updated[pIdx], name: e.target.value };
                            setEditPlanConfig({ ...editPlanConfig, plans: updated });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">মূল্য (Price in BDT)</label>
                        <input
                          type="text"
                          value={p.price}
                          onChange={(e) => {
                            const updated = [...editPlanConfig.plans];
                            updated[pIdx] = { ...updated[pIdx], price: e.target.value };
                            setEditPlanConfig({ ...editPlanConfig, plans: updated });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">বিলিং মেয়াদ (Period)</label>
                        <input
                          type="text"
                          value={p.period}
                          onChange={(e) => {
                            const updated = [...editPlanConfig.plans];
                            updated[pIdx] = { ...updated[pIdx], period: e.target.value };
                            setEditPlanConfig({ ...editPlanConfig, plans: updated });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">ব্যাজ নাম (যেমন: Pro, VIP)</label>
                        <input
                          type="text"
                          value={p.badge || ''}
                          onChange={(e) => {
                            const updated = [...editPlanConfig.plans];
                            updated[pIdx] = { ...updated[pIdx], badge: e.target.value };
                            setEditPlanConfig({ ...editPlanConfig, plans: updated });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">ট্যাগলাইন (সংক্ষিপ্ত বর্ণনা)</label>
                        <input
                          type="text"
                          value={p.tagline || ''}
                          onChange={(e) => {
                            const updated = [...editPlanConfig.plans];
                            updated[pIdx] = { ...updated[pIdx], tagline: e.target.value };
                            setEditPlanConfig({ ...editPlanConfig, plans: updated });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          হাইলাইট পিল টেক্সট (যেমন: Watermark Remove + 30 Days Cloud Backup)
                        </label>
                        <input
                          type="text"
                          value={p.badgeText || ''}
                          onChange={(e) => {
                            const updated = [...editPlanConfig.plans];
                            updated[pIdx] = { ...updated[pIdx], badgeText: e.target.value };
                            setEditPlanConfig({ ...editPlanConfig, plans: updated });
                          }}
                          placeholder="e.g. Watermark Remove + 30 Days Cloud Backup"
                          className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl font-semibold text-teal-900"
                        />
                      </div>
                    </div>

                    {/* Permissions & Dynamic Limits Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          প্রেসক্রিপশন লিমিট (Rx Limit)
                        </label>
                        <input
                          type="text"
                          value={p.permissions?.prescriptionLimit === Infinity ? '' : (p.permissions?.prescriptionLimit ?? '')}
                          placeholder="খালি রাখলে আনলিমিটেড (∞)"
                          onChange={(e) => {
                            const valStr = e.target.value.trim();
                            const val = valStr === '' ? Infinity : Number(valStr);
                            const updated = [...editPlanConfig.plans];
                            const currPerms = updated[pIdx].permissions || {};
                            updated[pIdx] = { 
                              ...updated[pIdx], 
                              permissions: { ...currPerms, prescriptionLimit: val } 
                            };
                            setEditPlanConfig({ ...editPlanConfig, plans: updated });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-teal-900"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          {p.permissions?.prescriptionLimit === Infinity || !p.permissions?.prescriptionLimit ? 'আনলিমিটেড (∞)' : `${p.permissions.prescriptionLimit} টি`}
                        </span>
                      </div>

                      <div className="flex flex-col justify-center">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                          <input
                            type="checkbox"
                            checked={p.permissions?.removeWatermark !== false}
                            onChange={(e) => {
                              const updated = [...editPlanConfig.plans];
                              const currPerms = updated[pIdx].permissions || {};
                              updated[pIdx] = {
                                ...updated[pIdx],
                                permissions: { ...currPerms, removeWatermark: e.target.checked }
                              };
                              setEditPlanConfig({ ...editPlanConfig, plans: updated });
                            }}
                            className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                          />
                          <span>Clean Pad (Watermark Remove)</span>
                        </label>
                        <span className="text-[10px] text-slate-500 pl-6">ক্লিন প্যাড প্রিন্টিং</span>
                      </div>

                      <div className="flex flex-col justify-center">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                          <input
                            type="checkbox"
                            checked={Boolean(p.permissions?.qrCode)}
                            onChange={(e) => {
                              const updated = [...editPlanConfig.plans];
                              const currPerms = updated[pIdx].permissions || {};
                              updated[pIdx] = {
                                ...updated[pIdx],
                                permissions: { ...currPerms, qrCode: e.target.checked }
                              };
                              setEditPlanConfig({ ...editPlanConfig, plans: updated });
                            }}
                            className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                          />
                          <span>Smart QR Code</span>
                        </label>
                        <span className="text-[10px] text-slate-500 pl-6">অনলাইনে রোগী ভেরিফিকেশন</span>
                      </div>

                      <div className="flex flex-col justify-center">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                          <input
                            type="checkbox"
                            checked={Boolean(p.permissions?.multipleChambers)}
                            onChange={(e) => {
                              const updated = [...editPlanConfig.plans];
                              const currPerms = updated[pIdx].permissions || {};
                              updated[pIdx] = {
                                ...updated[pIdx],
                                permissions: { ...currPerms, multipleChambers: e.target.checked }
                              };
                              setEditPlanConfig({ ...editPlanConfig, plans: updated });
                            }}
                            className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                          />
                          <span>Multiple Chambers</span>
                        </label>
                        <span className="text-[10px] text-slate-500 pl-6">একাধিক চেম্বার সুইচিং</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        ফিচারসমূহ (প্রতি লাইনে একটি করে ফিচার লিখুন)
                      </label>
                      <textarea
                        rows={4}
                        value={(p.features || []).join('\n')}
                        onChange={(e) => {
                          const updated = [...editPlanConfig.plans];
                          updated[pIdx] = { 
                            ...updated[pIdx], 
                            features: e.target.value.split('\n').filter(Boolean) 
                          };
                          setEditPlanConfig({ ...editPlanConfig, plans: updated });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment & Contact Info */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp Support Number</label>
                  <input
                    type="text"
                    value={editPlanConfig.contact.whatsapp}
                    onChange={(e) => setEditPlanConfig({
                      ...editPlanConfig,
                      contact: { ...editPlanConfig.contact, whatsapp: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">bKash / Nagad Number Info</label>
                  <input
                    type="text"
                    value={editPlanConfig.contact.bkash}
                    onChange={(e) => setEditPlanConfig({
                      ...editPlanConfig,
                      contact: { ...editPlanConfig.contact, bkash: e.target.value, nagad: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPlanSettingsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>প্যাকেজ সেটিংস সেভ করুন</span>
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
