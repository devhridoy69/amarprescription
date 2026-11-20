import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, Edit3, Columns, Sun, Moon, Type,
  LayoutDashboard, LogIn, LogOut, ShieldAlert,
  RotateCcw, Sparkles, Wifi, WifiOff, CloudUpload,
  ChevronDown, Building2, Plus, Check, Trash2, Settings, User, Crown, Lock
} from 'lucide-react';
import { getPlanPermissions } from '../data/plansConfig';

export const Navbar = ({ 
  viewMode, 
  onSetViewMode, 
  onOpenDashboard,
  onOpenDoctorSettings, 
  onOpenTemplates, 
  onNewPrescription,
  onPrint,
  darkMode,
  onToggleDarkMode,
  selectedFontId,
  onSelectFontId,
  fontPresets = [],
  savedCount = 0,
  currentUser = null,
  adminUser = null,
  isOnline = true,
  pendingSyncCount = 0,
  onOpenAdminPanel = () => {},
  onOpenAuth = () => {},
  onLogout = () => {},
  doctor = null,
  chamberProfiles = [],
  activeChamberId = null,
  onSelectChamberProfile = () => {},
  onDeleteChamberProfile = () => {},
  onOpenPricing = () => {}
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs no-print transition-colors duration-200">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5 h-15 flex items-center justify-between gap-3">
        
        {/* LEFT: Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <img 
            src="/logo.png" 
            alt="আমার প্রেসক্রিপশন" 
            className="h-9 sm:h-10 w-auto object-contain drop-shadow-xs"
          />
          <div className="hidden xl:block">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[11px] font-extrabold tracking-wider text-teal-800 uppercase">
                Doctor Rx Suite
              </span>
              <span className="text-[10px] text-slate-300">•</span>
              <span className="text-[10px] font-bold text-slate-500">
                Ayan Tech
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: Clean View Switcher (Desktop) */}
        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => onSetViewMode('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-white text-teal-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Show only editor"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          <button
            type="button"
            onClick={() => onSetViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white text-teal-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Side by side live view"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>

          <button
            type="button"
            onClick={() => onSetViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white text-teal-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Show print preview"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview & Print</span>
          </button>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex lg:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
          <button
            type="button"
            onClick={() => onSetViewMode('editor')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              viewMode !== 'preview' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode('preview')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              viewMode === 'preview' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Preview
          </button>
        </div>

        {/* RIGHT: Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Network & Offline Auto-Sync Badge */}
          <div 
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
              !isOnline
                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                : pendingSyncCount > 0
                ? 'bg-blue-50 text-blue-800 border-blue-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
            title={!isOnline ? 'ইন্টারনেট অফলাইন - নতুন প্রেসক্রিপশন লোকাল স্টোরেজে সেভ হবে, নেট আসলেই ক্লাউডে সিংক হয়ে যাবে' : 'ইন্টারনেট অনলাইন - ক্লাউড সিংক সক্রিয়'}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>অফলাইন মোড</span>
                {pendingSyncCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            ) : pendingSyncCount > 0 ? (
              <>
                <CloudUpload className="w-3.5 h-3.5 text-blue-600 shrink-0 animate-bounce" />
                <span>সিংক হচ্ছে ({pendingSyncCount})</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>অনলাইন</span>
              </>
            )}
          </div>

          {/* Group 1: Clinical Tools (Dashboard, Templates, Font) */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {/* Dashboard Button */}
            <button
              type="button"
              onClick={onOpenDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              title="Chamber Dashboard & Patient Records"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-teal-200" />
              <span>Dashboard</span>
              {savedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-teal-500 text-white text-[10px] font-bold">
                  {savedCount}
                </span>
              )}
            </button>

            {/* Templates Button */}
            <button
              type="button"
              onClick={onOpenTemplates}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-teal-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0"
              title="1-Click Clinical Templates & Custom Builder"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Templates</span>
            </button>

            {/* Typography Font Selector */}
            <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
              <Type className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <select
                value={selectedFontId}
                onChange={(e) => onSelectFontId(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-hidden cursor-pointer max-w-[130px] lg:max-w-[170px] truncate pr-1 text-slate-800"
                title="Change Typography Font (রিয়েলটাইম ফন্ট নির্বাচন)"
              >
                {fontPresets.map((f) => (
                  <option key={f.id} value={f.id} className="bg-white text-slate-900">
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

          {/* Group 2: Doctor Profile & Account */}
          {adminUser ? (
            <button
              type="button"
              onClick={onOpenAdminPanel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-teal-400 border border-teal-500/40 rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          ) : currentUser ? (
            <div className="flex items-center gap-2">
              
              {/* Premium Status Pill & Dynamic Usage Limit Display */}
              {(() => {
                const perms = getPlanPermissions(currentUser.plan);
                const isEnterprise = perms.canSwitchChambers && perms.canUseQrCode;
                const isStandard = perms.id === 'standard' || perms.id === 'standard_pro';
                const limit = perms.prescriptionLimit === Infinity ? '∞' : perms.prescriptionLimit;
                const isNearLimit = typeof limit === 'number' && savedCount >= limit;

                return (
                  <button
                    type="button"
                    onClick={onOpenPricing}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                      isEnterprise
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 border-amber-400'
                        : isStandard
                          ? 'bg-teal-700 hover:bg-teal-800 text-white border-teal-600'
                          : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-300 hover:border-amber-400'
                    }`}
                    title="প্ল্যানের বিস্তারিত ফিচার ও ব্যবহারের সীমা দেখতে ক্লিক করুন"
                  >
                    <Crown className={`w-3.5 h-3.5 ${isEnterprise ? 'fill-slate-950 text-slate-950' : isStandard ? 'text-teal-200 fill-teal-200' : 'text-slate-400'}`} />
                    <span>
                      {perms.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-black font-mono ${
                      isEnterprise 
                        ? 'bg-amber-400 text-slate-950' 
                        : isStandard
                          ? isNearLimit ? 'bg-rose-500 text-white animate-pulse' : 'bg-teal-900/60 text-teal-100'
                          : isNearLimit ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {limit === '∞' ? '∞ Unlimited' : `${savedCount}/${limit}`}
                    </span>
                    {!isEnterprise && (
                      <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black hidden sm:flex items-center gap-1 shadow-2xs">
                        <Lock className="w-2.5 h-2.5" />
                        <span>UPGRADE</span>
                      </span>
                    )}
                  </button>
                );
              })()}

              <div className="relative" ref={profileMenuRef}>
              <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 py-1 px-2.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-85 transition-opacity text-left cursor-pointer"
                  title="চেম্বার প্রোফাইল পরিবর্তন বা সেটিংস ওপেন করুন"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center text-xs font-extrabold shadow-2xs shrink-0">
                    {(() => {
                      const name = doctor?.name || currentUser.full_name || '';
                      const cleaned = name.replace(/^(Dr\.|ডাঃ)\s*/i, '').trim();
                      const firstChar = cleaned.charAt(0).toUpperCase();
                      if (!firstChar || /^\d$/.test(firstChar)) {
                        return <User className="w-3.5 h-3.5 text-white" />;
                      }
                      return firstChar;
                    })()}
                  </div>
                  <div className="hidden sm:block leading-tight">
                    <span className="block text-xs font-bold text-teal-950 truncate max-w-[130px]">
                      {(() => {
                        if (doctor?.name && !/^\d+$/.test(doctor.name.trim())) {
                          return doctor.name;
                        }
                        if (currentUser.full_name && !/^\d+$/.test(currentUser.full_name.trim())) {
                          return currentUser.full_name;
                        }
                        return 'ডাঃ চেম্বার';
                      })()}
                    </span>
                    <span className="block text-[10px] text-teal-700 truncate max-w-[130px]">
                      {doctor?.chamberName || (currentUser.phone ? `মোবাইল: ${currentUser.phone}` : 'চেম্বার প্রোফাইল')}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-teal-700 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer ml-0.5"
                  title="লগআউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Multiple Chamber Profiles Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 pb-2 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Chamber Profiles
                      </span>
                      <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-bold">
                        {chamberProfiles.length} টি চেম্বার
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold truncate mt-0.5">
                      {doctor?.name || currentUser.full_name || 'আমার চেম্বার'}
                    </p>
                  </div>

                  {/* Chamber Switching Locked Notification for Non-Enterprise Users */}
                  {(() => {
                    const perms = getPlanPermissions(currentUser.plan);
                    if (!perms.canSwitchChambers) {
                      return (
                        <div className="mx-2 my-2 p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 text-amber-950">
                              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
                              <span className="text-[11px] font-black">মাল্টিপল চেম্বার সুইচিং</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsProfileMenuOpen(false);
                                onOpenPricing();
                              }}
                              className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px] transition-colors cursor-pointer shrink-0 shadow-2xs"
                            >
                              VIP আনলক
                            </button>
                          </div>
                          <p className="text-[10px] text-amber-800 font-medium mt-1 leading-tight">
                            পপুলার, ইবনে সিনা বা একাধিক চেম্বার সুইচিং সুবিধা Enterprise VIP প্ল্যানে অন্তর্ভুক্ত।
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Profile List */}
                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                    {chamberProfiles.map((prof, idx) => {
                      const isActive = prof.id === activeChamberId;
                      const perms = getPlanPermissions(currentUser.plan);
                      const isLocked = !perms.canSwitchChambers && idx > 0;

                      return (
                        <div
                          key={prof.id}
                          className={`group flex items-center justify-between p-2 rounded-xl border transition-all text-left ${
                            isActive
                              ? 'bg-teal-50/80 border-teal-300 shadow-2xs'
                              : isLocked
                                ? 'bg-slate-50/80 border-slate-200 opacity-60'
                                : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (isLocked) {
                                setIsProfileMenuOpen(false);
                                onOpenPricing();
                                return;
                              }
                              onSelectChamberProfile(prof);
                              setIsProfileMenuOpen(false);
                            }}
                            className="flex-1 min-w-0 pr-2 cursor-pointer flex items-center gap-1.5"
                          >
                            <Building2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold truncate block ${isActive ? 'text-teal-900' : 'text-slate-800'}`}>
                                  {prof.chamberName || 'Unnamed Chamber'}
                                </span>
                                {isLocked && (
                                  <span className="text-[9px] bg-amber-100 text-amber-900 px-1 rounded font-bold shrink-0">
                                    🔒 VIP
                                  </span>
                                )}
                              </div>
                              {prof.chamberAddress && (
                                <p className="text-[10px] text-slate-500 truncate">
                                  {prof.chamberAddress}
                                </p>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            {isActive && (
                              <Check className="w-4 h-4 text-teal-600 stroke-[2.5]" />
                            )}
                            {chamberProfiles.length > 1 && !isLocked && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteChamberProfile(prof.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity cursor-pointer"
                                title="প্রোফাইল মুছুন"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Chamber Profile / Settings Actions */}
                  <div className="p-1.5 pt-2 border-t border-slate-100 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        const perms = getPlanPermissions(currentUser.plan);
                        if (!perms.canSwitchChambers && chamberProfiles.length >= 1) {
                          setIsProfileMenuOpen(false);
                          onOpenPricing();
                          return;
                        }
                        onOpenDoctorSettings();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5" />
                        <span>নতুন চেম্বার প্রোফাইল যুক্ত / এডিট করুন</span>
                      </span>
                      {!getPlanPermissions(currentUser.plan).canSwitchChambers && (
                        <span className="text-[9px] bg-amber-200 text-amber-950 font-black px-1.5 py-0.5 rounded">
                          Enterprise VIP
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              title="ডাক্তার লগইন বা রেজিস্ট্রেশন"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন / রেজিস্টার</span>
            </button>
          )}

          {/* Group 3: Quick Utilities (Dark mode & New Rx) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
                darkMode 
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30 hover:bg-amber-400/30' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              type="button"
              onClick={onNewPrescription}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
              title="New Prescription (নতুন প্রেসক্রিপশন)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};

export default Navbar;
