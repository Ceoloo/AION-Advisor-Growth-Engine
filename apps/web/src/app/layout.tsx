import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AION Advisor Growth Engine',
  description:
    'AI-powered lead generation, client management, and sales automation for financial advisors and insurance professionals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
