'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hämtar routen på nytt en gång efter att sidan markerat något som läst.
 *
 * Next.js återanvänder layouten vid klientnavigering, så räknarna i sidomenyn
 * beräknas bara när layouten först monteras. Markerar en sida något som läst
 * blir siffran därför kvar tills sidan laddas om helt – det ser ut som att
 * notisen inte försvinner.
 *
 * Komponenten renderas bara när något faktiskt markerades. Efter uppdateringen
 * finns inget olästt kvar, så den renderas inte igen och kan inte loopa.
 */
export default function UppdateraMeny() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [router]);

  return null;
}
