import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download & Installation Guides — Google Chrome, Firefox, Edge, Safari',
  description:
    'Step-by-step browser installation instructions for Stashfill. Download unpacked builds, install from stores, or compile for Apple Safari using xcrun.',
  keywords: [
    'download Stashfill',
    'install Chrome extension unpacked',
    'Firefox MV3 temporary addon',
    'Safari web extension converter',
    'Edge extension install',
  ],
  alternates: {
    canonical: 'https://stashfill.org/install',
  },
  openGraph: {
    title: 'Install Stashfill Extension on Your Browser',
    description:
      'Official packages for Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari.',
    url: 'https://stashfill.org/install',
  },
};

export default function InstallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
