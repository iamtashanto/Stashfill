'use client';

import Link from 'next/link';
import { Download, ArrowLeft } from 'lucide-react';

export default function InstallPage() {
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

      {/* Header */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-3">
          <Download className="w-3.5 h-3.5" />
          <span>Multi-Platform Distribution</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Install Stashfill on Your Browser
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
          Choose your browser below for official store download links or load unpacked builds in developer mode.
        </p>
      </div>

      {/* Installation Cards */}
      <div className="space-y-12">
        
        {/* Chrome & Chromium */}
        <section id="chrome" className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌐</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Google Chrome, Brave, Edge &amp; Chromium
                </h2>
                <span className="text-xs text-slate-500">Manifest V3 • Chromium 114+</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://github.com/stashfill/stashfill/releases/latest/download/stashfill-chrome.zip"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Chrome (.zip)</span>
              </a>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <h3 className="font-semibold text-slate-900 dark:text-white">Step-by-Step Installation:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Download the official <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">stashfill-chrome.zip</code> and unzip it onto your local drive.</li>
              <li>Open Chrome and navigate to <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">chrome://extensions</code> in the address bar.</li>
              <li>Toggle on the <strong>Developer mode</strong> switch at the top right of the page.</li>
              <li>Click the <strong>Load unpacked</strong> button at the top left.</li>
              <li>Select the unzipped folder containing <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">manifest.json</code>.</li>
            </ol>
          </div>
        </section>

        {/* Mozilla Firefox */}
        <section id="firefox" className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🦊</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Mozilla Firefox
                </h2>
                <span className="text-xs text-slate-500">Manifest V3 • Firefox 120+</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://github.com/stashfill/stashfill/releases/latest/download/stashfill-firefox.zip"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Firefox (.zip)</span>
              </a>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <h3 className="font-semibold text-slate-900 dark:text-white">Step-by-Step Installation:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Download the official <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">stashfill-firefox.zip</code> and unzip it.</li>
              <li>In Firefox, navigate to <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">about:debugging#/runtime/this-firefox</code>.</li>
              <li>Click <strong>Load Temporary Add-on...</strong>.</li>
              <li>Select the <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">manifest.json</code> file inside the unzipped folder.</li>
            </ol>
          </div>
        </section>

        {/* Apple Safari */}
        <section id="safari" className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧭</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Apple Safari (macOS &amp; iOS)
                </h2>
                <span className="text-xs text-slate-500">Converted via Apple xcrun tool</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <h3 className="font-semibold text-slate-900 dark:text-white">Build &amp; Run with Xcode:</h3>
            <p>
              Safari Web Extensions can be compiled directly from our source repository using Apple&apos;s 
              official converter:
            </p>
            <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs border border-slate-800 space-y-2">
              <div>git clone https://github.com/stashfill/stashfill.git</div>
              <div>cd stashfill &amp;&amp; pnpm install &amp;&amp; pnpm build</div>
              <div>xcrun safari-web-extension-converter .output/chrome-mv3 --project-location ./safari-build</div>
            </div>
            <p className="text-xs text-slate-500">
              Open the generated Xcode project in <code className="font-mono">./safari-build</code> and click <strong>Run</strong>.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
