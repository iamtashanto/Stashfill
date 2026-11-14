'use client';

import Link from 'next/link';
import { 
  Keyboard, 
  Terminal, 
  FileText, 
  Globe, 
  ArrowLeft,
  Copy,
  Check,
  Layers,
  Shield
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
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Back to Home</span>
        </Link>
      </nav>

      {/* Docs Header */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3 shadow-sm">
          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          <span>Stashfill Technical Documentation &amp; Reference</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-4">
          Documentation &amp; Cheatsheet
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
          Comprehensive guide to keyboard shortcuts, dynamic snippet variable templating, 
          direct cross-profile context submenus, and multilingual synonym normalization.
        </p>
      </div>

      {/* Section 1: Keyboard Shortcuts */}
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-3">
          <Keyboard className="w-5 h-5 text-indigo-500" />
          <h2 className="text-2xl font-bold font-mono text-zinc-950 dark:text-white">Keyboard Shortcuts</h2>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Operate Stashfill 100% from your keyboard for zero-interruption workflow velocity.
        </p>

        <div className="rounded-xl tech-card border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-zinc-400 font-mono">
                <th className="p-4 font-semibold">Shortcut</th>
                <th className="p-4 font-semibold">Context / Scope</th>
                <th className="p-4 font-semibold">Action Performed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-4 font-mono font-bold text-zinc-950 dark:text-white">Alt + Shift + F</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs text-zinc-600 dark:text-zinc-400">Active Tab</span></td>
                <td className="p-4">Autofills all detected form inputs on the active web page using the primary active profile.</td>
              </tr>
              <tr>
                <td className="p-4 font-mono font-bold text-zinc-950 dark:text-white">/</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs text-zinc-600 dark:text-zinc-400">Popup</span></td>
                <td className="p-4">Immediately focuses the global search &amp; filter input to search profiles, fields, or snippets.</td>
              </tr>
              <tr>
                <td className="p-4 font-mono font-bold text-zinc-950 dark:text-white">↑ / ↓ (Arrows)</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs text-zinc-600 dark:text-zinc-400">Popup</span></td>
                <td className="p-4">Traverses the filtered list of profile items, custom attributes, and text snippets.</td>
              </tr>
              <tr>
                <td className="p-4 font-mono font-bold text-zinc-950 dark:text-white">Enter</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs text-zinc-600 dark:text-zinc-400">Popup</span></td>
                <td className="p-4">Fills the active or focused web field with the selected item.</td>
              </tr>
              <tr>
                <td className="p-4 font-mono font-bold text-zinc-950 dark:text-white">Shift + Enter</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs text-zinc-600 dark:text-zinc-400">Popup</span></td>
                <td className="p-4">Copies the selected value to system clipboard (auto-scrubbed after 15s for credit cards).</td>
              </tr>
              <tr>
                <td className="p-4 font-mono font-bold text-zinc-950 dark:text-white">Esc</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs text-zinc-600 dark:text-zinc-400">Popup / Modal</span></td>
                <td className="p-4">Closes active confirmation dialogs, quick search overlays, or the extension popup.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Cross-Profile Context Submenu & Global Search */}
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-indigo-500" />
          <h2 className="text-2xl font-bold font-mono text-zinc-950 dark:text-white">
            Direct Cross-Profile Access (No Switching Required)
          </h2>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
          In typical extensions, using a value from another profile requires opening the popup, switching profiles, 
          and losing your active workflow. Stashfill solves this with direct cross-profile submenus and global search:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl tech-card border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-zinc-950 dark:text-white">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <h3>Right-Click Context Submenus</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Right-click on any input field on any webpage. Under the <strong>Stashfill</strong> menu, you will find 
              nested submenus for every saved profile (e.g., <em>Personal</em>, <em>Work</em>, <em>Social Links</em>). 
              Clicking any field immediately injects its value into the targeted DOM input with synthetic event bubbling.
            </p>
            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 font-mono text-xs text-zinc-700 dark:text-zinc-300">
              Right-Click → Stashfill → [Profile Name] → [Field Name]
            </div>
          </div>

          <div className="p-6 rounded-xl tech-card border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-zinc-950 dark:text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h3>Popup Universal Search</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Press <kbd className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded">/</kbd> in the extension popup. 
              Search across all profiles simultaneously (e.g. typing &quot;github&quot; or &quot;cv&quot; surfaces results from 
              Personal and Work profiles alike). Click <strong>Fill</strong> or <strong>Copy</strong> directly.
            </p>
            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 font-mono text-xs text-zinc-700 dark:text-zinc-300">
              Popup → Press / → Type query → Fill or Copy
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Snippet Variable Syntax */}
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-emerald-500" />
          <h2 className="text-2xl font-bold font-mono text-zinc-950 dark:text-white">Dynamic Snippet Variable Syntax</h2>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
          Snippets support dynamic token evaluation at insertion time. Use double curly braces <code className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs">&#123;&#123;variable&#125;&#125;</code>. 
          When triggered via trigger prefix (e.g., <code className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">;sig</code>) 
          or selected from popup, tokens are computed instantaneously:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'date',
              token: '{{date}}',
              desc: 'Current ISO date format',
              example: '2026-11-14',
            },
            {
              id: 'time',
              token: '{{time}}',
              desc: 'Current 24-hour local time',
              example: '14:30:15',
            },
            {
              id: 'datetime',
              token: '{{datetime}}',
              desc: 'Full ISO timestamp with date and time',
              example: '2026-11-14 14:30:15',
            },
            {
              id: 'year',
              token: '{{year}}',
              desc: 'Four-digit current calendar year',
              example: '© 2026 Stashfill',
            },
            {
              id: 'month',
              token: '{{month}}',
              desc: 'Two-digit numeric month',
              example: '11',
            },
            {
              id: 'day',
              token: '{{day}}',
              desc: 'Two-digit day of the month',
              example: '14',
            },
            {
              id: 'uuid',
              token: '{{uuid}}',
              desc: 'Cryptographically random RFC-4122 v4 UUID',
              example: '9f8e7d6c-4a12-b34e-...',
            },
            {
              id: 'random',
              token: '{{random:1000,9999}}',
              desc: 'Random integer within custom min/max range',
              example: 'Invoice #5839',
            },
            {
              id: 'cursor',
              token: '{{cursor}}',
              desc: 'Sets text cursor caret position after expansion',
              example: 'Hi {{cursor}}, thanks for...',
            },
          ].map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl tech-card border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <code className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {item.token}
                  </code>
                  <button
                    onClick={() => copyToClipboard(item.token, item.id)}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    title="Copy token"
                  >
                    {copiedToken === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">{item.desc}</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-600 dark:text-zinc-300 truncate">
                <span className="text-[10px] text-zinc-400 block font-sans">Output:</span>
                {item.example}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Universal Unicode & International Form Support */}
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-indigo-500" />
          <h2 className="text-2xl font-bold font-mono text-zinc-950 dark:text-white">Universal Unicode &amp; Multi-Language Support</h2>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
          While the extension user interface is streamlined in clean English, Stashfill provides 100% full UTF-8 Unicode 
          compatibility across all inputs, textareas, profiles, and clipboard operations. You can store, copy, paste, and 
          autofill data in any world script or language without character corruption:
        </p>

        <div className="rounded-xl tech-card border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-zinc-400 font-mono">
                <th className="p-4 font-semibold">Script &amp; Language Family</th>
                <th className="p-4 font-semibold">Example Fill &amp; Paste Verification</th>
                <th className="p-4 font-semibold">Storage &amp; Clipboard Guarantee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-4 font-semibold font-mono text-zinc-950 dark:text-white">Bengali (বাংলা)</td>
                <td className="p-4 font-medium text-emerald-600 dark:text-emerald-400">তানভীর আহমেদ শান্ত, ঢাকা, বাংলাদেশ</td>
                <td className="p-4 font-mono text-xs text-zinc-500">UTF-8 Full Fidelity</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold font-mono text-zinc-950 dark:text-white">Arabic &amp; Persian (RTL)</td>
                <td className="p-4 font-medium text-emerald-600 dark:text-emerald-400">محمد عبد الله، الرياض</td>
                <td className="p-4 font-mono text-xs text-zinc-500">RTL DOM Bubbling Preserved</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold font-mono text-zinc-950 dark:text-white">CJK (Chinese, Japanese, Korean)</td>
                <td className="p-4 font-medium text-emerald-600 dark:text-emerald-400">田中 太郎, 東京都千代田区, 李明</td>
                <td className="p-4 font-mono text-xs text-zinc-500">Multibyte Safe Buffer</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold font-mono text-zinc-950 dark:text-white">Extended Latin &amp; Cyrillic</td>
                <td className="p-4 font-medium text-emerald-600 dark:text-emerald-400">Dr. François Müller, Елена Ростова</td>
                <td className="p-4 font-mono text-xs text-zinc-500">Accents &amp; Diacritics Intact</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Security Architecture & Ephemeral Scrubber */}
      <div className="p-6 rounded-xl tech-card border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xl font-bold font-mono text-zinc-950 dark:text-white">
            15-Second Ephemeral Clipboard Scrubber
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          When copying payment cards or sensitive tokens via the popup or shortcut, Stashfill arms an ephemeral 
          15-second background scrubber. After 15 seconds, the system clipboard is automatically purged, preventing 
          unintended clipboard snooping by malicious websites or desktop processes.
        </p>
      </div>

    </div>
  );
}
