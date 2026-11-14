'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, 
  RotateCcw, 
  Terminal, 
  User, 
  Briefcase, 
  Globe,
  Check,
  Code2,
  FileText,
  MousePointerClick,
  ChevronRight,
  Shield,
  Layers,
  Sparkles
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
    name: 'Dr. Elena Rostova',
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
  freelance: {
    id: 'freelance',
    name: 'Marcus Vance',
    tagline: 'Cloud Architect & Consultant',
    fields: {
      fullName: 'Marcus Vance',
      email: 'marcus.vance@vance-cloud.dev',
      phone: '+1 (206) 555-0198',
      company: 'Vance Distributed Architectures',
      address: '1100 2nd Ave, Suite 400',
      city: 'Seattle, WA',
      postalCode: '98101',
      notes: 'Consulting rate: $185/hr • Verified open source contributor.',
    },
  },
};

type DemoMode = 'form' | 'snippets' | 'crossprofile';

export default function InteractiveDemo() {
  const [activeMode, setActiveMode] = useState<DemoMode>('form');
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
    'Stashfill Heuristic Matcher v1.0 initialized. 0 telemetry listeners attached.',
    'Form elements registered in DOM walker. Press Alt+Shift+F or click fill button.',
  ]);

  // Snippets state
  const [spinnerText, setSpinnerText] = useState<string>(
    'Hello team,\n\nHere is the weekly update for project Stashfill.\n\nType ;sig or ;date or ;uuid in this box to watch instant variable expansion in action!\n\nBest regards,\n;sig'
  );
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);

  // Cross Profile Context Menu simulation state
  const [contextInputVal, setContextInputVal] = useState<string>('');
  const [contextSource, setContextSource] = useState<string | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);
  const [scrubberSeconds, setScrubberSeconds] = useState<number | null>(null);

  const activeProfile = PROFILES[selectedProfileKey];

  // Autofill simulation
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
          `[RECONCILE] element[name="${key}"] -> prototype setter invoked -> synced React _valueTracker`,
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
      if (activeMode === 'form' && e.altKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        handleFill();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProfile, filling, activeMode]);

  // Snippet expansion helpers
  const expandSnippetText = (raw: string): string => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const yearStr = String(now.getFullYear());
    const randomUuid = '9f8e7d6c-' + Math.random().toString(16).substring(2, 6) + '-4a12-b34e-00' + Math.floor(Math.random() * 8999 + 1000);
    const randomNumber = String(Math.floor(Math.random() * 90000 + 10000));

    let replaced = raw;
    let didExpand = false;
    let triggerName = '';

    if (replaced.includes(';sig')) {
      replaced = replaced.replaceAll(';sig', `Alex Rivera\nSenior Frontend Engineer\nGitHub: @alex-rivera • © ${yearStr}`);
      didExpand = true;
      triggerName = ';sig';
    }
    if (replaced.includes(';date')) {
      replaced = replaced.replaceAll(';date', dateStr);
      didExpand = true;
      triggerName = ';date';
    }
    if (replaced.includes(';now') || replaced.includes(';datetime')) {
      replaced = replaced.replaceAll(';now', `${dateStr} ${timeStr}`).replaceAll(';datetime', `${dateStr} ${timeStr}`);
      didExpand = true;
      triggerName = ';datetime';
    }
    if (replaced.includes(';uuid')) {
      replaced = replaced.replaceAll(';uuid', randomUuid);
      didExpand = true;
      triggerName = ';uuid';
    }
    if (replaced.includes(';rnd')) {
      replaced = replaced.replaceAll(';rnd', randomNumber);
      didExpand = true;
      triggerName = ';rnd';
    }
    if (replaced.includes(';invoice')) {
      replaced = replaced.replaceAll(';invoice', `INVOICE #${randomNumber}\nDue Date: Net 30 (${dateStr})\nRemit to: Marcus Vance / Distributed Architectures\nStatus: Pending Wire`);
      didExpand = true;
      triggerName = ';invoice';
    }

    if (didExpand) {
      setExpandedNotice(`Trigger [${triggerName}] expanded instantaneously`);
      setLogs((prev) => [
        `[SNIPPET_EXPANDER] Trigger "${triggerName}" evaluated -> matched dynamic template -> buffer replaced in 0.6ms`,
        ...prev.slice(0, 4),
      ]);
      setTimeout(() => setExpandedNotice(null), 2500);
    }

    return replaced;
  };

  const handleSnippetTyping = (text: string) => {
    const expanded = expandSnippetText(text);
    setSpinnerText(expanded);
  };

  const insertSnippetToken = (token: string) => {
    const updated = spinnerText + (spinnerText.endsWith('\n') ? '' : '\n') + token;
    const expanded = expandSnippetText(updated);
    setSpinnerText(expanded);
  };

  // Cross profile paste helper
  const handleCrossProfilePaste = (profileName: string, fieldName: string, value: string) => {
    setContextInputVal(value);
    setContextSource(`${profileName} → ${fieldName}`);
    setContextMenuOpen(false);
    setHoveredSubmenu(null);
    setScrubberSeconds(15);
    setLogs((prev) => [
      `[CROSS_PROFILE] Retrieved "${fieldName}" from profile "${profileName}" without switching active profile. Dispatched synthetic input event.`,
      ...prev.slice(0, 4),
    ]);
  };

  // 15s Scrubber timer countdown simulation
  useEffect(() => {
    if (scrubberSeconds === null || scrubberSeconds <= 0) return;
    const timer = setInterval(() => {
      setScrubberSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [scrubberSeconds]);

  return (
    <section id="demo" className="py-24 relative overflow-hidden bg-white dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3">
              <Code2 className="w-3.5 h-3.5" />
              <span>Interactive DOM Sandbox</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Test Stashfill in real-time.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base mt-2">
              Experience authentic sub-50ms React autofill, dynamic snippet variable templating, and 1-click cross-profile access.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setActiveMode('form')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeMode === 'form'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Form Autofill</span>
            </button>

            <button
              onClick={() => setActiveMode('snippets')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeMode === 'snippets'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Snippet Expander</span>
            </button>

            <button
              onClick={() => setActiveMode('crossprofile')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeMode === 'crossprofile'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Cross-Profile Menu</span>
            </button>
          </div>
        </div>

        {/* Sandbox Window */}
        <div className="max-w-5xl mx-auto rounded-xl tech-card shadow-xl overflow-hidden border border-zinc-300 dark:border-zinc-800">
          
          {/* Top Control Bar with Segmented Profiles (Form Mode) */}
          {activeMode === 'form' && (
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
                  onClick={() => { setSelectedProfileKey('freelance'); handleReset(); }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all ${
                    selectedProfileKey === 'freelance'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Consultant</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  disabled={filling}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={handleFill}
                  disabled={filling}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-semibold font-mono flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Zap className={`w-3.5 h-3.5 ${filling ? 'animate-spin' : ''}`} />
                  <span>{filling ? 'Filling...' : 'Trigger Fill (Alt+Shift+F)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Top Control Bar (Snippet Mode) */}
          {activeMode === 'snippets' && (
            <div className="p-3 bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[11px]">Click trigger chip to expand:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { token: ';sig', label: 'Signature' },
                    { token: ';date', label: 'Date' },
                    { token: ';now', label: 'Timestamp' },
                    { token: ';uuid', label: 'UUID v4' },
                    { token: ';rnd', label: 'Random #' },
                    { token: ';invoice', label: 'Invoice' },
                  ].map((chip) => (
                    <button
                      key={chip.token}
                      onClick={() => insertSnippetToken(chip.token)}
                      className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-semibold border border-zinc-300 dark:border-zinc-700 transition-colors"
                    >
                      {chip.token}
                    </button>
                  ))}
                </div>
              </div>

              {expandedNotice && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  <span>{expandedNotice}</span>
                </div>
              )}
            </div>
          )}

          {/* Top Control Bar (Cross Profile Mode) */}
          {activeMode === 'crossprofile' && (
            <div className="p-3 bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Direct Context Submenu Simulation
                </span>
                <span className="text-zinc-500 text-[11px] hidden sm:inline">
                  — Right-click inside the field to paste any profile without switching
                </span>
              </div>

              {scrubberSeconds !== null && (
                <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-mono flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  <span>Clipboard scrubber active: {scrubberSeconds}s</span>
                </div>
              )}
            </div>
          )}

          {/* Surface: 1. Form Mode */}
          {activeMode === 'form' && (
            <div className="p-6 sm:p-8 bg-white dark:bg-[#0c0e14]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                      name / legal_name
                    </label>
                    {filledFields.has('fullName') && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Reconciled
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
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
                      email / primary_email
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
                      phone / contact_tel
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
                      company / organization
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
                      street_address / billing_street
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
                      city / locality
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
                      postal_code / zip_code
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
          )}

          {/* Surface: 2. Snippet Expander Mode */}
          {activeMode === 'snippets' && (
            <div className="p-6 sm:p-8 bg-white dark:bg-[#0c0e14] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500">
                  Type dynamic trigger tokens (<code className="text-emerald-600 dark:text-emerald-400 font-bold">;sig</code>, <code className="text-emerald-600 dark:text-emerald-400 font-bold">;date</code>, <code className="text-emerald-600 dark:text-emerald-400 font-bold">;uuid</code>, <code className="text-emerald-600 dark:text-emerald-400 font-bold">;bangla</code>) anywhere:
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Auto-expands on trigger keystroke
                </span>
              </div>

              <textarea
                rows={8}
                value={spinnerText}
                onChange={(e) => handleSnippetTyping(e.target.value)}
                className="w-full p-4 rounded-lg font-mono text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 transition-all leading-relaxed"
                placeholder="Type your notes or trigger codes here..."
              />

              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Inline Token Matcher: Active</span>
                </div>
                <button
                  onClick={() => setSpinnerText('Type ;sig or ;date or ;uuid in this box!')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  Clear Playground
                </button>
              </div>
            </div>
          )}

          {/* Surface: 3. Cross Profile Context Menu Mode */}
          {activeMode === 'crossprofile' && (
            <div className="p-6 sm:p-8 bg-white dark:bg-[#0c0e14] space-y-6">
              
              <div className="max-w-xl mx-auto space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
                    <MousePointerClick className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Target Input Field (Right-click or click button)</span>
                  </label>
                  {contextSource && (
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                      Pasted from: {contextSource}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={contextInputVal}
                    onChange={(e) => setContextInputVal(e.target.value)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuOpen(true);
                    }}
                    placeholder="Right click here or click 'Open Stashfill Submenu' →"
                    className="w-full px-4 py-3 rounded-lg font-mono text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                  />

                  <button
                    onClick={() => setContextMenuOpen(!contextMenuOpen)}
                    className="absolute right-2 top-2 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <span>Context Menu</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  {/* Simulated Native OS / Browser Context Menu */}
                  {contextMenuOpen && (
                    <div 
                      className="absolute left-6 top-12 z-50 w-64 rounded-xl tech-card shadow-2xl p-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#12141c] text-xs font-mono animate-fade-in"
                      onMouseLeave={() => { setContextMenuOpen(false); setHoveredSubmenu(null); }}
                    >
                      <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <span>Browser Context Menu</span>
                        <span className="text-emerald-500">Stashfill</span>
                      </div>

                      <div className="py-1">
                        {/* Submenu for Personal */}
                        <div 
                          className="relative"
                          onMouseEnter={() => setHoveredSubmenu('personal')}
                        >
                          <div className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${hoveredSubmenu === 'personal' ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                            <span className="flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              <span>Personal Profile</span>
                            </span>
                            <ChevronRight className="w-3 h-3" />
                          </div>

                          {hoveredSubmenu === 'personal' && (
                            <div className="absolute left-full top-0 ml-1 w-56 rounded-xl tech-card shadow-2xl p-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#151722] z-50">
                              <div className="px-2 py-1 text-[10px] text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                                1-Click Paste Field:
                              </div>
                              {Object.entries(PROFILES.personal.fields).slice(0, 4).map(([fKey, fVal]) => (
                                <button
                                  key={fKey}
                                  onClick={() => handleCrossProfilePaste('Personal', fKey, fVal)}
                                  className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs flex items-center justify-between"
                                >
                                  <span className="capitalize">{fKey}</span>
                                  <span className="text-[10px] text-zinc-400 truncate max-w-[90px]">{fVal}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Submenu for Enterprise */}
                        <div 
                          className="relative"
                          onMouseEnter={() => setHoveredSubmenu('work')}
                        >
                          <div className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${hoveredSubmenu === 'work' ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3" />
                              <span>Enterprise Profile</span>
                            </span>
                            <ChevronRight className="w-3 h-3" />
                          </div>

                          {hoveredSubmenu === 'work' && (
                            <div className="absolute left-full top-0 ml-1 w-56 rounded-xl tech-card shadow-2xl p-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#151722] z-50">
                              <div className="px-2 py-1 text-[10px] text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                                1-Click Paste Field:
                              </div>
                              {Object.entries(PROFILES.work.fields).slice(0, 4).map(([fKey, fVal]) => (
                                <button
                                  key={fKey}
                                  onClick={() => handleCrossProfilePaste('Enterprise', fKey, fVal)}
                                  className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs flex items-center justify-between"
                                >
                                  <span className="capitalize">{fKey}</span>
                                  <span className="text-[10px] text-zinc-400 truncate max-w-[90px]">{fVal}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Submenu for Freelance / Consultant */}
                        <div 
                          className="relative"
                          onMouseEnter={() => setHoveredSubmenu('freelance')}
                        >
                          <div className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${hoveredSubmenu === 'freelance' ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                            <span className="flex items-center gap-1.5">
                              <Globe className="w-3 h-3" />
                              <span>Consultant Profile</span>
                            </span>
                            <ChevronRight className="w-3 h-3" />
                          </div>

                          {hoveredSubmenu === 'freelance' && (
                            <div className="absolute left-full top-0 ml-1 w-56 rounded-xl tech-card shadow-2xl p-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#151722] z-50">
                              <div className="px-2 py-1 text-[10px] text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                                1-Click Paste Field:
                              </div>
                              {Object.entries(PROFILES.freelance.fields).slice(0, 4).map(([fKey, fVal]) => (
                                <button
                                  key={fKey}
                                  onClick={() => handleCrossProfilePaste('Consultant', fKey, fVal)}
                                  className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs flex items-center justify-between"
                                >
                                  <span className="capitalize">{fKey}</span>
                                  <span className="text-[10px] text-zinc-400 truncate max-w-[90px]">{fVal}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-1 mt-1 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 px-2 py-1">
                          Esc to close menu
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-500">
                  💡 In any web form, you can right-click any input to access submenus for every saved profile, pasting fields instantly without switching active identities.
                </div>
              </div>

            </div>
          )}

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
