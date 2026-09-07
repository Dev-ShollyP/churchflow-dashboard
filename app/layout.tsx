import type { Metadata, Viewport } from 'next';
import './globals.css';

const SUPABASE_STORAGE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers';

export const viewport: Viewport = {
  themeColor: '#050811',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'ChurchFlow | RCCG EVF Sanctuary Dashboard',
  description: 'Staff management dashboard for RCCG Everflourishing Mega Sanctuary — WhatsApp conversations, members, events, and prayer requests.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: `${SUPABASE_STORAGE_URL}/logo.png`, type: 'image/png' },
      { url: `${SUPABASE_STORAGE_URL}/icons/icon-192x192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${SUPABASE_STORAGE_URL}/icons/icon-512x512.png`, sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: `${SUPABASE_STORAGE_URL}/icons/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Church Flow',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* PWA & Mobile Home Screen Links */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href={`${SUPABASE_STORAGE_URL}/icons/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${SUPABASE_STORAGE_URL}/icons/icon-192x192.png`} />
        <link rel="icon" type="image/png" sizes="512x512" href={`${SUPABASE_STORAGE_URL}/icons/icon-512x512.png`} />
        <link rel="icon" type="image/png" href={`${SUPABASE_STORAGE_URL}/logo.png`} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Church Flow" />
      </head>
      <body className="font-body bg-navy-dark text-white antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
