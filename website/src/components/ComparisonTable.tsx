'use client';

import { Check, X, Terminal } from 'lucide-react';

interface ComparisonRow {
  capability: string;
  technicalNote: string;
  stashfill: boolean | string;
  browserAutofill: boolean | string;
  cloudManagers: boolean | string;
  fakeFiller: boolean | string;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    capability: 'Network Isolation (0 Telemetry)',
    technicalNote: 'Zero outbound sockets, fetch, or telemetry endpoints.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: false,
    fakeFiller: true,
  },
  {
    capability: 'No Cloud Account Required',
    technicalNote: 'Operates strictly in browser local storage without signup.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: false,
    fakeFiller: true,
  },
  {
    capability: 'Real Personal Identities',
    technicalNote: 'Saves your verified contact, shipping, and work fields.',
    stashfill: true,
    browserAutofill: 'Rigid',
    cloudManagers: true,
    fakeFiller: false, // dummy gibberish only
  },
  {
    capability: 'React 18/19 & Vue State Sync',
    technicalNote: 'Overrides prototype setters to trigger framework trackers.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: 'Partial',
    fakeFiller: 'Partial',
  },
  {
    capability: 'Shadow DOM & Nested Frames',
    technicalNote: 'Recursively walks shadow roots on complex web apps.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: 'Partial',
    fakeFiller: 'Partial',
  },
  {
    capability: 'SubtleCrypto AES-256 Vault',
    technicalNote: 'Hardware-derived PBKDF2 (600,000 rounds) + 15s clipboard scrub.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: true,
    fakeFiller: false,
  },
  {
    capability: 'Dynamic Template Variables',
    technicalNote: 'In-memory snippet evaluation ({{date}}, {{time}}, {{cursor}}).',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: false,
    fakeFiller: false,
  },
  {
    capability: 'Bilingual English & বাংলা',
    technicalNote: 'Native token synonym matching for localized form fixtures.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: false,
    fakeFiller: false,
  },
  {
    capability: 'Free & Open Source (MIT)',
    technicalNote: 'Complete codebase auditable on GitHub with >= 80% coverage.',
    stashfill: true,
    browserAutofill: false,
    cloudManagers: false,
    fakeFiller: true,
  },
];

export default function ComparisonTable() {
  return (
    <section id="comparison" className="py-24 relative overflow-hidden bg-zinc-50/50 dark:bg-[#090a0f] border-b border-zinc-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3 shadow-sm">
            <Terminal className="w-3.5 h-3.5" />
            <span>Benchmark &amp; Matrix</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-2">
            Technical Specification Matrix
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
            How Stashfill compares against browser autofill, cloud password vaults, and QA dummy fillers.
          </p>
        </div>

        {/* Matrix Container */}
        <div className="rounded-xl tech-card shadow-xl overflow-x-auto border border-zinc-300 dark:border-zinc-800">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400">
                <th className="p-4 font-semibold min-w-[240px]">
                  Capability / Guarantee
                </th>
                <th className="p-4 font-bold text-zinc-950 dark:text-white bg-zinc-200/50 dark:bg-zinc-800/60 min-w-[140px] text-center border-x border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col items-center">
                    <span className="text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-extrabold">
                      ★ Stashfill
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal">Local Extension</span>
                  </div>
                </th>
                <th className="p-4 font-medium text-center min-w-[120px]">
                  Browser Autofill<br /><span className="text-[10px] text-zinc-400">Chrome/Safari</span>
                </th>
                <th className="p-4 font-medium text-center min-w-[120px]">
                  Cloud Vaults<br /><span className="text-[10px] text-zinc-400">1Pass/Bitwarden</span>
                </th>
                <th className="p-4 font-medium text-center min-w-[120px]">
                  FakeFiller<br /><span className="text-[10px] text-zinc-400">Dummy QA Only</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 bg-white dark:bg-zinc-950">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 font-sans">
                    <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                      {row.capability}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                      {row.technicalNote}
                    </div>
                  </td>

                  {/* Stashfill Column */}
                  <td className="p-4 bg-zinc-100/40 dark:bg-zinc-900/40 text-center border-x border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-center">
                      {row.stashfill === true ? (
                        <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span>{row.stashfill}</span>
                      )}
                    </div>
                  </td>

                  {/* Browser Autofill */}
                  <td className="p-4 text-center">
                    <div className="flex justify-center">
                      {row.browserAutofill === true ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : row.browserAutofill === false ? (
                        <X className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                      ) : (
                        <span className="text-[11px] text-amber-500 font-semibold">{row.browserAutofill}</span>
                      )}
                    </div>
                  </td>

                  {/* Cloud Managers */}
                  <td className="p-4 text-center">
                    <div className="flex justify-center">
                      {row.cloudManagers === true ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : row.cloudManagers === false ? (
                        <X className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                      ) : (
                        <span className="text-[11px] text-amber-500 font-semibold">{row.cloudManagers}</span>
                      )}
                    </div>
                  </td>

                  {/* FakeFiller */}
                  <td className="p-4 text-center">
                    <div className="flex justify-center">
                      {row.fakeFiller === true ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : row.fakeFiller === false ? (
                        <X className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                      ) : (
                        <span className="text-[11px] text-amber-500 font-semibold">{row.fakeFiller}</span>
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
