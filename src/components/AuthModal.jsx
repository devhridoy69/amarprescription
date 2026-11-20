import React, { useState } from 'react';
import {
  Phone, Lock, User, Stethoscope, Award, FileBadge,
  ArrowRight, CheckCircle2, Eye, EyeOff,
  Sparkles, AlertCircle, LogIn, UserPlus, ShieldCheck
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

  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '', phone: '', password: '', degrees: '', specialty: '', bmdcReg: ''
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!loginForm.phone.trim() || !loginForm.password) {
      setErrorMessage('Please enter your phone number and password.');
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
          setErrorMessage(res.error || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err) {
      setErrorMessage('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!registerForm.fullName.trim()) {
      setErrorMessage("Please enter the doctor's full name.");
      return;
    }
    if (!registerForm.phone.trim() || registerForm.phone.trim().length < 10) {
      setErrorMessage('Please enter a valid 11-digit phone number (e.g. 017XXXXXXXX).');
      return;
    }
    if (!registerForm.password || registerForm.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await registerDoctorOnline(registerForm);
      if (res.success) {
        setRegisteredPhone(registerForm.phone);
        setMode('pending_notice');
      } else {
        setErrorMessage(res.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Shared clean glass input class
  const inputCls = `w-full bg-black/40 hover:bg-black/50 focus:bg-black/60 border border-white/10 hover:border-white/20 rounded-xl text-sm text-white placeholder:text-slate-400
    focus:outline-none focus:border-teal-400/80 focus:ring-1 focus:ring-teal-400/30 transition-all duration-200 backdrop-blur-md`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090c] animate-in fade-in duration-300 overflow-hidden">

      {/* ===== GLOBAL FULL SCREEN BACKGROUND IMAGE ===== */}
      <img
        src="/brand-logo.jpg"
        alt="Amar Prescription Background"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        style={{ filter: 'brightness(0.65) saturate(1.2) contrast(1.05)' }}
      />

      {/* Atmospheric overlay with balanced clarity and contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/40 pointer-events-none" />

      {/* Ambient background glowing blobs */}
      <div
        className="absolute top-1/3 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none"
        style={{ animation: 'ap-pulse-glow 6s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-400/15 rounded-full blur-[120px] pointer-events-none"
        style={{ animation: 'ap-pulse-glow 8s 2s ease-in-out infinite' }}
      />

      {/* ===== OUTER CONTAINER — split two-panel with backdrop-blur ===== */}
      <div className="relative z-10 w-full h-full flex overflow-hidden">

        {/* ========== LEFT PANEL — Cinematic Branding & Visuals ========== */}
        <div className="hidden md:flex relative w-[46%] lg:w-[48%] shrink-0 flex-col overflow-hidden">

          {/* CSS keyframe animations */}
          <style>{`
            @keyframes ap-fadeDown {
              from { opacity: 0; transform: translateY(-16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes ap-slideUp {
              from { opacity: 0; transform: translateY(32px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes ap-float {
              0%   { transform: translateY(0px) scale(1); }
              50%  { transform: translateY(-12px) scale(1.03); }
              100% { transform: translateY(0px) scale(1); }
            }
            @keyframes ap-floatR {
              0%   { transform: translateY(0px) rotate(0deg); }
              50%  { transform: translateY(-8px) rotate(3deg); }
              100% { transform: translateY(0px) rotate(0deg); }
            }
            @keyframes ap-shimmer {
              0%   { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
            @keyframes ap-pulse-glow {
              0%, 100% { opacity: 0.12; transform: scale(1); }
              50%       { opacity: 0.22; transform: scale(1.15); }
            }
            @keyframes ap-orbit {
              from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
              to   { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
            }
            @keyframes ap-orbit2 {
              from { transform: rotate(180deg) translateX(80px) rotate(-180deg); }
              to   { transform: rotate(540deg) translateX(80px) rotate(-540deg); }
            }
            .ap-brand-shimmer {
              background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
              background-size: 200% 100%;
              animation: ap-shimmer 3s linear infinite;
            }
          `}</style>

          {/* Left panel subtle background shading to keep text contrast super crisp */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Animated glow blobs */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"
            style={{ animation: 'ap-pulse-glow 5s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"
            style={{ animation: 'ap-pulse-glow 7s 2s ease-in-out infinite' }}
          />

          {/* Orbiting accent dots */}
          <div className="absolute top-1/2 left-1/2 pointer-events-none" style={{ width: 0, height: 0 }}>
            <div
              className="absolute w-2.5 h-2.5 rounded-full bg-teal-400/60 shadow-[0_0_8px_2px_rgba(45,212,191,0.4)]"
              style={{ animation: 'ap-orbit 10s linear infinite', marginTop: -5, marginLeft: -5 }}
            />
            <div
              className="absolute w-1.5 h-1.5 rounded-full bg-emerald-300/50 shadow-[0_0_6px_1px_rgba(110,231,183,0.4)]"
              style={{ animation: 'ap-orbit2 14s linear infinite', marginTop: -4, marginLeft: -4 }}
            />
          </div>

          {/* Floating particle dots */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[
              { size: 3, top: '12%', left: '18%', dur: '7s', delay: '0s' },
              { size: 2, top: '28%', left: '78%', dur: '9s', delay: '1.2s' },
              { size: 4, top: '55%', left: '22%', dur: '6s', delay: '2.5s' },
              { size: 2, top: '70%', left: '72%', dur: '8s', delay: '0.6s' },
              { size: 3, top: '42%', left: '58%', dur: '11s', delay: '3s' },
              { size: 2, top: '82%', left: '38%', dur: '7s', delay: '1.8s' },
            ].map((p, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-teal-300/50"
                style={{
                  width: p.size, height: p.size,
                  top: p.top, left: p.left,
                  boxShadow: '0 0 6px 1px rgba(94,234,212,0.5)',
                  animation: `ap-float ${p.dur} ${p.delay} ease-in-out infinite`,
                }}
              />
            ))}
          </div>

          {/* ── TOP: Logo brand chip ── */}
          <div className="relative z-10 p-7 lg:p-9" style={{ animation: 'ap-fadeDown 0.9s 0.1s ease both', opacity: 0 }}>
            <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 shadow-2xl ap-brand-shimmer">
              <img
                src="/amar-rx-hd-clean.png"
                alt="Amar Prescription"
                className="h-9 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 0 10px rgba(45,212,191,0.6)) brightness(1.15)' }}
              />
              <div className="w-px h-6 bg-white/20 shrink-0" />
              <div>
                <p className="text-teal-400 font-bold tracking-widest uppercase text-[10px]">Doctor Portal</p>
                <p className="text-slate-300 text-[9px] font-medium tracking-wider mt-0.5">v2.0 · Powered by Ayan Tech</p>
              </div>
            </div>
          </div>

          {/* ── CENTER: Floating center logo card ── */}
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <div
              className="relative"
              style={{ animation: 'ap-float 8s 0.3s ease-in-out infinite' }}
            >
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-3xl bg-teal-400/20 blur-3xl scale-125" />
              {/* Logo container — frosted glass */}
              <div className="relative bg-black/30 backdrop-blur-md border border-white/15 rounded-3xl p-6 lg:p-8 shadow-2xl">
                <img
                  src="/amar-rx-hd-clean.png"
                  alt="Amar Prescription"
                  className="w-56 lg:w-64 h-auto object-contain"
                  style={{ filter: 'drop-shadow(0 8px 25px rgba(45,212,191,0.5)) brightness(1.2)' }}
                />
              </div>
            </div>
          </div>

          {/* ── BOTTOM: Text + pills ── */}
          <div className="relative z-10 p-7 lg:p-9 space-y-4">

            {/* Headline */}
            <div style={{ animation: 'ap-slideUp 1s 0.3s ease both', opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-10 h-[2px] bg-teal-400 rounded-full" />
                <span className="w-4 h-[2px] bg-white/25 rounded-full" />
                <span className="w-2 h-[2px] bg-white/12 rounded-full" />
              </div>
              <h2 className="text-3xl lg:text-[2.4rem] font-black text-white tracking-tight leading-[1.1] drop-shadow-2xl">
                Prescribe<br />
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(90deg, #2dd4bf, #34d399, #2dd4bf)', backgroundSize: '200%', animation: 'ap-shimmer 4s linear infinite' }}
                >
                  Smarter.
                </span>
              </h2>
              <p className="text-slate-300/70 text-sm mt-2.5 leading-relaxed max-w-[260px]">
                Bangladesh's most advanced digital prescription platform for doctors.
              </p>
            </div>

            {/* Feature pills */}
            <div
              className="flex flex-wrap gap-2"
              style={{ animation: 'ap-slideUp 1s 0.5s ease both', opacity: 0 }}
            >
              {[
                { label: '⚡ QR Prescription', cls: 'bg-teal-500/15 border-teal-400/30 text-teal-300' },
                { label: '☁ Cloud Sync',       cls: 'bg-sky-500/15  border-sky-400/30  text-sky-300'  },
                { label: '📅 Online Appointment', cls: 'bg-violet-500/15 border-violet-400/30 text-violet-300' },
              ].map(f => (
                <span
                  key={f.label}
                  className={`text-[10px] px-3 py-1.5 rounded-full border backdrop-blur-sm font-semibold tracking-wide ${f.cls}`}
                >
                  {f.label}
                </span>
              ))}
            </div>

            {/* Footer */}
            <p
              className="text-white/25 text-[11px] font-medium tracking-wide"
              style={{ animation: 'ap-slideUp 1s 0.65s ease both', opacity: 0 }}
            >
              Powered by Ayan Tech · © 2026
            </p>
          </div>
        </div>

        {/* ========== RIGHT PANEL — Glassmorphism Transparent Form ========== */}
        <div className="flex-1 bg-black/20 md:bg-black/25 backdrop-blur-xl border-l border-white/10 flex flex-col items-center justify-center overflow-y-auto px-6 sm:px-10 py-10 shadow-2xl">

          {/* Mobile logo (only shows when left panel is hidden) */}
          <div className="flex md:hidden items-center gap-3 mb-8">
            <img src="/amar-rx-hd-clean.png" alt="Amar Prescription" className="h-10 w-auto object-contain" />
          </div>

          <div className="w-full max-w-sm">

            {/* ---- SUCCESS / PENDING NOTICE ---- */}
            {mode === 'pending_notice' ? (
              <div className="text-center space-y-5 animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 rounded-full bg-teal-500/10 border-2 border-teal-500/40 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Registration Successful!</h3>
                  <p className="text-sm font-mono font-bold text-teal-400 mt-2 bg-teal-500/10 px-3 py-1 rounded-full inline-block border border-teal-500/20">
                    {registeredPhone}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/8 text-left space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      Thank you! Your registration is submitted. Our representative will contact you shortly.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      For urgent help, contact us on WhatsApp or call:{' '}
                      <strong className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">01780-960370</strong>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMessage(''); }}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-black rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                {/* ---- TAB SWITCHER WITH SMOOTH SLIDING PILL ---- */}
                <div className="relative flex items-center bg-black/40 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 mb-6">
                  {/* Smooth sliding highlight backdrop */}
                  <div
                    className="absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-out shadow-lg"
                    style={{
                      width: 'calc(50% - 6px)',
                      left: mode === 'register' ? '6px' : 'calc(50%)',
                      backgroundColor: mode === 'register' ? '#14b8a6' : '#272930',
                    }}
                  />

                  <button
                    id="auth-register-tab-btn"
                    type="button"
                    onClick={() => { setMode('register'); setErrorMessage(''); }}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer ${
                      mode === 'register'
                        ? 'text-black'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </button>

                  <button
                    id="auth-login-tab-btn"
                    type="button"
                    onClick={() => { setMode('login'); setErrorMessage(''); }}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer ${
                      mode === 'login'
                        ? 'text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    Log In
                  </button>
                </div>

                {/* Form Transition Container */}
                <div key={mode} className="animate-in fade-in slide-in-from-bottom-2 duration-300">

                  {/* ---- HEADING ---- */}
                  <div className="mb-5">
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                      {mode === 'login' ? 'Welcome back!' : 'Create an Account'}
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm mt-1">
                      {mode === 'login'
                        ? 'Sign in to your doctor portal'
                        : 'Start your digital prescription journey today'}
                    </p>
                  </div>

                {/* ---- ERROR ---- */}
                {errorMessage && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs animate-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{errorMessage}</span>
                  </div>
                )}

                {/* ======= LOGIN FORM ======= */}
                {mode === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={loginForm.phone}
                          onChange={e => setLoginForm({ ...loginForm, phone: e.target.value })}
                          placeholder="017XXXXXXXX"
                          className={`${inputCls} pl-11 pr-4 py-3.5`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginForm.password}
                          onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                          placeholder="••••••••"
                          className={`${inputCls} pl-11 pr-12 py-3.5`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="remember-me"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-white/10 bg-[#1e1f23] text-teal-500 focus:ring-teal-500 cursor-pointer"
                      />
                      <label htmlFor="remember-me" className="text-xs text-slate-400 cursor-pointer select-none">
                        Remember me for 1 month
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 mt-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black rounded-xl text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 tracking-wide"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Verifying...
                        </span>
                      ) : (
                        <>
                          <span>Log In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-slate-500 pt-1">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('register'); setErrorMessage(''); }}
                        className="text-teal-400 font-bold hover:text-teal-300 cursor-pointer transition-colors"
                      >
                        Register here
                      </button>
                    </p>
                  </form>
                )}

                {/* ======= REGISTER FORM ======= */}
                {mode === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={registerForm.fullName}
                          onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                          placeholder="Dr. Md. Rafiqul Islam"
                          className={`${inputCls} pl-11 pr-4 py-3`}
                        />
                      </div>
                    </div>

                    {/* Phone & Password */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Mobile *
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            value={registerForm.phone}
                            onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                            placeholder="017XXXXXXXX"
                            className={`${inputCls} pl-10 pr-3 py-3 text-xs`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={registerForm.password}
                            onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                            placeholder="Min. 6 chars"
                            className={`${inputCls} pl-10 pr-8 py-3 text-xs`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Degrees */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Degrees (Optional)
                      </label>
                      <div className="relative">
                        <Award className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={registerForm.degrees}
                          onChange={e => setRegisterForm({ ...registerForm, degrees: e.target.value })}
                          placeholder="MBBS, FCPS (Medicine)"
                          className={`${inputCls} pl-11 pr-4 py-3`}
                        />
                      </div>
                    </div>

                    {/* Specialty & BMDC */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Specialty
                        </label>
                        <div className="relative">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={registerForm.specialty}
                            onChange={e => setRegisterForm({ ...registerForm, specialty: e.target.value })}
                            placeholder="Medicine"
                            className={`${inputCls} pl-10 pr-3 py-3 text-xs`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          BMDC No.
                        </label>
                        <div className="relative">
                          <FileBadge className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={registerForm.bmdcReg}
                            onChange={e => setRegisterForm({ ...registerForm, bmdcReg: e.target.value })}
                            placeholder="A-48920"
                            className={`${inputCls} pl-10 pr-3 py-3 text-xs font-mono`}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 mt-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black rounded-xl text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Create Account</span>
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-slate-500 pt-1">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setErrorMessage(''); }}
                        className="text-teal-400 font-bold hover:text-teal-300 cursor-pointer transition-colors"
                      >
                        Log in
                      </button>
                    </p>
                  </form>
                )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
