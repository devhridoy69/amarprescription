import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, History, CalendarCheck, Search, Eye, 
  Printer, Trash2, ArrowUpRight, User, Clock, CheckCircle2, 
  AlertCircle, FileText, ChevronRight, X, Phone, Plus, Filter,
  TrendingUp, Activity, Check, RefreshCw, Calendar, RotateCcw, Edit3, Crown, Sparkles, Building
} from 'lucide-react';
import { getPlanPermissions } from '../data/plansConfig';

export const DashboardModal = ({ 
  isOpen, 
  onClose, 
  records = [], 
  onLoadPrescription, 
  onReprintPrescription,
  onDeleteRecord,
  onToggleFollowUpStatus,
  onNewPrescription,
  darkMode = false,
  activeEditingRecordId = null,
  currentUser = null,
  onOpenPricing = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history' | 'followups'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed' | 'today'

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Date selection state: default is todayStr
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [filterByDate, setFilterByDate] = useState(true); // true = filter by selectedDate, false = all dates

  // Follow-ups logic
  const followUpRecords = useMemo(() => {
    return records.filter(r => {
      return Boolean(r.nextVisit || r.followUpDate);
    }).map(r => {
      const dueDate = r.followUpDate || r.patient?.date || r.date;
      return {
        ...r,
        isCompleted: Boolean(r.isFollowUpDone),
        isToday: dueDate === todayStr
      };
    });
  }, [records, todayStr]);

  // Filtered Patient History based on Search + Date Filter
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const recDate = rec.date || rec.patient?.date;
      if (filterByDate && selectedDate && recDate !== selectedDate) {
        return false;
      }

      const pName = (rec.patient?.name || '').toLowerCase();
      const pPhone = (rec.patient?.phone || '').toLowerCase();
      const rxId = (rec.patient?.rxId || rec.rxId || '').toLowerCase();
      const diag = (rec.diagnosis || '').toLowerCase();
      const query = searchTerm.toLowerCase();

      return pName.includes(query) || pPhone.includes(query) || rxId.includes(query) || diag.includes(query);
    });
  }, [records, searchTerm, filterByDate, selectedDate]);

  // Filtered Follow-up List
  const filteredFollowUps = useMemo(() => {
    return followUpRecords.filter(item => {
      const matchSearch = 
        (item.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.patient?.rxId || item.rxId || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'pending') return !item.isCompleted;
      if (statusFilter === 'completed') return item.isCompleted;
      if (statusFilter === 'today') return item.isToday && !item.isCompleted;
      return true;
    });
  }, [followUpRecords, searchTerm, statusFilter]);

  // Early return AFTER all hooks have run
  if (!isOpen) return null;

  // Calculated Stats
  const totalPatients = records.length;
  const todayPatients = records.filter(r => (r.date === todayStr || r.patient?.date === todayStr)).length;
  const selectedDatePatients = records.filter(r => (r.date === selectedDate || r.patient?.date === selectedDate)).length;
  const pendingFollowUps = followUpRecords.filter(f => !f.isCompleted).length;
  const todayFollowUps = followUpRecords.filter(f => f.isToday && !f.isCompleted).length;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#111214] text-slate-200 rounded-2xl shadow-2xl border border-white/10 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header - Ember / Admin style */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#17181c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shadow-xs">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Chamber Dashboard & Patient Records
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 font-mono border border-white/5">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Patient History, Reprint & Follow-up Tracking Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewPrescription();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-black rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Prescription</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-[#1b1c21] hover:bg-[#24252c] text-slate-400 hover:text-white border border-white/5 rounded-xl transition-all cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Clean Underline / Active Pills */}
        <div className="px-5 pt-2 border-b border-white/5 flex items-center gap-1 bg-[#141518] overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-t-lg'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview & Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-t-lg'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Patient Records & Reprint ({filterByDate ? selectedDatePatients : totalPatients})</span>
          </button>

          <button
            onClick={() => setActiveTab('followups')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'followups'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-t-lg'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Follow-up Checklist ({pendingFollowUps})</span>
            {todayFollowUps > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold font-mono">
                Today {todayFollowUps}
              </span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* ===================== TAB 1: OVERVIEW ===================== */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              
              {/* Subscription Plan & Usage Limit Status Banner */}
              {(() => {
                const perms = getPlanPermissions(currentUser?.plan);
                const isEnterprise = perms.canSwitchChambers && perms.canUseQrCode;
                const limit = perms.prescriptionLimit;
                const percentage = limit === Infinity ? 100 : Math.min(100, Math.round((totalPatients / limit) * 100));

                return (
                  <div className="p-4 rounded-2xl bg-[#17181c] border border-white/5 text-white shadow-xs relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                            isEnterprise 
                              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                              : perms.id !== 'free'
                                ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' 
                                : 'bg-slate-700/40 text-slate-300 border border-white/5'
                          }`}>
                            <Crown className="w-3.5 h-3.5" />
                            {perms.name}
                          </span>
                          <span className="text-[11px] text-teal-300 font-medium">
                            {limit === Infinity 
                              ? 'Unlimited Lifetime Access' 
                              : `Clean Pad & ${limit} Rx Limit`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {isEnterprise 
                            ? 'Smart QR Code, watermark-free pad, and multiple chamber switching active on your account.' 
                            : perms.id !== 'free'
                              ? `Branding-free clean pad and ${limit} prescriptions save & print active.` 
                              : `Free plan includes default watermark and ${limit} prescriptions per month.`}
                        </p>
                      </div>

                      {/* Right: Usage Meter & Upgrade CTA */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                            Prescription Usage Limit
                          </span>
                          <span className="text-base font-bold font-mono text-teal-300">
                            {isEnterprise ? `${totalPatients} / ∞ (Unlimited)` : `${totalPatients} / ${limit}`}
                          </span>
                        </div>

                        {!isEnterprise && (
                          <button
                            type="button"
                            onClick={onOpenPricing}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Upgrade</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Non-Enterprise */}
                    {!isEnterprise && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                          <span>Usage: {percentage}%</span>
                          <span>Remaining: {Math.max(0, limit - totalPatients)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#111214] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentage >= 90 ? 'bg-rose-500' : percentage >= 70 ? 'bg-amber-400' : 'bg-teal-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Ember-style Stat Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Total Patients */}
                <div className="bg-[#17181c] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-medium">Total Patients</span>
                    <div className="text-2xl font-bold font-mono text-white tracking-tight">
                      {totalPatients}
                    </div>
                    <div className="text-[11px] text-teal-400 font-medium">Saved in History</div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                </div>

                {/* Today's Patients */}
                <div className="bg-[#17181c] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-medium">Today's Patients</span>
                    <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                      {todayPatients}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{todayStr}</div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>

                {/* Pending Follow-ups */}
                <div className="bg-[#17181c] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-medium">Pending Follow-ups</span>
                    <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
                      {pendingFollowUps}
                    </div>
                    <div className="text-[11px] text-slate-500">Awaiting next visit</div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                </div>

                {/* Today's Follow-ups */}
                <div className="bg-[#17181c] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-medium">Today's Follow-ups</span>
                    <div className="text-2xl font-bold font-mono text-sky-400 tracking-tight">
                      {todayFollowUps}
                    </div>
                    <div className="text-[11px] text-slate-500">Scheduled for today</div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* Quick Search in Overview */}
              <div className="bg-[#17181c] p-2.5 rounded-2xl border border-white/5">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (e.target.value.trim() && activeTab !== 'history') {
                        setFilterByDate(false);
                      }
                    }}
                    placeholder="Search by patient name, phone, Rx ID, or diagnosis..."
                    className="w-full pl-9 pr-24 py-2 bg-[#111214] border border-white/10 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:border-white/20 transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  {searchTerm ? (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="absolute right-3 top-2 text-[10px] text-teal-400 font-semibold bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                      Quick Search
                    </span>
                  )}
                </div>
              </div>

              {/* Recent 5 Patients Quick List */}
              <div className="bg-[#17181c] rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Recent Prescribed Patients</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-semibold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {records.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-white/5 rounded-xl">
                    No prescriptions saved yet. Prescriptions printed or saved will appear here.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {records.slice(0, 5).map((rec, idx) => (
                      <div 
                        key={rec.id || idx}
                        className="bg-[#111214] p-3 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-2 hover:border-white/15 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                            {rec.patient?.rxId || rec.rxId || 'RX-0000'}
                          </span>
                          <div>
                            <span className="font-bold text-white block">
                              {rec.patient?.name || 'Unnamed Patient'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {rec.patient?.age ? `${rec.patient.age} ${rec.patient.ageUnit || 'Y'}` : ''} • {rec.patient?.gender || 'Male'}
                              {rec.patient?.phone && (
                                <span className="font-mono text-teal-300"> • {rec.patient.phone}</span>
                              )}
                              <span> • {rec.diagnosis || 'Diagnosis N/A'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 font-mono">
                            {rec.date || rec.patient?.date}
                          </span>
                          <button
                            onClick={() => {
                              onLoadPrescription(rec);
                              onClose();
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              activeEditingRecordId === rec.id
                                ? 'bg-teal-600 text-white shadow-xs font-semibold'
                                : 'bg-[#22242a] hover:bg-[#2c2e36] text-slate-200 border border-white/5'
                            }`}
                            title="Open and edit this prescription"
                          >
                            <Edit3 className="w-3 h-3 text-slate-400" />
                            <span>{activeEditingRecordId === rec.id ? 'Editing Now' : 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => onReprintPrescription(rec)}
                            className="p-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs transition-all cursor-pointer shadow-xs"
                            title="Instant 1-Click Reprint"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ===================== TAB 2: PATIENTS HISTORY & REPRINT ===================== */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              
              {/* Date Filter & Search Row */}
              <div className="bg-[#17181c] p-3 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by patient name, phone, Rx ID, or diagnosis..."
                    className="w-full pl-9 pr-8 py-2 bg-[#111214] border border-white/10 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:border-white/20 transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Date Picker Selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-[#111214] border border-white/10 px-2.5 py-1.5 rounded-xl text-xs">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span className="font-semibold text-slate-400 text-[11px]">Date:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setFilterByDate(true);
                      }}
                      className="bg-transparent border-none text-xs font-bold text-white focus:outline-hidden cursor-pointer"
                    />
                  </div>

                  {/* Filter Toggle Buttons */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setFilterByDate(true);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      filterByDate && selectedDate === todayStr
                        ? 'bg-teal-600 text-white border-teal-500 shadow-xs'
                        : 'bg-[#1b1c21] hover:bg-[#24252c] text-slate-300 border-white/5'
                    }`}
                  >
                    Today ({todayPatients})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterByDate(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      !filterByDate
                        ? 'bg-[#22242a] text-white border-white/20 shadow-xs font-bold'
                        : 'bg-[#1b1c21] hover:bg-[#24252c] text-slate-300 border-white/5'
                    }`}
                  >
                    All Records ({totalPatients})
                  </button>
                </div>

              </div>

              {/* History Table / Cards */}
              {filteredRecords.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-white/5 rounded-2xl">
                  {filterByDate 
                    ? `No prescriptions found for ${selectedDate}. Click "All Records" to view full history.`
                    : 'No prescription history found.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                    <span>
                      {filterByDate ? `List for ${selectedDate}` : 'Total Saved Records'} : <strong className="text-white">{filteredRecords.length} patients found</strong>
                    </span>
                  </div>

                  {filteredRecords.map((rec, idx) => (
                    <div 
                      key={rec.id || idx}
                      className="bg-[#17181c] p-3.5 rounded-xl border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                            {rec.patient?.rxId || rec.rxId}
                          </span>
                          <span className="font-bold text-sm text-white">
                            {rec.patient?.name || 'Unnamed Patient'}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({rec.patient?.age ? `${rec.patient.age} ${rec.patient.ageUnit || 'Y'}` : '—'}, {rec.patient?.gender})
                          </span>
                          {rec.patient?.phone && (
                            <span className="text-xs font-mono text-teal-300 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {rec.patient.phone}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          {rec.diagnosis && (
                            <span>
                              Diagnosis: <strong className="text-slate-200">{rec.diagnosis}</strong>
                            </span>
                          )}
                          <span>•</span>
                          <span>Date: <strong className="text-slate-300 font-mono">{rec.date || rec.patient?.date}</strong></span>
                          {rec.medicines?.length > 0 && (
                            <>
                              <span>•</span>
                              <span>Medicines: <strong className="text-slate-300">{rec.medicines.length} items</strong></span>
                            </>
                          )}
                          {rec.nextVisit && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400">Follow-up: {rec.nextVisit}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Edit, Reprint, Delete */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => {
                            onLoadPrescription(rec);
                            onClose();
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            activeEditingRecordId === rec.id
                              ? 'bg-teal-600 text-white shadow-xs font-semibold'
                              : 'bg-[#22242a] hover:bg-[#2c2e36] text-slate-200 border border-white/5'
                          }`}
                          title="Open and edit this prescription"
                        >
                          <Edit3 className="w-3 h-3 text-slate-400" />
                          <span>{activeEditingRecordId === rec.id ? 'Editing Now' : 'Edit'}</span>
                        </button>

                        <button
                          onClick={() => onReprintPrescription(rec)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                          title="Reprint prescription"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reprint</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the prescription for "${rec.patient?.name || rec.patient?.rxId || 'this patient'}"?`)) {
                              onDeleteRecord(rec.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete from database and history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ===================== TAB 3: PATIENT FOLLOW-UP CHECKLIST ===================== */}
          {activeTab === 'followups' && (
            <div className="space-y-4">
              
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-[#17181c] border border-white/5 p-1 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-[#22242a] text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Follow-ups ({followUpRecords.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'pending'
                        ? 'bg-[#22242a] text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Pending ({pendingFollowUps})
                  </button>
                  <button
                    onClick={() => setStatusFilter('today')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'today'
                        ? 'bg-[#22242a] text-rose-300 shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Today's Visit ({todayFollowUps})
                  </button>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'completed'
                        ? 'bg-[#22242a] text-emerald-300 shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Completed ({followUpRecords.length - pendingFollowUps})
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 font-medium">
                  Check box when follow-up is completed
                </div>
              </div>

              {/* Follow-up Checklist Items */}
              {filteredFollowUps.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-white/5 rounded-2xl">
                  No follow-up records found.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFollowUps.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 text-xs ${
                        item.isCompleted 
                          ? 'bg-[#141518] border-white/5 opacity-60' 
                          : item.isToday 
                            ? 'bg-[#1a1714] border-amber-500/30'
                            : 'bg-[#17181c] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox to mark complete */}
                        <button
                          type="button"
                          onClick={() => onToggleFollowUpStatus(item.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                            item.isCompleted
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-white/10 hover:border-teal-400 bg-[#111214]'
                          }`}
                          title={item.isCompleted ? 'Unmark completed' : 'Mark as completed'}
                        >
                          {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-xs ${item.isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                              {item.patient?.name || 'Unnamed Patient'}
                            </span>
                            <span className="font-mono text-[10px] text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                              {item.patient?.rxId || item.rxId}
                            </span>
                            {item.isToday && !item.isCompleted && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Due Today
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Diagnosis: <strong className="text-slate-200">{item.diagnosis || 'N/A'}</strong> • 
                            Follow-up Due: <strong className="text-teal-300">{item.nextVisit || 'Not specified'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onLoadPrescription(item);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#22242a] hover:bg-[#2c2e36] text-slate-200 border border-white/5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          title="Open and edit prescription"
                        >
                          <Edit3 className="w-3 h-3 text-slate-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => onReprintPrescription(item)}
                          className="p-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                          title="Reprint"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the prescription for "${item.patient?.name || item.patient?.rxId || 'this patient'}"?`)) {
                              onDeleteRecord(item.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer - Dark Charcoal / Bordered */}
        <div className="px-6 py-2.5 bg-[#0d0e10] border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
          <span>Amar Prescription Suite • All data securely saved</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 bg-[#1c1d22] hover:bg-[#25262c] text-slate-300 border border-white/5 rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default DashboardModal;
