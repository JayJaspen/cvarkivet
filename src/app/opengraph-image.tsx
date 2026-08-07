import { ImageResponse } from 'next/og';

/**
 * Bilden som visas när någon delar en länk till cvarkivet.se i sociala medier,
 * Slack, Teams eller liknande. Genereras vid bygget.
 */
export const runtime = 'edge';
export const alt = 'CVArkivet.se – lägg upp ditt CV och låt företag hitta dig';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#FAFAF7',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              backgroundColor: '#4F7A5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FAFAF7',
              fontSize: 62,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 46, fontWeight: 600, color: '#2A2E2B' }}>
            CVArkivet<span style={{ color: '#5C8A6A' }}>.se</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 56,
            fontSize: 62,
            fontWeight: 700,
            color: '#2A2E2B',
            lineHeight: 1.15,
            maxWidth: 900,
          }}
        >
          Lägg upp ditt CV & låt företag hitta dig
        </div>

        <div style={{ marginTop: 32, fontSize: 30, color: '#65655B' }}>
          Gratis för dig som söker jobb
        </div>

        <div
          style={{
            marginTop: 'auto',
            height: 10,
            width: 220,
            borderRadius: 5,
            backgroundColor: '#C97B4A',
          }}
        />
      </div>
    ),
    size
  );
}
