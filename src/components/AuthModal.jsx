import React, { useState } from 'react';
import { 
  Phone, Lock, User, Stethoscope, Award, FileBadge, 
  ArrowRight, CheckCircle2, Clock, ShieldCheck, Eye, EyeOff,
  Sparkles, AlertCircle, LogIn, UserPlus, HeartPulse
} from 'lucide-react';
import { registerDoctorOnline, loginDoctorOnline } from '../lib/supabase';

export const AuthModal = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  onAdminLoginSuccess = null,
  isForced = false
}) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'pending_notice'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: ''
  });

  // Registration Form State
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    phone: '',
    password: '',
    degrees: '',
    specialty: '',
    bmdcReg: ''
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!loginForm.phone.trim() || !loginForm.password) {
      setErrorMessage('ফোন নম্বর এবং পাসওয়ার্ড উভয়ই প্রদান করুন।');
      return;
    }

    setLoading(true);
    try {
      const res = await loginDoctorOnline(loginForm.phone, loginForm.password);
      if (res.success) {
        if (res.isAdmin && onAdminLoginSuccess) {
          onAdminLoginSuccess(res.doctor, rememberMe);
          onClose();
          return;
        }
        if (res.doctor) {
          onLoginSuccess(res.doctor, rememberMe);
          onClose();
        }
      } else {
        if (res.isPending) {
          setRegisteredPhone(loginForm.phone);
          setMode('pending_notice');
        } else {
          setErrorMessage(res.error || 'লগইন ব্যর্থ হয়েছে।');
        }
      }
    } catch (err) {
      setErrorMessage('সার্ভার সংযোগ সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!registerForm.fullName.trim()) {
      setErrorMessage('ডাক্তারের পূর্ণ নাম প্রদান করুন।');
      return;
    }
    if (!registerForm.phone.trim() || registerForm.phone.trim().length < 10) {
      setErrorMessage('সঠিক ১১ ডিজিটের ফোন নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)।');
      return;
    }
    if (!registerForm.password || registerForm.password.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setLoading(true);
    try {
      const res = await registerDoctorOnline(registerForm);
      if (res.success) {
        setRegisteredPhone(registerForm.phone);
        setMode('pending_notice');
      } else {
        setErrorMessage(res.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setErrorMessage('সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Clean Pure White Floating Card */}
      <div className="relative w-full max-w-md bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all duration-300">
        
        {/* Subtle Brand Emerald Bar at Top */}
        <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 w-full"></div>

        {/* Modal Close Button (Only show if not forced login) */}
        {!isForced && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors z-10 cursor-pointer"
          >
            ✕
          </button>
        )}

        <div className="p-6 sm:p-7">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="relative mb-2.5">
              <div className="w-14 h-14 rounded-2xl bg-teal-50/80 border border-teal-200/90 flex items-center justify-center shadow-xs">
                <img 
                  src="/logo.png" 
                  alt="আমার প্রেসক্রিপশন" 
                  className="h-10 w-auto object-contain drop-shadow-2xs"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                <ShieldCheck className="w-3 h-3" />
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              আমার প্রেসক্রিপশন
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-teal-800 tracking-wider uppercase">
                Powered By Ayan Tech
              </span>
              <span className="text-[9px] text-slate-300">•</span>
              <span className="text-[10px] text-slate-500 font-medium">
                Doctor Portal
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs (Login / Register) */}
          {mode !== 'pending_notice' && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-teal-800 shadow-xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn className="w-4 h-4 text-teal-600" />
                <span>লগইন (Sign In)</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-teal-800 shadow-xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-4 h-4 text-teal-600" />
                <span>নতুন রেজিস্ট্রেশন</span>
              </button>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {/* ======================= TAB 1: LOGIN ======================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  মোবাইল নম্বর (Phone Number)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={loginForm.phone}
                    onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  পাসওয়ার্ড (Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>আমাকে মনে রাখুন (Remember me for 1 Month)</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>যাচাই করা হচ্ছে...</span>
                  ) : (
                    <>
                      <span>লগইন করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-600 font-medium">
                  অ্যাকাউন্ট নেই?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                    }}
                    className="text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    এখানে রেজিস্ট্রেশন করুন
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ======================= TAB 2: REGISTRATION ======================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {/* Doctor Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ডাক্তারের পূর্ণ নাম *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    placeholder="Dr. Md. Rafiqul Islam"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Phone & Password Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাসওয়ার্ড * (মিনিমাম ৬ ডিজিট)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      placeholder="••••••"
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Degree / Qualifications */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ডিগ্রী ও পদবী (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={registerForm.degrees}
                    onChange={(e) => setRegisterForm({ ...registerForm, degrees: e.target.value })}
                    placeholder="MBBS, BCS (Health), FCPS (Medicine)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <Award className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Specialty & BMDC Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বিশেষজ্ঞতা (Specialty)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={registerForm.specialty}
                      onChange={(e) => setRegisterForm({ ...registerForm, specialty: e.target.value })}
                      placeholder="Medicine Specialist"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <Stethoscope className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    BMDC Reg. No.
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={registerForm.bmdcReg}
                      onChange={(e) => setRegisterForm({ ...registerForm, bmdcReg: e.target.value })}
                      placeholder="A-48920"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                    />
                    <FileBadge className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>তথ্য সাবমিট করা হচ্ছে...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>রেজিস্ট্রেশন আবেদন জমা দিন</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-600 font-medium">
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className="text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    লগইন করুন
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ======================= TAB 3: REGISTRATION SUCCESS & CONTACT NOTICE ======================= */}
          {mode === 'pending_notice' && (
            <div className="py-3 text-center space-y-4 animate-in zoom-in-95 duration-200">
              
              <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-500 text-teal-600 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  রেজিস্ট্রেশন সফল হয়েছে
                </h3>
                <p className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full inline-block border border-teal-200">
                  {registeredPhone}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    ধন্যবাদ স্যার। সফলভাবে রেজিস্ট্রেশন সম্পন্ন করার জন্য আপনাকে অভিনন্দন। আমাদের প্রতিনিধি খুব শীঘ্রই আপনার সাথে যোগাযোগ করবেন।
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    যেকোনো জরুরি প্রয়োজনে আমাদের সাথে হোয়াটসঅ্যাপে যোগাযোগ করতে পারেন অথবা সরাসরি কল করতে পারেন এই নম্বরে: <strong className="font-mono text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-bold">01780-960370</strong>
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>ঠিক আছে, লগইন পেজে যান</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AuthModal;
