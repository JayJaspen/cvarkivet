/**
 * Egen layout utan sidomeny – utskriften ska bara innehålla CV:t.
 * Rollkontrollen görs i sidan, eftersom föräldralayouten kringgås här.
 */
export default function UtskriftLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white py-8">{children}</div>;
}
