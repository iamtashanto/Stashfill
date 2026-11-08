'use client';

import { Save, EyeOff, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  {
    step: '01',
    icon: Save,
    title: 'Stash Your Real Data Once',
    description:
      'Enter your personal identity info, work credentials, billing addresses, custom snippets, and encrypted payment cards inside the extension options. Your data stays strictly on your local device.',
    badge: 'AES-256 Vault',
  },
  {
    step: '02',
    icon: EyeOff,
    title: 'Browse Freely & Privately',
    description:
      'Unlike intrusive extensions, Stashfill remains completely dormant. It injects zero content scripts while you browse, listens to zero network events, and tracks zero web history.',
    badge: 'Zero Host Permissions',
  },
  {
    step: '03',
    icon: Zap,
    title: '1-Click or Shortcut Fill',
    description:
      'When you land on a form (checkout, job application, tax portal, SaaS onboarding), press Alt+Shift+F or click the popup. All matching fields populate in under 50 milliseconds.',
    badge: '< 50ms Matcher',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Effortless Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            How Stashfill Works in 3 Steps
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
            Say goodbye to typing the same email, address, and credit card number over and over again.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative rounded-3xl p-8 glass-panel border border-slate-200 dark:border-slate-800 flex flex-col justify-between group hover:border-brand-500/40 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-extrabold text-slate-300 dark:text-slate-700 font-mono">
                      {step.step}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                      {step.badge}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 w-fit mb-5">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {step.title}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Try it banner */}
        <div className="mt-14 text-center">
          <Link
            href="/install"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95"
          >
            <span>Get Started in 60 Seconds</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
