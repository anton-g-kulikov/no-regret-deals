import './globals.css';
import type { Metadata } from 'next';

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
      <body>{children}</body>
    </html>
  );
}
