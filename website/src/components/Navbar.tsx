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
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled 
          ? 'crisp-glass border-b border-zinc-200/80 dark:border-white/[0.08]' 
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Technical Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 p-1 border border-zinc-700/50 dark:border-zinc-300">
              <Image 
                src="/icon.svg" 
                alt="Stashfill Logo" 
                width={20} 
                height={20} 
                className="w-5 h-5 object-contain"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold tracking-tight text-zinc-950 dark:text-white font-mono">
                stashfill
              </span>
              <span className="hidden sm:inline-block font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                v1.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Clean Separate Routes (No # tags) */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link 
              href="/comparison" 
              className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
            >
              Comparison
            </Link>
            <Link 
              href="/architecture" 
              className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
            >
              Architecture
            </Link>
            <Link 
              href="/security" 
              className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
            >
              Security
            </Link>
            <Link 
              href="/docs" 
              className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
            >
              Docs
            </Link>
            <Link 
              href="/faq" 
              className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* Actions Bar */}
          <div className="hidden md:flex items-center gap-2.5">
            <ThemeToggle />

            {/* GitHub Repo */}
            <a
              href="https://github.com/stashfill/stashfill"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-mono"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>

            {/* Download Button */}
            <div className="relative">
              <button
                onClick={() => setDownloadOpen(!downloadOpen)}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-950 dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg transition-all active:scale-95 border border-zinc-800 dark:border-white shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${downloadOpen ? 'rotate-180' : ''}`} />
              </button>

              {downloadOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl tech-card shadow-xl p-1.5 z-50 animate-fade-in"
                  onMouseLeave={() => setDownloadOpen(false)}
                >
                  <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Select Target Browser
                  </div>
                  <Link
                    href="/install?browser=chrome"
                    onClick={() => setDownloadOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    <span>🌐</span>
                    <span>Chrome &amp; Chromium</span>
                  </Link>
                  <Link
                    href="/install?browser=firefox"
                    onClick={() => setDownloadOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    <span>🦊</span>
                    <span>Mozilla Firefox</span>
                  </Link>
                  <Link
                    href="/install?browser=safari"
                    onClick={() => setDownloadOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    <span>🧭</span>
                    <span>Apple Safari</span>
                  </Link>
                  <div className="pt-1 mt-1 border-t border-zinc-100 dark:border-white/[0.06]">
                    <Link
                      href="/install"
                      onClick={() => setDownloadOpen(false)}
                      className="block text-center px-2 py-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                    >
                      All Downloads &amp; Sources →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden crisp-glass border-b border-zinc-200 dark:border-white/[0.08] px-4 py-4 space-y-2">
          <Link
            href="/comparison"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Comparison Matrix
          </Link>
          <Link
            href="/architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Systems Architecture
          </Link>
          <Link
            href="/security"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Security &amp; Vault
          </Link>
          <Link
            href="/docs"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Documentation
          </Link>
          <Link
            href="/faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            FAQ
          </Link>
          <Link
            href="/install"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs mt-3"
          >
            Install Extension
          </Link>
        </div>
      )}
    </header>
  );
}
