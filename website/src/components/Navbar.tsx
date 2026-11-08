'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Download, 
  Github, 
  Menu, 
  X, 
  ChevronDown
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'glass-nav shadow-lg shadow-indigo-950/5' 
          : 'bg-transparent py-2'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-emerald-400 p-[1.5px] shadow-glow transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
                <Image 
                  src="/icon.svg" 
                  alt="Stashfill Logo" 
                  width={24} 
                  height={24} 
                  className="w-6 h-6 object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Stash<span className="text-brand-500">fill</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  100% Offline
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link 
              href="#demo" 
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Interactive Demo
            </Link>
            <Link 
              href="#features" 
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Features
            </Link>
            <Link 
              href="#security" 
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Security Vault
            </Link>
            <Link 
              href="#comparison" 
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Comparison
            </Link>
            <Link 
              href="/docs" 
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Docs
            </Link>
            <Link 
              href="#faq" 
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {/* GitHub Link */}
            <a
              href="https://github.com/stashfill/stashfill"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Github className="w-4 h-4" />
              <span className="hidden xl:inline">GitHub</span>
            </a>

            {/* Download Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDownloadOpen(!downloadOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-md shadow-brand-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/30 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Get Stashfill</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${downloadOpen ? 'rotate-180' : ''}`} />
              </button>

              {downloadOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl p-2 z-50 animate-fade-in border border-slate-200 dark:border-slate-700"
                  onMouseLeave={() => setDownloadOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Select Your Browser (MV3)
                  </div>
                  <Link
                    href="/install#chrome"
                    onClick={() => setDownloadOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-500/10 text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 text-sm font-medium transition-colors"
                  >
                    <span className="text-base">🌐</span>
                    <div className="flex flex-col">
                      <span>Google Chrome</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Chrome, Brave, Edge, Opera</span>
                    </div>
                  </Link>
                  <Link
                    href="/install#firefox"
                    onClick={() => setDownloadOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-500/10 text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 text-sm font-medium transition-colors"
                  >
                    <span className="text-base">🦊</span>
                    <div className="flex flex-col">
                      <span>Mozilla Firefox</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">AMO &amp; Temporary Add-on</span>
                    </div>
                  </Link>
                  <Link
                    href="/install#safari"
                    onClick={() => setDownloadOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-500/10 text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 text-sm font-medium transition-colors"
                  >
                    <span className="text-base">🧭</span>
                    <div className="flex flex-col">
                      <span>Apple Safari</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">macOS &amp; iOS MV3</span>
                    </div>
                  </Link>
                  <div className="pt-1 mt-1 border-t border-slate-200 dark:border-slate-800">
                    <Link
                      href="/install"
                      onClick={() => setDownloadOpen(false)}
                      className="block text-center px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      View All Downloads &amp; Source →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-nav border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 animate-fade-in shadow-xl">
          <div className="flex flex-col space-y-2">
            <Link
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Interactive Demo
            </Link>
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Features
            </Link>
            <Link
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Security Vault
            </Link>
            <Link
              href="#comparison"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Comparison
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Documentation
            </Link>
            <Link
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              FAQ
            </Link>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
              <Link
                href="/install"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 rounded-xl shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download Extension (Free)</span>
              </Link>
              <a
                href="https://github.com/stashfill/stashfill"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <Github className="w-4 h-4" />
                <span>View on GitHub</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
