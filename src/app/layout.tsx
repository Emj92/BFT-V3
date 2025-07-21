import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import dynamic from 'next/dynamic';



const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'barriere-frei24.de - Barrierefreiheits-Prüftool',
  description: 'Prüfen Sie Ihre Website auf Barrierefreiheit nach WCAG 2.1 und BITV 2.0 Standards',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.className}>
        <LanguageProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
