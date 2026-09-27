import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';

export const AdminLoginScreen: React.FC = () => {
  const { loginUser } = useApp();

  const [email, setEmail] = useState<string>('admin@jklu.edu.in');
  const [password, setPassword] = useState<string>('admin@jklu');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your administrator email address or ID.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your administrator security password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const success = loginUser(email, password, 'admin');
      if (!success) {
        setErrorMessage('Authentication failed. Check your admin credentials.');
      }
    }, 500);
  };

  const handleReturnToMain = () => {
    window.history.pushState({}, '', '/');
    window.location.href = '/';
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-gradient-to-b from-[#0F1E36] via-[#1E3A68] to-[#122442] text-white">
      {/* Background High-Tech Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#486DA8_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Subtle Glowing Radial Backlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#E8590C]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Return Button */}
        <button
          onClick={handleReturnToMain}
          className="inline-flex items-center gap-2 text-xs font-mono text-blue-200/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to University Portal</span>
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white p-2.5 shadow-2xl flex items-center justify-center overflow-hidden border-2 border-white/20">
            <img src="/jklu-logo.png" alt="JKLU University Logo" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E8590C]/20 text-orange-300 border border-[#E8590C]/30 text-[10px] font-mono font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8590C] animate-pulse" />
              <span>Restricted Administration Portal</span>
            </div>
            <h1 className="font-editorial font-black text-2xl sm:text-3xl text-white tracking-tight">
              Transit Operations Command
            </h1>
            <p className="text-xs text-blue-200/80 max-w-sm mx-auto">
              Authorised Transport Management & Real-time Shuttle Control Center
            </p>
          </div>
        </div>

        {/* Admin Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-900 border border-blue-900/40 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2 text-xs font-editorial font-bold text-[#1E3A68]">
              <ShieldCheck className="w-4 h-4 text-[#E8590C]" />
              <span>Admin SSO Authentication</span>
            </div>
            <span className="text-[10px] font-mono text-stone-400">/admin</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / ID Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-editorial font-bold text-stone-700 block">
                Administrator Official Email or Incharge ID
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jklu.edu.in"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#1E3A68] focus:ring-2 focus:ring-[#1E3A68]/20 text-xs sm:text-sm text-stone-800 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-editorial font-bold text-stone-700">
                  Security Passkey
                </label>
                <span className="text-[11px] font-mono text-stone-400">Demo: admin@jklu</span>
              </div>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-[#1E3A68] focus:ring-2 focus:ring-[#1E3A68]/20 text-xs sm:text-sm text-stone-800 transition-all outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-stone-400 hover:text-stone-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl font-editorial font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] text-white bg-gradient-to-r from-[#1E3A68] to-[#2B4A7E] hover:from-[#162A4D] hover:to-[#20375E]"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-orange-400" />
                  <span>Enter Admin Control Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-blue-200/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Administration Gateway • JKLU Transport Cell</span>
          </div>
          <p className="text-[10px] text-blue-300/50 font-mono">
            JK Lakshmipat University • Ajmer Road, Jaipur, Rajasthan 302026
          </p>
        </div>
      </div>
    </div>
  );
};
