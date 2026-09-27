'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Leaf,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Globe
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, registerWithEmail, isAuthenticated, userProfile } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [farmName, setFarmName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [crop, setCrop] = useState<string>('Rice / Paddy');
  const [farmSize, setFarmSize] = useState<string>('5 Acres');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          throw new Error('Please enter both your email address and password.');
        }
        await loginWithEmail(email, password);
        setSuccessMsg(lang === 'hi' ? 'सफलतापूर्वक लॉगिन हो गया!' : 'Successfully signed in!');
        setTimeout(() => {
          router.push('/profile');
        }, 800);
      } else {
        if (!email || !password || !displayName) {
          throw new Error('Please enter your name, email address, and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        await registerWithEmail({
          email,
          password,
          displayName,
          phoneNumber,
          farmName: farmName || 'Primary Farm Sector',
          location: location || 'Dabok, Udaipur',
          crop,
          farmSize,
        });

        setSuccessMsg(
          lang === 'hi'
            ? 'खाता सफलतापूर्वक बनाया गया! प्रोफ़ाइल पर भेजा जा रहा है...'
            : 'Account created and saved to cloud! Redirecting to Profile...'
        );
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err.code || err.message;
      if (code?.includes('user-not-found') || code?.includes('wrong-password') || code?.includes('invalid-credential')) {
        setErrorMsg('Invalid email or password credentials. Please try again.');
      } else if (code?.includes('email-already-in-use')) {
        setErrorMsg('An account with this email already exists. Please switch to Sign In.');
      } else if (code?.includes('weak-password')) {
        setErrorMsg('Password should be at least 6 characters.');
      } else {
        setErrorMsg(err.message || 'Authentication encountered an issue. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-4 py-8 max-w-md mx-auto w-full">
      {/* Top Language Toggle */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="h-8 px-3 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-headline text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}</span>
        </button>
      </div>

      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white text-2xl shadow-md mb-3 ring-4 ring-emerald-100">
          🌱
        </div>
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {mode === 'login'
            ? lang === 'hi'
              ? 'खाते में लॉगिन करें'
              : 'Sign in to AgroEye'
            : lang === 'hi'
            ? 'नया किसान खाता बनाएं'
            : 'Create Farm Account'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {mode === 'login'
            ? 'Access your live telemetry, field sensors, and AI vision'
            : 'Register your farm plot for edge AI detection and live monitoring'}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-7 space-y-5">
        {/* Toggle Mode Segment */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl font-headline text-xs font-bold transition-all ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'साइन इन (Login)' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl font-headline text-xs font-bold transition-all ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'रजिस्टर (Register)' : 'Create Account'}
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Registration specific fields */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block font-headline text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'किसान / ऑपरेटर का पूरा नाम' : 'Farmer / Operator Full Name'} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sardar Baldev Singh"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-headline text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'मोबाइल नंबर' : 'Phone / Mobile Number'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-headline text-xs font-bold text-slate-700 mb-1">
                    {lang === 'hi' ? 'खेत का नाम' : 'Farm Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dabok Rice Field"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-headline text-xs font-bold text-slate-700 mb-1">
                    {lang === 'hi' ? 'स्थान / जिला' : 'Location / District'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dabok, Udaipur"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-headline text-xs font-bold text-slate-700 mb-1">
                    {lang === 'hi' ? 'मुख्य फसल' : 'Primary Crop'}
                  </label>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Rice / Paddy">Rice / Paddy</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Maize / Corn">Maize / Corn</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Mustard">Mustard</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Tomato & Vegetables">Tomato & Vegetables</option>
                  </select>
                </div>
                <div>
                  <label className="block font-headline text-xs font-bold text-slate-700 mb-1">
                    {lang === 'hi' ? 'खेत का क्षेत्रफल' : 'Farm Acreage'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Acres"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="block font-headline text-xs font-bold text-slate-700 mb-1">
              {lang === 'hi' ? 'ईमेल पता' : 'Email Address'} *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="farmer@agroeye.farm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-headline text-xs font-bold text-slate-700 mb-1">
              {lang === 'hi' ? 'पासवर्ड' : 'Password'} *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-9 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 mt-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{mode === 'login' ? 'Signing In...' : 'Registering Account...'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>
                  {mode === 'login'
                    ? lang === 'hi'
                      ? 'लॉगिन करें'
                      : 'Sign In to Dashboard'
                    : lang === 'hi'
                    ? 'खाता रजिस्टर करें'
                    : 'Register & Save Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Cloud Persistence Badge */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured with Firebase Realtime Cloud Ingest</span>
        </div>
      </div>
    </div>
  );
}
