import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, Shield, User, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

type UserRole = 'driver' | 'student' | 'admin';

export const LoginScreen: React.FC = () => {
  const { loginUser } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [email, setEmail] = useState<string>('pratham.lalwani@jklu.edu.in');
  const [password, setPassword] = useState<string>('jklu@2024');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'driver') {
      setEmail('ramesh.kumar@jklu.edu.in');
      setPassword('driver@8821');
    } else if (role === 'student') {
      setEmail('pratham.lalwani@jklu.edu.in');
      setPassword('jklu@2024');
    } else if (role === 'admin') {
      setEmail('admin@jklu.edu.in');
      setPassword('admin@jklu');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage(`Please enter your ${selectedRole} email address or ID.`);
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
    }, 500);
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
          {/* 3 Role Options: Driver, Student, Admin */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400 block text-center">
              Select Your Portal Role
            </label>

            <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#EDF3FC] border border-blue-100 gap-1">
              {/* Option 1: Driver */}
              <button
                type="button"
                onClick={() => handleRoleChange('driver')}
                className={`py-2.5 px-2 rounded-xl text-xs font-editorial font-bold flex items-center justify-center gap-1.5 transition-all ${
                  selectedRole === 'driver'
                    ? 'bg-[#E8590C] text-white shadow-sm ring-1 ring-[#E8590C]/30'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <Shield className={`w-3.5 h-3.5 ${selectedRole === 'driver' ? 'text-white' : 'text-stone-400'}`} />
                <span className="truncate">Driver</span>
              </button>

              {/* Option 2: Student */}
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`py-2.5 px-2 rounded-xl text-xs font-editorial font-bold flex items-center justify-center gap-1.5 transition-all ${
                  selectedRole === 'student'
                    ? 'bg-[#2B4A7E] text-white shadow-sm ring-1 ring-[#2B4A7E]/30'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <User className={`w-3.5 h-3.5 ${selectedRole === 'student' ? 'text-white' : 'text-stone-400'}`} />
                <span className="truncate">Student</span>
              </button>

              {/* Option 3: Admin */}
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`py-2.5 px-2 rounded-xl text-xs font-editorial font-bold flex items-center justify-center gap-1.5 transition-all ${
                  selectedRole === 'admin'
                    ? 'bg-[#0F1E36] text-white shadow-sm ring-1 ring-[#0F1E36]/30'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${selectedRole === 'admin' ? 'text-white' : 'text-stone-400'}`} />
                <span className="truncate">Admin</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-editorial font-bold text-stone-700 block">
                {selectedRole === 'driver' && 'Driver / Staff Email or ID'}
                {selectedRole === 'student' && 'University Student Email'}
                {selectedRole === 'admin' && 'Administrator Official Email or ID'}
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === 'driver'
                      ? 'ramesh.kumar@jklu.edu.in'
                      : selectedRole === 'admin'
                      ? 'admin@jklu.edu.in'
                      : 'pratham.lalwani@jklu.edu.in'
                  }
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FBFBF9] border border-stone-200 focus:border-[#4F70B0] focus:ring-2 focus:ring-[#4F70B0]/20 text-xs sm:text-sm text-stone-800 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-editorial font-bold text-stone-700 block">
                Password
              </label>

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
                  : selectedRole === 'admin'
                  ? 'bg-[#0F1E36] hover:bg-[#1E3A68]'
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
                    {selectedRole === 'driver' && 'Sign In to Driver Dashboard'}
                    {selectedRole === 'student' && 'Sign In to Student Portal'}
                    {selectedRole === 'admin' && 'Enter Admin Control Center'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
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
