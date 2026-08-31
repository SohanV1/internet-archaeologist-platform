import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Internet Archaeologist Platform',
  description: 'Passive public OSINT reconnaissance, website evolution history, tech stack migration analysis, and subdomain intelligence platform.',
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
