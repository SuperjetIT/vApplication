import { getAvatarGradient, getInitials } from '../../data/adminMockData'

export function AdminAvatar({
  name,
  size = 36,
  fontSize,
}: {
  name: string
  size?: number
  fontSize?: number
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: getAvatarGradient(name),
        color: '#fff',
        fontWeight: 700,
        fontSize: fontSize ?? Math.round(size * 0.36),
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
