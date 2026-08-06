import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChurchFlow | RCCG EVF Sanctuary Dashboard',
  description: 'Staff management dashboard for RCCG Everflourishing Mega Sanctuary — WhatsApp conversations, members, events, and prayer requests.',
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
      </head>
      <body className="font-body bg-navy-dark text-white antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
