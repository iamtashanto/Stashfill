import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#08090d' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Stashfill — 1-Click Offline Autofill for Your Real Data',
    template: '%s | Stashfill',
  },
  description:
    'The 100% offline, privacy-first autofill browser extension. Save your profiles, addresses, dynamic snippets, and AES-256 encrypted cards locally. Zero accounts, zero telemetry, Manifest V3 ready.',
  keywords: [
    'offline autofill extension',
    'privacy form filler',
    'React form autofill',
    'Shadow DOM autofill',
    'valueTracker autofill fix',
    'Chrome autofill extension',
    'Firefox MV3 autofill',
    'encrypted card vault extension',
    'bangla autofill extension',
    'open source autofill',
  ],
  authors: [{ name: 'Stashfill Team', url: 'https://stashfill.org' }],
  creator: 'Stashfill Team',
  publisher: 'Stashfill',
  metadataBase: new URL('https://stashfill.org'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Stashfill — 1-Click Offline Autofill for Your Real Data',
    description:
      'Fill web forms in 1-click. 100% offline, zero accounts, zero analytics. Reconciles React & Vue state in under 50ms.',
    url: 'https://stashfill.org',
    siteName: 'Stashfill',
    images: [
      {
        url: '/icon-128.png',
        width: 128,
        height: 128,
        alt: 'Stashfill Offline Autofill Icon',
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const applicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Stashfill',
    operatingSystem: 'Chrome, Chromium, Firefox, Edge, Safari',
    applicationCategory: 'BrowserExtension',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    description:
      'Offline, no-login, privacy-first autofill and quick-paste browser extension. Saves identity profiles, addresses, dynamic snippets, and AES-256 encrypted cards locally.',
    softwareVersion: '1.0.0',
    license: 'https://opensource.org/licenses/MIT',
    author: {
      '@type': 'Organization',
      name: 'Stashfill Team',
      url: 'https://stashfill.org',
    },
  };

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }}
        />
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
      <body className="min-h-screen flex flex-col bg-white dark:bg-[#08090d] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-indigo-600 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
