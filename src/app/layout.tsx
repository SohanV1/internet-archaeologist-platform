import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Internet Archaeologist — OSINT & Web History Platform',
  description: 'Investigate public web footprints, track domain history, tech stack evolution, and passive OSINT evidence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
