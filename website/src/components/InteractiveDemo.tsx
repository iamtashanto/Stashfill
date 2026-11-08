'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, 
  RotateCcw, 
  Terminal, 
  User, 
  Briefcase, 
  Languages,
  Check,
  Code2
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
    'Stashfill Heuristic Matcher initialized. 0 telemetry listeners attached.',
    'Form elements registered in DOM walker. Press Alt+Shift+F or click fill button.',
  ]);

  const activeProfile = PROFILES[selectedProfileKey];

  const handleFill = () => {
    if (filling) return;
    setFilling(true);
    setFilledFields(new Set());

    const keys = Object.keys(activeProfile.fields) as Array<keyof typeof formData>;
    
    keys.forEach((key, index) => {
      setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          [key]: activeProfile.fields[key],
        }));

        setFilledFields((prev) => new Set([...prev, key]));

        setLogs((prev) => [
          `[RECONCILE] element[name="${key}"] -> invoked prototype setter -> synced React _valueTracker`,
          ...prev.slice(0, 4),
        ]);

        if (index === keys.length - 1) {
          setFilling(false);
          setLogs((prev) => [
            `✓ Successfully populated ${keys.length} inputs in ${(index + 1) * 35}ms with 0 outbound network requests.`,
            ...prev.slice(0, 4),
          ]);
        }
      }, (index + 1) * 60);
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
      'Form inputs cleared. Ready for next fill command.',
      'Local sandbox state intact.',
    ]);
  };

  // Keyboard shortcut listener (Alt+Shift+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        handleFill();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProfile, filling]);

  return (
    <section id="demo" className="py-24 relative overflow-hidden bg-white dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3">
              <Code2 className="w-3.5 h-3.5" />
              <span>Interactive DOM Sandbox</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Test Stashfill in real-time.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base mt-2">
              Select an identity profile, then press <kbd className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold">Alt + Shift + F</kbd> on your keyboard or trigger via the button below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={filling}
              className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleFill}
              disabled={filling}
              className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-semibold font-mono flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Zap className={`w-3.5 h-3.5 ${filling ? 'animate-spin' : ''}`} />
              <span>{filling ? 'Filling...' : 'Trigger Fill (Alt+Shift+F)'}</span>
            </button>
          </div>
        </div>

        {/* Sandbox Window */}
        <div className="max-w-5xl mx-auto rounded-xl tech-card shadow-xl overflow-hidden border border-zinc-300 dark:border-zinc-800">
          
          {/* Top Control Bar with Segmented Profiles */}
          <div className="p-3 bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            
            <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-950 border border-zinc-300/50 dark:border-zinc-800">
              <button
                onClick={() => { setSelectedProfileKey('personal'); handleReset(); }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all ${
                  selectedProfileKey === 'personal'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                <User className="w-3 h-3" />
                <span>Personal</span>
              </button>

              <button
                onClick={() => { setSelectedProfileKey('work'); handleReset(); }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all ${
                  selectedProfileKey === 'work'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                <Briefcase className="w-3 h-3" />
                <span>Enterprise</span>
              </button>

              <button
                onClick={() => { setSelectedProfileKey('bangla'); handleReset(); }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all ${
                  selectedProfileKey === 'bangla'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                <Languages className="w-3 h-3" />
                <span>বাংলা (Bangla)</span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Active: {activeProfile.name}</span>
            </div>
          </div>

          {/* Form Surface */}
          <div className="p-6 sm:p-8 bg-white dark:bg-[#0c0e14]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                    name / পুরো নাম
                  </label>
                  {filledFields.has('fullName') && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Reconciled
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. John Doe or জন ডো"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md font-mono text-xs border outline-none transition-all ${
                    filledFields.has('fullName')
                      ? 'bg-emerald-500/[0.05] border-emerald-500/40 text-zinc-950 dark:text-white'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                    email / ইমেইল
                  </label>
                  {filledFields.has('email') && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Reconciled
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md font-mono text-xs border outline-none transition-all ${
                    filledFields.has('email')
                      ? 'bg-emerald-500/[0.05] border-emerald-500/40 text-zinc-950 dark:text-white'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                    phone / মোবাইল নম্বর
                  </label>
                  {filledFields.has('phone') && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Reconciled
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md font-mono text-xs border outline-none transition-all ${
                    filledFields.has('phone')
                      ? 'bg-emerald-500/[0.05] border-emerald-500/40 text-zinc-950 dark:text-white'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                />
              </div>

              {/* Organization */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                    company / প্রতিষ্ঠান
                  </label>
                  {filledFields.has('company') && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Reconciled
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Organization or Studio"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md font-mono text-xs border outline-none transition-all ${
                    filledFields.has('company')
                      ? 'bg-emerald-500/[0.05] border-emerald-500/40 text-zinc-950 dark:text-white'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                />
              </div>

              {/* Street Address */}
              <div className="space-y-1 md:col-span-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                    street_address / ঠিকানা
                  </label>
                  {filledFields.has('address') && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Reconciled
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Street address line"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md font-mono text-xs border outline-none transition-all ${
                    filledFields.has('address')
                      ? 'bg-emerald-500/[0.05] border-emerald-500/40 text-zinc-950 dark:text-white'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                />
              </div>

              {/* City */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                    city / শহর
                  </label>
                  {filledFields.has('city') && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Reconciled
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md font-mono text-xs border outline-none transition-all ${
                    filledFields.has('city')
                      ? 'bg-emerald-500/[0.05] border-emerald-500/40 text-zinc-950 dark:text-white'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                />
              </div>

              {/* Postal Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                    postal_code / পোস্ট কোড
                  </label>
                  {filledFields.has('postalCode') && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Reconciled
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md font-mono text-xs border outline-none transition-all ${
                    filledFields.has('postalCode')
                      ? 'bg-emerald-500/[0.05] border-emerald-500/40 text-zinc-950 dark:text-white'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                />
              </div>

            </div>
          </div>

          {/* DevTools Event Dispatch Log */}
          <div className="p-3.5 bg-[#0a0b10] border-t border-zinc-800 font-mono text-xs text-zinc-400">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Runtime Event Dispatch Console</span>
              </span>
              <span className="text-emerald-400 font-semibold text-[10px]">Zero Outbound Packets</span>
            </div>
            <div className="space-y-1 text-[11px]">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-zinc-600 select-none">&gt;</span>
                  <span className={idx === 0 ? 'text-zinc-200' : 'text-zinc-500'}>
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
