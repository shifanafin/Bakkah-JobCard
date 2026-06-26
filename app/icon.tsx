import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#C9A227',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
      }}
    >
      <span style={{ color: '#1a1a0a', fontWeight: 900, fontSize: 22, fontFamily: 'serif' }}>
        B
      </span>
    </div>,
    { ...size }
  )
}
