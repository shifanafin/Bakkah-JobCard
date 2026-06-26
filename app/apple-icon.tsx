import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #C9A227, #d4b22e)',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '40px',
      }}
    >
      <span style={{ color: '#1a1a0a', fontWeight: 900, fontSize: 110, fontFamily: 'serif' }}>
        B
      </span>
    </div>,
    { ...size }
  )
}
