import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CVArkivet.se – hitta jobbet, hitta talangen',
  description:
    'CVArkivet.se är mötesplatsen där kandidater lägger upp sitt CV gratis och företag hittar rätt person.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
