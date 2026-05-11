import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const dim = size === '512' ? 512 : 192;
  const fontSize = dim === 512 ? 200 : 76;
  const radius = dim === 512 ? 100 : 38;

  return new ImageResponse(
    (
      <div
        style={{
          width: dim,
          height: dim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          borderRadius: radius,
        }}
      >
        <span
          style={{
            fontFamily: 'sans-serif',
            fontWeight: 700,
            fontSize,
            color: '#ffffff',
            letterSpacing: '-4px',
          }}
        >
          WM
        </span>
      </div>
    ),
    { width: dim, height: dim }
  );
}
