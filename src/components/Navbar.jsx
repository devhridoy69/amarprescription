import React from 'react';
import { 
  Printer, Sparkles, Settings, RotateCcw, LayoutTemplate, 
  Eye, Edit3, Columns, Heart, Stethoscope, Sun, Moon, Type,
  LayoutDashboard, User, LogIn, LogOut, ShieldCheck, ShieldAlert
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
  onOpenAdminPanel = () => {},
  onOpenAuth = () => {},
  onLogout = () => {}
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs no-print transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        
        {/* Brand & Official Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img 
            src="/logo.png" 
            alt="আমার প্রেসক্রিপশন" 
            className="h-10 sm:h-11 w-auto object-contain shrink-0 drop-shadow-xs"
          />
          <div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold tracking-wider text-teal-700 dark:text-teal-400 uppercase">
                Doctor Rx Suite
              </span>
              <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                By Ayan Tech
              </span>
            </div>
          </div>
        </div>

        {/* Center: Device View Mode Switcher (Editor / Split / Preview) */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onSetViewMode('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-white text-teal-900 shadow-xs'
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
                ? 'bg-white text-teal-900 shadow-xs'
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
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Show print preview"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview & Print</span>
          </button>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
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

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Dashboard / History Button */}
          <button
            type="button"
            onClick={onOpenDashboard}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-600 dark:hover:bg-teal-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Dashboard, Patient History & Follow-ups"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-teal-400 dark:text-white" />
            <span className="hidden sm:inline">Dashboard</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-teal-500 text-white text-[10px] font-bold">
                {savedCount}
              </span>
            )}
          </button>

          {/* Multi-Font Selector Dropdown */}
          <div className="relative flex items-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all">
              <Type className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <select
                value={selectedFontId}
                onChange={(e) => onSelectFontId(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-hidden cursor-pointer pr-1 text-slate-800 dark:text-slate-200"
                title="Change Typography Font (রিয়েলটাইম ফন্ট পরিবর্তন)"
              >
                {fontPresets.map((f) => (
                  <option key={f.id} value={f.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Templates Button */}
          <button
            type="button"
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="1-Click Clinical Templates"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          {/* Doctor Profile Settings */}
          <button
            type="button"
            onClick={onOpenDoctorSettings}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="Doctor & Chamber Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Doctor Profile</span>
          </button>

          {/* User Account / Admin Badge / Registration Menu */}
          {adminUser ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-teal-400 border border-teal-500/40 rounded-xl text-xs font-bold shadow-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Admin Panel</span>
            </div>
          ) : currentUser ? (
            <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 py-1 px-2.5 rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'D'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-[11px] font-bold text-teal-900 dark:text-teal-200 leading-tight truncate max-w-[100px]">
                  {currentUser.full_name || 'Dr. Logged In'}
                </span>
                <span className="block text-[9px] text-teal-600 dark:text-teal-400 font-mono">
                  {currentUser.phone}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer ml-1"
                title="লগআউট করুন"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer animate-in fade-in"
              title="ডাক্তার লগইন বা নতুন রেজিস্ট্রেশন মেনু"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন / রেজিস্টার</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle Switch */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              darkMode 
                ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* New Prescription */}
          <button
            type="button"
            onClick={onNewPrescription}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            title="Reset / New Prescription"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
};

export default Navbar;
