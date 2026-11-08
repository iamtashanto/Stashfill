'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, ArrowLeft, Check, Copy } from 'lucide-react';

type BrowserTab = 'chrome' | 'firefox' | 'edge' | 'safari';

export default function InstallPage() {
  const [selectedBrowser, setSelectedBrowser] = useState<BrowserTab>('chrome');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="pt-28 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Back to Home</span>
        </Link>
      </nav>

      {/* Header */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-3 shadow-sm">
          <Download className="w-3.5 h-3.5" />
          <span>Multi-Browser Binaries</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-950 dark:text-white tracking-tight mb-4">
          Browser Installation Guides
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
          Stashfill is distributed as clean Manifest V3 packages for Chromium, Firefox, Edge, and Safari.
          Select your browser for direct download links and setup instructions.
        </p>
      </div>

      {/* Interactive Browser Selector (Clean state, NO # tags) */}
      <div className="rounded-xl tech-card shadow-xl overflow-hidden border border-zinc-300 dark:border-zinc-800 mb-12">
        
        {/* Tab Strip */}
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-900/90 text-xs font-mono">
          <button
            onClick={() => setSelectedBrowser('chrome')}
            className={`px-4 py-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
              selectedBrowser === 'chrome'
                ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white bg-white dark:bg-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>🌐</span>
            <span>Google Chrome &amp; Chromium</span>
          </button>

          <button
            onClick={() => setSelectedBrowser('firefox')}
            className={`px-4 py-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
              selectedBrowser === 'firefox'
                ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white bg-white dark:bg-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>🦊</span>
            <span>Mozilla Firefox</span>
          </button>

          <button
            onClick={() => setSelectedBrowser('edge')}
            className={`px-4 py-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
              selectedBrowser === 'edge'
                ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white bg-white dark:bg-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>🌊</span>
            <span>Microsoft Edge</span>
          </button>

          <button
            onClick={() => setSelectedBrowser('safari')}
            className={`px-4 py-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
              selectedBrowser === 'safari'
                ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white bg-white dark:bg-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>🧭</span>
            <span>Apple Safari</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 sm:p-8 bg-white dark:bg-zinc-950 space-y-6">
          
          {selectedBrowser === 'chrome' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                <div>
                  <h2 className="text-xl font-bold font-mono text-zinc-950 dark:text-white">
                    Google Chrome, Brave, Arc &amp; Vivaldi
                  </h2>
                  <p className="text-xs text-zinc-500 font-sans mt-0.5">
                    Target: Manifest V3 • Chromium 114+
                  </p>
                </div>
                <a
                  href="https://github.com/stashfill/stashfill/releases/latest/download/stashfill-chrome.zip"
                  className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Chrome Zip</span>
                </a>
              </div>

              <div className="space-y-3 font-sans text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <h3 className="font-bold text-zinc-950 dark:text-white font-mono">
                  Installation Steps:
                </h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Download the official <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">stashfill-chrome.zip</code> release package.</li>
                  <li>Extract / unzip the archive to a designated folder on your machine.</li>
                  <li>In your Chromium browser address bar, navigate to <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">chrome://extensions</code>.</li>
                  <li>Enable the <strong>Developer mode</strong> toggle located at the top-right corner.</li>
                  <li>Click <strong>Load unpacked</strong> at the top-left and select the extracted folder containing <code className="font-mono text-xs">manifest.json</code>.</li>
                  <li>Pin the Stashfill icon to your browser toolbar for instant 1-click access.</li>
                </ol>
              </div>
            </div>
          )}

          {selectedBrowser === 'firefox' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                <div>
                  <h2 className="text-xl font-bold font-mono text-zinc-950 dark:text-white">
                    Mozilla Firefox
                  </h2>
                  <p className="text-xs text-zinc-500 font-sans mt-0.5">
                    Target: Firefox MV3 • Desktop &amp; Nightly 120+
                  </p>
                </div>
                <a
                  href="https://github.com/stashfill/stashfill/releases/latest/download/stashfill-firefox.zip"
                  className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Firefox Zip</span>
                </a>
              </div>

              <div className="space-y-3 font-sans text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <h3 className="font-bold text-zinc-950 dark:text-white font-mono">
                  Installation Steps:
                </h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Download the official <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">stashfill-firefox.zip</code>.</li>
                  <li>Extract the archive on your local drive.</li>
                  <li>In Firefox, navigate to <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">about:debugging#/runtime/this-firefox</code>.</li>
                  <li>Click the <strong>Load Temporary Add-on...</strong> button.</li>
                  <li>Select the <code className="font-mono text-xs">manifest.json</code> file located inside the unzipped folder.</li>
                </ol>
              </div>
            </div>
          )}

          {selectedBrowser === 'edge' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                <div>
                  <h2 className="text-xl font-bold font-mono text-zinc-950 dark:text-white">
                    Microsoft Edge
                  </h2>
                  <p className="text-xs text-zinc-500 font-sans mt-0.5">
                    Windows 11 / macOS Edge with Sidebar Integration
                  </p>
                </div>
                <a
                  href="https://github.com/stashfill/stashfill/releases/latest/download/stashfill-edge.zip"
                  className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-mono text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Edge Zip</span>
                </a>
              </div>

              <div className="space-y-3 font-sans text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <h3 className="font-bold text-zinc-950 dark:text-white font-mono">
                  Installation Steps:
                </h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>In Microsoft Edge, navigate to <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">edge://extensions</code>.</li>
                  <li>Enable <strong>Developer mode</strong> in the left sidebar menu.</li>
                  <li>Click <strong>Load unpacked</strong> and select the unzipped directory.</li>
                </ol>
              </div>
            </div>
          )}

          {selectedBrowser === 'safari' && (
            <div className="space-y-6 animate-fade-in">
              <div className="pb-4 border-b border-zinc-100 dark:border-zinc-900">
                <h2 className="text-xl font-bold font-mono text-zinc-950 dark:text-white">
                  Apple Safari (macOS &amp; iOS)
                </h2>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  Compiled via Apple xcrun safari-web-extension-converter
                </p>
              </div>

              <div className="space-y-3 font-sans text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <p>
                  Safari requires web extensions to be wrapped inside an Xcode native host project. 
                  You can compile the project in 3 terminal commands:
                </p>

                <div className="relative rounded-lg bg-[#0c0d12] p-4 text-zinc-300 font-mono text-xs border border-zinc-800 space-y-1">
                  <div>git clone https://github.com/stashfill/stashfill.git</div>
                  <div>cd stashfill &amp;&amp; pnpm install &amp;&amp; pnpm build</div>
                  <div>xcrun safari-web-extension-converter .output/chrome-mv3 --project-location ./safari-build</div>
                  <button
                    onClick={() => copyToClipboard('git clone https://github.com/stashfill/stashfill.git && cd stashfill && pnpm install && pnpm build && xcrun safari-web-extension-converter .output/chrome-mv3 --project-location ./safari-build', 'safari-cmd')}
                    className="absolute top-3 right-3 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    title="Copy commands"
                  >
                    {copiedCode === 'safari-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-xs text-zinc-500">
                  Open the generated <code className="font-mono">./safari-build/Stashfill.xcodeproj</code> in Xcode and hit <strong>Run</strong>.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Verification & Safety Note */}
      <div className="p-6 rounded-xl tech-card border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400 flex items-center justify-between flex-wrap gap-4">
        <span>Verified zero-telemetry bundle checksums published on GitHub Releases.</span>
        <a
          href="https://github.com/stashfill/stashfill/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-950 dark:text-white hover:underline font-bold"
        >
          View Release Hashes →
        </a>
      </div>

    </div>
  );
}
