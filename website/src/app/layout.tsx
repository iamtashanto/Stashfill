import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Stashfill — Offline, No-Login, Privacy-First Autofill Extension',
  description:
    '1-Click offline autofill for your real data. Save identity profiles, addresses, dynamic snippets, and AES-256 encrypted cards locally. Zero trackers, zero network requests, Manifest V3 ready.',
  keywords: [
    'autofill extension',
    'privacy autofill',
    'offline form filler',
    'chrome extension',
    'firefox addon',
    'react form autofill',
    'shadow dom autofill',
    'encrypted vault',
    'bangla autofill',
    'open source',
  ],
  authors: [{ name: 'Stashfill Team' }],
  metadataBase: new URL('https://stashfill.org'),
  openGraph: {
    title: 'Stashfill — Offline, No-Login, Privacy-First Autofill Extension',
    description:
      'Fill web forms in 1-click with your real personal data. 100% offline, zero accounts, zero analytics.',
    url: 'https://stashfill.org',
    siteName: 'Stashfill',
    images: [
      {
        url: '/icon-128.png',
        width: 128,
        height: 128,
        alt: 'Stashfill Icon',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Stashfill — 1-Click Offline Autofill for Your Real Data',
    description:
      'Fill web forms in 1-click. 100% offline, zero accounts, zero analytics. Works on React, Vue, & Shadow DOM.',
    images: ['/icon-128.png'],
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon-32.png',
    apple: '/icon-128.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('stashfill-theme');
                if (stored === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white dark:bg-[#080c14] text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
