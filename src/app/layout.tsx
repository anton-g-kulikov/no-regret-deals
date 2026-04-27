import './globals.css';
import type { Metadata } from 'next';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'No Regret Deals | Bounded Alignment',
  description: 'A privacy-preserving alignment protocol for high-value agreements.',
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
