import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = { title: 'Velkine Admin', robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink font-sans text-bone antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
