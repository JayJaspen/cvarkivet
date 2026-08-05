import { ImageResponse } from 'next/og';

/**
 * Ikonen som används när någon sparar sidan på hemskärmen i iOS.
 * Apple stödjer inte SVG här, så den renderas som PNG vid bygget.
 */
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#4F7A5C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontSize: 132,
            fontWeight: 700,
            color: '#FAFAF7',
            lineHeight: 1,
            marginTop: -8,
          }}
        >
          A
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 58,
            width: 74,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#C97B4A',
          }}
        />
      </div>
    ),
    size
  );
}
