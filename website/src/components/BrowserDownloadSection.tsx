'use client';

import { Download, ExternalLink, Github } from 'lucide-react';
import Link from 'next/link';

const BROWSERS = [
  {
    id: 'chrome',
    name: 'Chrome & Chromium',
    description: 'Brave, Arc, Vivaldi, Opera, and Chromium 114+.',
    icon: '🌐',
    badge: 'Manifest V3',
    downloadUrl: 'https://github.com/stashfill/stashfill/releases/latest/download/stashfill-chrome.zip',
    storeUrl: 'https://chrome.google.com/webstore/detail/stashfill',
    setupCommand: 'Load unpacked via chrome://extensions (Developer mode)',
  },
  {
    id: 'firefox',
    name: 'Mozilla Firefox',
    description: 'Firefox Desktop, Developer Edition, and Nightly.',
    icon: '🦊',
    badge: 'Manifest V3',
    downloadUrl: 'https://github.com/stashfill/stashfill/releases/latest/download/stashfill-firefox.zip',
    storeUrl: 'https://addons.mozilla.org/en-US/firefox/addon/stashfill',
    setupCommand: 'Load temporary add-on via about:debugging#/runtime/this-firefox',
  },
  {
    id: 'edge',
    name: 'Microsoft Edge',
    description: 'Windows 11 and macOS Edge with native sidebar support.',
    icon: '🌊',
    badge: 'Edge Add-ons',
    downloadUrl: 'https://github.com/stashfill/stashfill/releases/latest/download/stashfill-edge.zip',
    storeUrl: 'https://microsoftedge.microsoft.com/addons/detail/stashfill',
    setupCommand: 'Available in Edge Add-ons store or load unpacked',
  },
  {
    id: 'safari',
    name: 'Apple Safari',
    description: 'Compiled via Apple xcrun safari-web-extension-converter.',
    icon: '🧭',
    badge: 'macOS & iOS',
    downloadUrl: 'https://github.com/stashfill/stashfill#apple-safari-macos--ios',
    storeUrl: null,
    setupCommand: 'Compile Xcode wrapper project via xcrun converter',
  },
];

export default function BrowserDownloadSection() {
  return (
    <section id="download" className="py-24 relative overflow-hidden bg-white dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3 shadow-sm">
            <Download className="w-3.5 h-3.5" />
            <span>Distribution Channels</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-2">
            Multi-browser binaries.
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
            Single clean TypeScript codebase packaged for all modern browser engines.
          </p>
        </div>

        {/* Browser Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BROWSERS.map((browser) => (
            <div
              key={browser.id}
              className="p-5 rounded-xl tech-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{browser.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-950 dark:text-white font-mono">
                        {browser.name}
                      </h3>
                      <span className="text-[11px] text-zinc-500">
                        {browser.description}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">
                    {browser.badge}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-4">
                  <span className="text-zinc-400 block mb-0.5">Setup:</span>
                  {browser.setupCommand}
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <a
                  href={browser.downloadUrl}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download (.zip)</span>
                </a>

                {browser.storeUrl ? (
                  <a
                    href={browser.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    <span>Store</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <Link
                    href="/install?browser=safari"
                    className="flex items-center gap-1 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    <span>Build Guide</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Source Code Banner */}
        <div className="mt-8 p-4 rounded-xl tech-card border border-zinc-300 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <Github className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span className="text-zinc-600 dark:text-zinc-400">
              Build from source: <code className="text-zinc-950 dark:text-white">pnpm install &amp;&amp; pnpm build</code>
            </span>
          </div>
          <a
            href="https://github.com/stashfill/stashfill"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-900 dark:text-white hover:underline flex items-center gap-1 font-semibold"
          >
            <span>GitHub Repository</span>
            <span>→</span>
          </a>
        </div>

      </div>
    </section>
  );
}
