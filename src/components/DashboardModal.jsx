import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, History, CalendarCheck, Search, Eye, 
  Printer, Trash2, ArrowUpRight, User, Clock, CheckCircle2, 
  AlertCircle, FileText, ChevronRight, X, Phone, Plus, Filter,
  TrendingUp, Activity, Check, RefreshCw, Calendar, RotateCcw, Edit3, Crown
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
    <div className={`no-print fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 ${darkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Chamber Dashboard & Patient Records
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Prescription</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview & Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Patient Records & Reprint ({filterByDate ? selectedDatePatients : totalPatients})</span>
          </button>

          <button
            onClick={() => setActiveTab('followups')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'followups'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Follow-up Checklist ({pendingFollowUps})</span>
            {todayFollowUps > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                Today {todayFollowUps}
              </span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ===================== TAB 1: OVERVIEW ===================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Subscription Plan & Usage Limit Status Banner */}
              {(() => {
                const perms = getPlanPermissions(currentUser?.plan);
                const isEnterprise = perms.canSwitchChambers && perms.canUseQrCode;
                const limit = perms.prescriptionLimit;
                const percentage = limit === Infinity ? 100 : Math.min(100, Math.round((totalPatients / limit) * 100));

                return (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white shadow-lg border border-teal-800/40 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1.5 ${
                            isEnterprise 
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950'
                              : perms.id !== 'free'
                                ? 'bg-teal-600 text-white' 
                                : 'bg-slate-700 text-slate-200'
                          }`}>
                            <Crown className="w-3.5 h-3.5" />
                            {perms.name}
                          </span>
                          <span className="text-[11px] text-teal-300 font-semibold">
                            {limit === Infinity 
                              ? '👑 Unlimited Lifetime Access' 
                              : `⭐ Clean Pad & ${limit} Rx Limit`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
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
                          <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                            Prescription Usage Limit
                          </span>
                          <span className="text-lg font-black font-mono text-teal-300">
                            {isEnterprise ? `${totalPatients} / ∞ (Unlimited)` : `${totalPatients} / ${limit}`}
                          </span>
                        </div>

                        {!isEnterprise && (
                          <button
                            type="button"
                            onClick={onOpenPricing}
                            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Upgrade Plan</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Non-Enterprise */}
                    {!isEnterprise && (
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-semibold">
                          <span>Usage Progress ({percentage}%)</span>
                          <span>Remaining: {Math.max(0, limit - totalPatients)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentage >= 90 ? 'bg-rose-500' : percentage >= 70 ? 'bg-amber-400' : 'bg-teal-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
                      Total Patients Prescribed
                    </span>
                    <span className="text-2xl font-black text-teal-950 dark:text-teal-100 font-mono mt-1 block">
                      {totalPatients}
                    </span>
                    <span className="text-[10px] text-teal-700/80 dark:text-teal-400">Saved in History</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider block">
                      Today's Patients
                    </span>
                    <span className="text-2xl font-black text-sky-950 dark:text-sky-100 font-mono mt-1 block">
                      {todayPatients}
                    </span>
                    <span className="text-[10px] text-sky-700/80 dark:text-sky-400">{todayStr}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-600/10 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                      Pending Follow-ups
                    </span>
                    <span className="text-2xl font-black text-amber-950 dark:text-amber-100 font-mono mt-1 block">
                      {pendingFollowUps}
                    </span>
                    <span className="text-[10px] text-amber-700/80 dark:text-amber-400">Awaiting next visit</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider block">
                      Today's Follow-ups
                    </span>
                    <span className="text-2xl font-black text-indigo-950 dark:text-indigo-100 font-mono mt-1 block">
                      {todayFollowUps}
                    </span>
                    <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400">Scheduled for today</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Quick Search in Overview */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
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
                    onFocus={() => {
                      if (activeTab === 'overview' && records.length > 5) {
                        // User can search right here
                      }
                    }}
                    placeholder="Search by patient name, phone, Rx ID, or diagnosis..."
                    className="w-full pl-9 pr-24 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {searchTerm ? (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="absolute right-3 top-2 text-[10px] text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200">
                      Quick Search
                    </span>
                  )}
                </div>
              </div>

              {/* Recent 5 Patients Quick List */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>Recent Prescribed Patients</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {records.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No prescriptions saved yet. Prescriptions printed or saved will appear here.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {records.slice(0, 5).map((rec, idx) => (
                      <div 
                        key={rec.id || idx}
                        className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 hover:border-teal-300 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                            {rec.patient?.rxId || rec.rxId || 'RX-0000'}
                          </span>
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                              {rec.patient?.name || 'Unnamed Patient'}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {rec.patient?.age ? `${rec.patient.age} ${rec.patient.ageUnit || 'Y'}` : ''} • {rec.patient?.gender || 'Male'}
                              {rec.patient?.phone && (
                                <span className="font-mono text-teal-700 dark:text-teal-400 font-semibold"> • {rec.patient.phone}</span>
                              )}
                              <span> • {rec.diagnosis || 'Diagnosis N/A'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {rec.date || rec.patient?.date}
                          </span>
                          <button
                            onClick={() => {
                              onLoadPrescription(rec);
                              onClose();
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              activeEditingRecordId === rec.id
                                ? 'bg-teal-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-teal-50 hover:text-teal-800 dark:bg-slate-700 dark:hover:bg-slate-600'
                            }`}
                            title="Open and edit this prescription"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            <span>{activeEditingRecordId === rec.id ? 'Editing Now' : 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => onReprintPrescription(rec)}
                            className="p-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs transition-all cursor-pointer"
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
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by patient name, phone, Rx ID, or diagnosis..."
                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Date Picker Selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs">
                    <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300 text-[11px]">Date:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setFilterByDate(true);
                      }}
                      className="bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                    />
                  </div>

                  {/* Filter Toggle Buttons */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setFilterByDate(true);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      filterByDate && selectedDate === todayStr
                        ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Today ({todayPatients})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterByDate(false)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      !filterByDate
                        ? 'bg-slate-800 dark:bg-teal-600 text-white border-slate-900 dark:border-teal-700 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    All Records ({totalPatients})
                  </button>
                </div>

              </div>

              {/* History Table / Cards */}
              {filteredRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  {filterByDate 
                    ? `No prescriptions found for ${selectedDate}. Click "All Records" to view full history.`
                    : 'No prescription history found.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      {filterByDate ? `List for ${selectedDate}` : 'Total Saved Records'} : <strong>{filteredRecords.length} patients found</strong>
                    </span>
                  </div>

                  {filteredRecords.map((rec, idx) => (
                    <div 
                      key={rec.id || idx}
                      className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                            {rec.patient?.rxId || rec.rxId}
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {rec.patient?.name || 'Unnamed Patient'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({rec.patient?.age ? `${rec.patient.age} ${rec.patient.ageUnit || 'Y'}` : '—'}, {rec.patient?.gender})
                          </span>
                          {rec.patient?.phone && (
                            <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200/80">
                              <Phone className="w-3 h-3" />
                              {rec.patient.phone}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          {rec.diagnosis && (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Diagnosis: <span className="text-teal-700 dark:text-teal-400">{rec.diagnosis}</span>
                            </span>
                          )}
                          <span>•</span>
                          <span>Date: <strong>{rec.date || rec.patient?.date}</strong></span>
                          {rec.medicines?.length > 0 && (
                            <>
                              <span>•</span>
                              <span>Medicines: <strong className="text-slate-800 dark:text-slate-200">{rec.medicines.length} items</strong></span>
                            </>
                          )}
                          {rec.nextVisit && (
                            <>
                              <span>•</span>
                              <span className="text-amber-700 dark:text-amber-400 font-medium">Follow-up: {rec.nextVisit}</span>
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
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeEditingRecordId === rec.id
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'
                          }`}
                          title="Open and edit this prescription"
                        >
                          <Edit3 className={`w-3.5 h-3.5 ${activeEditingRecordId === rec.id ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                          <span>{activeEditingRecordId === rec.id ? 'Editing Now' : 'Edit'}</span>
                        </button>

                        <button
                          onClick={() => onReprintPrescription(rec)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
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
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
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
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-teal-900 dark:text-teal-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All Follow-ups ({followUpRecords.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'pending'
                        ? 'bg-white dark:bg-slate-700 text-teal-900 dark:text-teal-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Pending ({pendingFollowUps})
                  </button>
                  <button
                    onClick={() => setStatusFilter('today')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'today'
                        ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Today's Visit ({todayFollowUps})
                  </button>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'completed'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Completed ({followUpRecords.length - pendingFollowUps})
                  </button>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Check box when follow-up is completed
                </div>
              </div>

              {/* Follow-up Checklist Items */}
              {filteredFollowUps.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No follow-up records found.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFollowUps.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                        item.isCompleted 
                          ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70' 
                          : item.isToday 
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox to mark complete */}
                        <button
                          type="button"
                          onClick={() => onToggleFollowUpStatus(item.id)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                            item.isCompleted
                              ? 'bg-emerald-600 border-emerald-700 text-white'
                              : 'border-slate-300 dark:border-slate-600 hover:border-teal-500 bg-white dark:bg-slate-700'
                          }`}
                          title={item.isCompleted ? 'Unmark completed' : 'Mark as completed'}
                        >
                          {item.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-xs ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                              {item.patient?.name || 'Unnamed Patient'}
                            </span>
                            <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-1.5 py-0.5 rounded">
                              {item.patient?.rxId || item.rxId}
                            </span>
                            {item.isToday && !item.isCompleted && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                                Due Today
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Diagnosis: <strong className="text-slate-700 dark:text-slate-300">{item.diagnosis || 'N/A'}</strong> • 
                            Follow-up Due: <strong className="text-teal-700 dark:text-teal-400">{item.nextVisit || 'Not specified'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onLoadPrescription(item);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-teal-50 dark:bg-slate-700 text-xs font-bold rounded transition-colors cursor-pointer"
                          title="Open and edit prescription"
                        >
                          <Edit3 className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => onReprintPrescription(item)}
                          className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors cursor-pointer"
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
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
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

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Amar Prescription Suite • All data securely saved</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default DashboardModal;
