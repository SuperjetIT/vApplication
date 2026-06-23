import { getAvatarGradient, getInitials } from '../../types/adminTypes'

export function AdminAvatar({
  name,
  size = 36,
  fontSize,
  src,
}: {
  name: string
  size?: number
  fontSize?: number
  src?: string
}) {
  const fs = fontSize ?? Math.round(size * 0.36)

  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '2px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: getAvatarGradient(name),
        color: '#fff',
        fontWeight: 700,
        fontSize: fs,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  )
}
