import React from 'react';
import { 
  Eye, Edit3, Columns, Sun, Moon, Type,
  LayoutDashboard, LogIn, LogOut, ShieldAlert,
  RotateCcw, Sparkles, Wifi, WifiOff, CloudUpload
} from 'lucide-react';

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
  onLogout = () => {}
}) => {
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
            <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 py-1 px-2.5 rounded-xl">
              <button
                type="button"
                onClick={onOpenDoctorSettings}
                className="flex items-center gap-2 hover:opacity-85 transition-opacity text-left cursor-pointer"
                title="ডাক্তারের প্রোফাইল ও চেম্বার সেটিংস"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center text-xs font-extrabold shadow-2xs shrink-0">
                  {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'D'}
                </div>
                <div className="hidden sm:block leading-tight">
                  <span className="block text-xs font-bold text-teal-950 truncate max-w-[120px]">
                    {currentUser.full_name || 'Dr. Chamber'}
                  </span>
                  <span className="block text-[10px] text-teal-700 font-mono">
                    {currentUser.phone}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer ml-1"
                title="লগআউট"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
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
