'use client';

import { Download, ExternalLink, Github } from 'lucide-react';
import Link from 'next/link';

const BROWSERS = [
  {
    id: 'chrome',
    name: 'Google Chrome & Chromium',
    description: 'Brave, Vivaldi, Opera, Arc, and all Chromium-based engines.',
    icon: '🌐',
    badge: 'Manifest V3',
    downloadUrl: 'https://github.com/stashfill/stashfill/releases/latest/download/stashfill-chrome.zip',
    storeUrl: 'https://chrome.google.com/webstore/detail/stashfill',
    instructions: 'Download zip, unzip, open chrome://extensions, enable Dev Mode, and click "Load unpacked".',
  },
  {
    id: 'firefox',
    name: 'Mozilla Firefox',
    description: 'Firefox Desktop, Developer Edition, and Firefox Nightly.',
    icon: '🦊',
    badge: 'Manifest V3',
    downloadUrl: 'https://github.com/stashfill/stashfill/releases/latest/download/stashfill-firefox.zip',
    storeUrl: 'https://addons.mozilla.org/en-US/firefox/addon/stashfill',
    instructions: 'Load temporary add-on via about:debugging#/runtime/this-firefox or install via Firefox Add-ons AMO.',
  },
  {
    id: 'edge',
    name: 'Microsoft Edge',
    description: 'Windows 11 and macOS Edge with native sidebar integration.',
    icon: '🌊',
    badge: 'Edge Add-ons',
    downloadUrl: 'https://github.com/stashfill/stashfill/releases/latest/download/stashfill-edge.zip',
    storeUrl: 'https://microsoftedge.microsoft.com/addons/detail/stashfill',
    instructions: 'Available in the Microsoft Edge Add-ons store or load unpacked via edge://extensions.',
  },
  {
    id: 'safari',
    name: 'Apple Safari (macOS & iOS)',
    description: 'Converted via Apple xcrun safari-web-extension-converter.',
    icon: '🧭',
    badge: 'macOS & iOS',
    downloadUrl: 'https://github.com/stashfill/stashfill#apple-safari-macos--ios',
    storeUrl: null,
    instructions: 'Convert Chrome MV3 build using Apple xcrun tool or download Xcode wrapper build from Releases.',
  },
];

export default function BrowserDownloadSection() {
  return (
    <section id="download" className="py-24 relative overflow-hidden bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-3">
            <Download className="w-3.5 h-3.5" />
            <span>Multi-Browser Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Available for Every Major Browser
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
            Packaged strictly from a single clean, auditable Manifest V3 TypeScript codebase.
          </p>
        </div>

        {/* Browser Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {BROWSERS.map((browser) => (
            <div
              key={browser.id}
              className="rounded-3xl p-7 glass-panel border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-brand-500/40 transition-all duration-300 shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{browser.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {browser.name}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {browser.description}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {browser.badge}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Quick Setup:</strong>
                  {browser.instructions}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={browser.downloadUrl}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Build (.zip)</span>
                </a>

                {browser.storeUrl ? (
                  <a
                    href={browser.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                  >
                    <span>Store Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <Link
                    href="/install#safari"
                    className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                  >
                    <span>Build Guide</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Source Code Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Prefer building from source?</div>
              <div className="text-xs text-slate-500">Run <code className="font-mono text-brand-600 dark:text-brand-400">pnpm install &amp;&amp; pnpm build</code> to compile locally in 5 seconds.</div>
            </div>
          </div>
          <a
            href="https://github.com/stashfill/stashfill"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Inspect Repository on GitHub →
          </a>
        </div>

      </div>
    </section>
  );
}
