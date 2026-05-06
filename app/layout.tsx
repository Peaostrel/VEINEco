import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://vein.guru'),
  title: 'VEIN — всё своё. всё здесь.',
  description: 'всё своё - всё здесь.',
  openGraph: {
    title: 'VEIN — всё своё. всё здесь.',
    description: 'всё своё - всё здесь.',
    url: 'https://vein.guru',
    siteName: 'VEIN',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VEIN',
    description: 'всё своё - всё здесь.',
    images: ['/og.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <div className="ambient-background"></div>
        {children}
      </body>
    </html>
  );
}
