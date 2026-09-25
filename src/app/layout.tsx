import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'Internet Archaeologist Platform v2.1',
  description:
    'Passive public OSINT reconnaissance engine that performs forensic analysis of domain histories, tech stack migrations, and infrastructure evolution using public records.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen selection:bg-neutral-800 selection:text-white dark:selection:bg-neutral-200 dark:selection:text-black">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
