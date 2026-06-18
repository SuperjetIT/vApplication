import { useState } from 'react'
import { flagEmoji, flagUrl, resolveFlagCode } from '../utils/flags'

type CountryFlagSize = 'sm' | 'md' | 'lg'

const SIZE_MAP: Record<CountryFlagSize, { w: number; h: number; fontSize: number; radius: number }> = {
  sm: { w: 20, h: 14, fontSize: 14, radius: 3 },
  md: { w: 28, h: 20, fontSize: 18, radius: 4 },
  lg: { w: 36, h: 26, fontSize: 22, radius: 5 },
}

type CountryFlagProps = {
  code: string
  countryName?: string
  size?: CountryFlagSize
}

export function CountryFlag({ code, countryName, size = 'md' }: CountryFlagProps) {
  const resolved = resolveFlagCode(code, countryName)
  const [failed, setFailed] = useState(false)
  const { w, h, fontSize, radius } = SIZE_MAP[size]

  const frameStyle = {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: w,
    height: h,
    borderRadius: radius,
    overflow: 'hidden' as const,
    border: '1px solid rgba(0,0,0,0.1)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    flexShrink: 0,
    background: '#f3f4f6',
  }

  if (!resolved || failed) {
    return (
      <span style={{ ...frameStyle, fontSize, lineHeight: 1 }} aria-hidden>
        {flagEmoji(code, countryName)}
      </span>
    )
  }

  return (
    <span style={frameStyle} aria-hidden>
      <img
        src={flagUrl(resolved, Math.max(w * 2, 40))}
        alt=""
        width={w}
        height={h}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </span>
  )
}
