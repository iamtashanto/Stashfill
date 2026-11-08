'use client';

import { Save, EyeOff, Zap, Layers } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  {
    step: '01 / STASH ONCE',
    icon: Save,
    title: 'Store your real data locally',
    description:
      'Save your personal profile, work details, dynamic snippets, and encrypted payment cards. Data is written directly to chrome.storage.local without hitting remote servers.',
    badge: 'AES-256 Vault',
  },
  {
    step: '02 / ZERO OVERHEAD',
    icon: EyeOff,
    title: 'Dormant while browsing',
    description:
      'Unlike cloud extensions that run background telemetry trackers on every URL you visit, Stashfill remains completely inactive until you explicitly trigger an action.',
    badge: '0 Host Permissions',
  },
  {
    step: '03 / ONE KEYSTROKE',
    icon: Zap,
    title: 'Sub-50ms heuristic matching',
    description:
      'Press Alt+Shift+F on any web form. The engine inspects input attributes, normalizes camelCase/snake_case and Bangla synonyms, and reconciles framework value trackers.',
    badge: '< 50ms Matcher',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-zinc-50/50 dark:bg-[#090a0f] border-b border-zinc-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3 shadow-sm">
            <Layers className="w-3.5 h-3.5" />
            <span>Workflow Lifecycle</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-2">
            How it works in 3 stages.
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
            No registration, no continuous synchronization, no network dependencies.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-xl tech-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 font-mono">
                    <span className="text-xs font-bold text-zinc-400">
                      {step.step}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                      {step.badge}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white w-fit mb-4 border border-zinc-200 dark:border-zinc-800">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-bold text-zinc-950 dark:text-white mb-2 font-mono">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Action */}
        <div className="mt-12 flex items-center justify-between p-5 rounded-xl tech-card border border-zinc-300 dark:border-zinc-800 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
              Ready to eliminate redundant data entry? Packaged for all major browsers.
            </div>
          </div>
          <Link
            href="/install"
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Install Extension →
          </Link>
        </div>

      </div>
    </section>
  );
}
