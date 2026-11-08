'use client';

import Link from 'next/link';
import { 
  Keyboard, 
  Terminal, 
  FileText, 
  Languages, 
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { useState } from 'react';

export default function DocsPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="pt-28 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Docs Header */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-3">
          <Terminal className="w-3.5 h-3.5" />
          <span>Stashfill Developer &amp; User Manual</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Documentation &amp; Cheatsheet
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
          Master keyboard shortcuts, dynamic snippet variable templating, custom site mapping rules, 
          and multilingual synonym configurations.
        </p>
      </div>

      {/* Section 1: Keyboard Shortcuts */}
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="w-5 h-5 text-brand-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Stashfill is designed to be operated 100% from your keyboard for optimal workflow velocity.
        </p>

        <div className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 font-mono">
                <th className="p-4 font-semibold">Shortcut</th>
                <th className="p-4 font-semibold">Scope</th>
                <th className="p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">Alt + Shift + F</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">Global Tab</span></td>
                <td className="p-4">Instantly fills all matching fields on the active webpage with the primary profile.</td>
              </tr>
              <tr>
                <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">/</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">Popup</span></td>
                <td className="p-4">Autofocuses the Quick Search &amp; Filter input immediately upon opening popup.</td>
              </tr>
              <tr>
                <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">↑ / ↓ (Arrows)</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">Popup</span></td>
                <td className="p-4">Navigates through filtered profiles, custom fields, and snippets list.</td>
              </tr>
              <tr>
                <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">Enter</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">Popup</span></td>
                <td className="p-4">Inserts the selected field or snippet into the currently focused DOM input.</td>
              </tr>
              <tr>
                <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">Shift + Enter</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">Popup</span></td>
                <td className="p-4">Copies the selected field value directly to clipboard (auto-wiped after 15s for cards).</td>
              </tr>
              <tr>
                <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">Esc</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">Popup / Dialog</span></td>
                <td className="p-4">Dismisses the popup or closes active confirmation modals.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Snippet Variable Cheatsheet */}
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-emerald-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Snippet Variable Syntax</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Snippets support dynamic token evaluation at insertion time. Use double curly braces <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs">&#123;&#123;variable&#125;&#125;</code>:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              id: 'date',
              token: '{{date}}',
              desc: 'Current ISO date (e.g. 2026-11-09)',
              example: 'Created on: {{date}}',
            },
            {
              id: 'time',
              token: '{{time}}',
              desc: 'Current local 24h time (e.g. 14:30:15)',
              example: 'Timestamp: {{time}}',
            },
            {
              id: 'year',
              token: '{{year}}',
              desc: 'Four-digit current year (e.g. 2026)',
              example: '© {{year}} Stashfill',
            },
            {
              id: 'cursor',
              token: '{{cursor}}',
              desc: 'Places the text cursor at this position after snippet insertion',
              example: 'Hello {{cursor}}, thanks for your email!',
            },
            {
              id: 'uuid',
              token: '{{uuid}}',
              desc: 'Generates a random v4 cryptographically secure UUID',
              example: 'Trace-ID: {{uuid}}',
            },
            {
              id: 'random_number',
              token: '{{random:1000,9999}}',
              desc: 'Generates a random integer within specified range',
              example: 'Invoice #{{random:1000,9999}}',
            },
          ].map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {item.token}
                  </code>
                  <button
                    onClick={() => copyToClipboard(item.token, item.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Copy token"
                  >
                    {copiedToken === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">{item.desc}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-600 dark:text-slate-300">
                <span className="text-[10px] text-slate-400 block font-sans">Example:</span>
                {item.example}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Multilingual Bangla Engine */}
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-4">
          <Languages className="w-5 h-5 text-amber-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Multilingual Bangla (বাংলা) Support</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Stashfill natively incorporates a curated dictionary of Bangla field synonyms tested across 
          government, ecommerce, and job portals:
        </p>

        <div className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 font-mono">
                <th className="p-4 font-semibold">Standard Field</th>
                <th className="p-4 font-semibold">Bangla (বাংলা) Synonyms Recognized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="p-4 font-semibold text-slate-900 dark:text-white">Full Name</td>
                <td className="p-4 font-medium text-amber-600 dark:text-amber-400">নাম, পুরো নাম, প্রার্থীর নাম, পূর্ণ নাম</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900 dark:text-white">Email Address</td>
                <td className="p-4 font-medium text-amber-600 dark:text-amber-400">ইমেইল, ইমেইল ঠিকানা, যোগাযোগ ইমেইল</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900 dark:text-white">Phone Number</td>
                <td className="p-4 font-medium text-amber-600 dark:text-amber-400">মোবাইল, ফোন নম্বর, যোগাযোগ নম্বর, মোবাইল নম্বর</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900 dark:text-white">Street Address</td>
                <td className="p-4 font-medium text-amber-600 dark:text-amber-400">ঠিকানা, বর্তমান ঠিকানা, স্থায়ী ঠিকানা, বাসার ঠিকানা</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900 dark:text-white">Postal / Zip Code</td>
                <td className="p-4 font-medium text-amber-600 dark:text-amber-400">পোস্ট কোড, ডাকঘর, পোস্টাল কোড</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900 dark:text-white">National ID / NID</td>
                <td className="p-4 font-medium text-amber-600 dark:text-amber-400">জাতীয় পরিচয়পত্র, এনআইডি নম্বর, পরিচয়পত্র নম্বর</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
