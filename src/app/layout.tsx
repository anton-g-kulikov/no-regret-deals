import './globals.css';
import './navbar.css';
import './footer.css';
import './landing.css';
import './create.css';
import './deal.css';
import './protocol.css';
import type { Metadata } from 'next';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'No Regret Deals | Private Alignment Protocol',
  description: 'A privacy-preserving alignment protocol for high-value agreements.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-wrapper">
          <Navbar />
          <main className="content-wrapper">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
