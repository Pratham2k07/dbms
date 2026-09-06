import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, Shield, User, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginUser } = useApp();

  const [selectedRole, setSelectedRole] = useState<'student' | 'driver'>('student');
  const [email, setEmail] = useState<string>('pratham.lalwani@jklu.edu.in');
  const [password, setPassword] = useState<string>('jklu@2024');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleRoleChange = (role: 'student' | 'driver') => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'student') {
      setEmail('pratham.lalwani@jklu.edu.in');
      setPassword('jklu@2024');
    } else {
      setEmail('ramesh.kumar@jklu.edu.in');
      setPassword('driver@8821');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your university email address or driver ID.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    // Realistic brief authorization handshake
    setTimeout(() => {
      setIsLoading(false);
      loginUser(email, password, selectedRole);
    }, 600);
  };

  const handleQuickDemo = (role: 'student' | 'driver') => {
    handleRoleChange(role);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (role === 'student') {
        loginUser('pratham.lalwani@jklu.edu.in', 'jklu@2024', 'student');
      } else {
        loginUser('ramesh.kumar@jklu.edu.in', 'driver@8821', 'driver');
      }
    }, 450);
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-gradient-to-b from-[#EDF3FC]/60 via-[#F8FAFC] to-[#FBFBF9]">
      {/* Background Subtle Geometric Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#6686C6_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* Official JKLU University Logo */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white p-2 border border-blue-100/90 shadow-xl flex items-center justify-center overflow-hidden">
            <img src="/jklu-logo.png" alt="JKLU University Logo" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="font-editorial font-black text-2xl sm:text-3xl text-[#1E3A68] tracking-tight">
                JKLU SHUTTLE
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#E8590C]/10 text-[#E8590C] border border-[#E8590C]/20 uppercase">
                Auth
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              University Mobility & Campus Transit Portal
            </p>
          </div>
        </div>

        {/* Floating Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-100/80 space-y-5">
          {/* Dual Role Tabs */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400 block text-center">
              Select Your University Role
            </label>

            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#EDF3FC] border border-blue-100">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`py-2.5 px-3 rounded-xl text-xs font-editorial font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'student'
                    ? 'bg-white text-[#2B4A7E] shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <User className={`w-3.5 h-3.5 ${selectedRole === 'student' ? 'text-jklu-orange' : 'text-stone-400'}`} />
                <span>Student Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('driver')}
                className={`py-2.5 px-3 rounded-xl text-xs font-editorial font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'driver'
                    ? 'bg-[#E8590C] text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Shield className={`w-3.5 h-3.5 ${selectedRole === 'driver' ? 'text-white' : 'text-stone-400'}`} />
                <span>Driver Portal</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-editorial font-bold text-stone-700 block">
                {selectedRole === 'student' ? 'University Email' : 'Driver / Staff Email or ID'}
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === 'student'
                      ? 'pratham.lalwani@jklu.edu.in'
                      : 'ramesh.kumar@jklu.edu.in'
                  }
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FBFBF9] border border-stone-200 focus:border-[#4F70B0] focus:ring-2 focus:ring-[#4F70B0]/20 text-xs sm:text-sm text-stone-800 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-editorial font-bold text-stone-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Demo notice: Default password is pre-filled. You can also click the 1-Click Demo buttons below.')}
                  className="text-[11px] text-[#4F70B0] hover:underline font-medium"
                >
                  Forgot?
                </button>
              </div>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#FBFBF9] border border-stone-200 focus:border-[#4F70B0] focus:ring-2 focus:ring-[#4F70B0]/20 text-xs sm:text-sm text-stone-800 transition-all outline-none font-medium"
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
              className={`w-full py-3.5 px-4 rounded-xl font-editorial font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] text-white ${
                selectedRole === 'driver'
                  ? 'bg-[#E8590C] hover:bg-[#D9480F]'
                  : 'bg-[#2B4A7E] hover:bg-[#20375E]'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>
                    Sign In to {selectedRole === 'student' ? 'Student Portal' : 'Driver Dashboard'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-jklu-orange" />
                <span>1-CLICK DEMO ACCESS:</span>
              </span>
              <span>TEST PORTALS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="p-2.5 rounded-xl bg-[#EDF3FC] hover:bg-blue-100/70 border border-blue-200/80 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-editorial font-bold text-[#2B4A7E]">
                    Student Portal
                  </span>
                  <ArrowRight className="w-3 h-3 text-[#4F70B0] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[10px] text-stone-500 truncate mt-0.5">
                  Pratham (B.Tech CSE)
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('driver')}
                className="p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100/70 border border-orange-200/80 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-editorial font-bold text-[#E8590C]">
                    Driver Portal
                  </span>
                  <ArrowRight className="w-3 h-3 text-[#E8590C] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[10px] text-stone-500 truncate mt-0.5">
                  Ramesh (RJ-14-PA-8821)
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Official Footer */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-stone-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Campus SSO Handshake • JKLU Net</span>
          </div>
          <p className="text-[10px] text-stone-400 font-mono">
            JK Lakshmipat University • Ajmer Road, Jaipur, Rajasthan 302026
          </p>
        </div>
      </div>
    </div>
  );
};
