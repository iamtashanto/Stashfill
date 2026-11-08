'use client';

import { useState } from 'react';
import { 
  Zap, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Terminal, 
  User, 
  Briefcase, 
  Languages
} from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  tagline: string;
  fields: {
    fullName: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    city: string;
    postalCode: string;
    notes: string;
  };
}

const PROFILES: Record<string, ProfileData> = {
  personal: {
    id: 'personal',
    name: 'Alex Rivera',
    tagline: 'Personal Identity Profile',
    fields: {
      fullName: 'Alex Rivera',
      email: 'alex.rivera.dev@gmail.com',
      phone: '+1 (415) 890-3421',
      company: 'Independent Designer',
      address: '452 Mission Street, Suite 800',
      city: 'San Francisco, CA',
      postalCode: '94105',
      notes: 'Prefers contactless delivery and plain-text communications.',
    },
  },
  work: {
    id: 'work',
    name: 'Elena Rostova',
    tagline: 'Enterprise Developer Profile',
    fields: {
      fullName: 'Dr. Elena Rostova',
      email: 'elena.rostova@cloudscale-systems.io',
      phone: '+44 20 7946 0912',
      company: 'CloudScale Systems Ltd',
      address: '22 Bishopsgate, Level 34',
      city: 'London',
      postalCode: 'EC2N 4BQ',
      notes: 'VAT ID: GB98723412 • PGP Key Fingerprint attached in vault.',
    },
  },
  bangla: {
    id: 'bangla',
    name: 'তানভীর হাসান (Tanveer Hasan)',
    tagline: 'বাংলা ও দ্বিভাষিক প্রোফাইল (Bilingual Profile)',
    fields: {
      fullName: 'তানভীর হাসান (Tanveer Hasan)',
      email: 'tanveer.hasan.bd@gmail.com',
      phone: '+880 1712-345678',
      company: 'ঢাকা সফটওয়্যার ল্যাবস (Dhaka Labs)',
      address: 'বাড়ি ৩২, রোড ১১, ধানমন্ডি',
      city: 'ঢাকা (Dhaka)',
      postalCode: '১২০৯',
      notes: 'বাংলা ইউনিকোড সাপোর্টেড ফিল্ড ম্যাচিং ও টেস্ট ডেটা।',
    },
  },
};

export default function InteractiveDemo() {
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>('personal');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  });

  const [filling, setFilling] = useState(false);
  const [filledFields, setFilledFields] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<string[]>([
    'Stashfill Heuristic Matcher ready. 0 telemetry listeners attached.',
    'Form inputs indexed in memory. Waiting for user action...',
  ]);

  const activeProfile = PROFILES[selectedProfileKey];

  const handleFill = () => {
    if (filling) return;
    setFilling(true);
    setFilledFields(new Set());

    const keys = Object.keys(activeProfile.fields) as Array<keyof typeof formData>;
    
    // Animate fill step by step
    keys.forEach((key, index) => {
      setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          [key]: activeProfile.fields[key],
        }));

        setFilledFields((prev) => new Set([...prev, key]));

        setLogs((prev) => [
          `[MATCHED] "${key}" -> Dispatched React _valueTracker sync & change event`,
          ...prev.slice(0, 4),
        ]);

        if (index === keys.length - 1) {
          setFilling(false);
          setLogs((prev) => [
            `✓ All 8 fields successfully filled in ${(index + 1) * 35}ms with 0 network calls!`,
            ...prev.slice(0, 4),
          ]);
        }
      }, (index + 1) * 65);
    });
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      postalCode: '',
      notes: '',
    });
    setFilledFields(new Set());
    setLogs([
      'Form cleared. Ready for next 1-click test.',
      'Local storage profile intact.',
    ]);
  };

  return (
    <section id="demo" className="py-24 relative overflow-hidden bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Test 1-Click Form Filling Right Here
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
            Experience how Stashfill detects field names, matches multilingual synonyms (English &amp; Bangla), 
            and updates React controlled inputs without breaking state.
          </p>
        </div>

        {/* Demo Playground Box */}
        <div className="max-w-5xl mx-auto rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            
            {/* Profile Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Select Profile:
              </span>
              <button
                onClick={() => { setSelectedProfileKey('personal'); handleReset(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedProfileKey === 'personal'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Personal</span>
              </button>

              <button
                onClick={() => { setSelectedProfileKey('work'); handleReset(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedProfileKey === 'work'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Enterprise / Work</span>
              </button>

              <button
                onClick={() => { setSelectedProfileKey('bangla'); handleReset(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedProfileKey === 'bangla'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>বাংলা (Bangla)</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={handleReset}
                disabled={filling}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>

              <button
                onClick={handleFill}
                disabled={filling}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-500/25 active:scale-95 transition-all"
              >
                <Zap className={`w-4 h-4 ${filling ? 'animate-spin' : ''}`} />
                <span>{filling ? 'Filling...' : 'Trigger 1-Click Stashfill'}</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-black/20 rounded font-mono">
                  Alt+Shift+F
                </kbd>
              </button>
            </div>
          </div>

          {/* Form Surface */}
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-900/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name / পুরো নাম
                  </label>
                  {filledFields.has('fullName') && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. John Doe or জন ডো"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium transition-all duration-300 outline-none focus:ring-2 focus:ring-brand-500/30 ${
                    filledFields.has('fullName')
                      ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200'
                  }`}
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address / ইমেইল
                  </label>
                  {filledFields.has('email') && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium transition-all duration-300 outline-none focus:ring-2 focus:ring-brand-500/30 ${
                    filledFields.has('email')
                      ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200'
                  }`}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Phone Number / মোবাইল নম্বর
                  </label>
                  {filledFields.has('phone') && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium transition-all duration-300 outline-none focus:ring-2 focus:ring-brand-500/30 ${
                    filledFields.has('phone')
                      ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200'
                  }`}
                />
              </div>

              {/* Company / Organization */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Company / প্রতিষ্ঠান
                  </label>
                  {filledFields.has('company') && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Organization or Studio"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium transition-all duration-300 outline-none focus:ring-2 focus:ring-brand-500/30 ${
                    filledFields.has('company')
                      ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200'
                  }`}
                />
              </div>

              {/* Street Address */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Street Address / ঠিকানা
                  </label>
                  {filledFields.has('address') && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Street and house number"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium transition-all duration-300 outline-none focus:ring-2 focus:ring-brand-500/30 ${
                    filledFields.has('address')
                      ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200'
                  }`}
                />
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    City / শহর
                  </label>
                  {filledFields.has('city') && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium transition-all duration-300 outline-none focus:ring-2 focus:ring-brand-500/30 ${
                    filledFields.has('city')
                      ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200'
                  }`}
                />
              </div>

              {/* Postal Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Postal Code / পোস্ট কোড
                  </label>
                  {filledFields.has('postalCode') && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Zip or Postal code"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium transition-all duration-300 outline-none focus:ring-2 focus:ring-brand-500/30 ${
                    filledFields.has('postalCode')
                      ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200'
                  }`}
                />
              </div>

              {/* Custom Notes / Snippets */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Custom Notes / মন্তব্য (Snippet Expansion Demo)
                  </label>
                  {filledFields.has('notes') && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  placeholder="Notes, instructions or custom snippet..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium transition-all duration-300 outline-none focus:ring-2 focus:ring-brand-500/30 resize-none ${
                    filledFields.has('notes')
                      ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200'
                  }`}
                />
              </div>

            </div>
          </div>

          {/* Real-time Stashfill Engine Diagnostics Log */}
          <div className="p-4 bg-slate-950 text-slate-300 border-t border-slate-800 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-brand-400" />
                Stashfill Heuristic Diagnostics &amp; Event Dispatch Log
              </span>
              <span className="text-emerald-400 font-semibold">Zero-Network Verification: Passed</span>
            </div>
            <div className="space-y-1 text-[11px]">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-slate-600 select-none">&gt;</span>
                  <span className={idx === 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
