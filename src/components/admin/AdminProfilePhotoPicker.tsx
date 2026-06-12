import { useRef } from 'react'
import { readImageFile } from '../../utils/adminProfileImages'
import { AdminAvatar } from './AdminAvatar'
import { BRAND, BORDER, TEXT_MUTED, TEXT_SECONDARY, outlineBtn } from './adminTheme'

export function AdminProfilePhotoPicker({
  name,
  profileImage,
  onChange,
  size = 72,
}: {
  name: string
  profileImage?: string
  onChange: (dataUrl: string | undefined) => void
  size?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: '#f8f9fc', borderRadius: 16, border: `1px solid ${BORDER}` }}>
      <div style={{ position: 'relative' }}>
        <AdminAvatar name={name} size={size} fontSize={Math.round(size * 0.32)} src={profileImage} />
        {profileImage && (
          <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Profile Picture</div>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: TEXT_MUTED }}>Shown as avatar icon across the admin panel</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => inputRef.current?.click()} style={{ ...outlineBtn, padding: '6px 14px', fontSize: 12 }}>
            {profileImage ? 'Change Photo' : 'Upload Photo'}
          </button>
          {profileImage && (
            <button type="button" onClick={() => onChange(undefined)} style={{ ...outlineBtn, padding: '6px 14px', fontSize: 12, color: BRAND, borderColor: '#fce7e7' }}>
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try {
              const dataUrl = await readImageFile(file)
              onChange(dataUrl)
            } catch (err) {
              window.alert(err instanceof Error ? err.message : 'Upload failed')
            }
          }}
        />
      </div>
    </div>
  )
}
