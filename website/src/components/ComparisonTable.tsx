'use client';

import { Check, X, Sparkles } from 'lucide-react';

interface ComparisonFeature {
  name: string;
  description: string;
  stashfill: boolean | string;
  browserAutofill: boolean | string;
  cloudManagers: boolean | string;
  fakeFiller: boolean | string;
}

const COMPARISON_DATA: ComparisonFeature[] = [
  {
    name: '100% Offline (Zero Network Telemetry)',
    description: 'Never transmits data to external servers or cloud infrastructure.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: false,
    fakeFiller: true,
  },
  {
    name: 'No Account or Registration Required',
    description: 'Works instantly without email signup, passwords, or mandatory login.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: false,
    fakeFiller: true,
  },
  {
    name: 'Real Personal Data Profiles',
    description: 'Stores and populates your verified personal, work, and custom identity fields.',
    stashfill: true,
    browserAutofill: 'Limited',
    cloudManagers: true,
    fakeFiller: false, // only fake dummy text
  },
  {
    name: 'React 18/19 & Vue v-model State Sync',
    description: 'Overrides value tracker descriptors to notify modern JS frameworks.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: 'Partial',
    fakeFiller: 'Partial',
  },
  {
    name: 'Shadow DOM & Nested Iframe Traversal',
    description: 'Recursively walks shadow roots to find inputs on complex SaaS portals.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: 'Partial',
    fakeFiller: 'Partial',
  },
  {
    name: 'AES-GCM 256-Bit Encrypted Vault',
    description: 'Seals sensitive cards and credentials with PBKDF2 (600,000 rounds).',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: true,
    fakeFiller: false,
  },
  {
    name: 'Dynamic Snippet Variables (e.g. {{date}})',
    description: 'Insert reusable templates with live date, time, and cursor expansion.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: false,
    fakeFiller: false,
  },
  {
    name: 'Bilingual Support (English & Bangla)',
    description: 'Native heuristic synonym dictionary recognizing বাংলা and English tokens.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: false,
    fakeFiller: false,
  },
  {
    name: '100% Free & Open Source (MIT)',
    description: 'Auditable code with zero paywalls, tiers, or commercial tracking.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: false,
    fakeFiller: true,
  },
];

export default function ComparisonTable() {
  return (
    <section id="comparison" className="py-24 relative overflow-hidden bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Honest Evaluation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            How Stashfill Compares
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
            See why privacy advocates, QA engineers, and everyday users prefer Stashfill over 
            cloud managers, default browser autofill, or dummy fillers.
          </p>
        </div>

        {/* Table Container */}
        <div className="max-w-5xl mx-auto rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70">
                <th className="p-5 text-sm font-semibold text-slate-900 dark:text-white min-w-[240px]">
                  Feature / Capability
                </th>
                <th className="p-5 text-sm font-bold text-brand-600 dark:text-brand-400 bg-brand-500/5 dark:bg-brand-500/10 min-w-[150px] text-center border-x border-brand-500/20">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-extrabold">Stashfill</span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      ★ Recommended
                    </span>
                  </div>
                </th>
                <th className="p-5 text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-[130px] text-center">
                  Browser Autofill<br /><span className="text-[10px] text-slate-400">(Chrome/Safari)</span>
                </th>
                <th className="p-5 text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-[130px] text-center">
                  Cloud Managers<br /><span className="text-[10px] text-slate-400">(1Pass/Bitwarden)</span>
                </th>
                <th className="p-5 text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-[130px] text-center">
                  FakeFiller<br /><span className="text-[10px] text-slate-400">(QA Dummy Only)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {COMPARISON_DATA.map((item, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-5">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.description}
                    </div>
                  </td>

                  {/* Stashfill Column */}
                  <td className="p-5 bg-brand-500/5 dark:bg-brand-500/10 text-center border-x border-brand-500/20">
                    <div className="flex justify-center">
                      {item.stashfill === true ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="font-semibold text-xs text-brand-600 dark:text-brand-400">
                          {item.stashfill}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Browser Autofill */}
                  <td className="p-5 text-center">
                    <div className="flex justify-center">
                      {item.browserAutofill === true ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : item.browserAutofill === false ? (
                        <X className="w-5 h-5 text-rose-500/80" />
                      ) : (
                        <span className="text-xs font-semibold text-amber-500">
                          {item.browserAutofill}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Cloud Managers */}
                  <td className="p-5 text-center">
                    <div className="flex justify-center">
                      {item.cloudManagers === true ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : item.cloudManagers === false ? (
                        <X className="w-5 h-5 text-rose-500/80" />
                      ) : (
                        <span className="text-xs font-semibold text-amber-500">
                          {item.cloudManagers}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* FakeFiller */}
                  <td className="p-5 text-center">
                    <div className="flex justify-center">
                      {item.fakeFiller === true ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : item.fakeFiller === false ? (
                        <X className="w-5 h-5 text-rose-500/80" />
                      ) : (
                        <span className="text-xs font-semibold text-amber-500">
                          {item.fakeFiller}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
}
