import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hao Hao',
  description: 'Personal website of Hao Hao',
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
