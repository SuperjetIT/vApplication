const KEYS = { b2b: 'admin_b2b_profile_images', b2c: 'admin_b2c_profile_images' } as const

export type ProfileImageType = keyof typeof KEYS

function loadMap(type: ProfileImageType): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEYS[type])
    if (raw) return JSON.parse(raw) as Record<string, string>
  } catch { /* ignore */ }
  return {}
}

function saveMap(type: ProfileImageType, map: Record<string, string>) {
  localStorage.setItem(KEYS[type], JSON.stringify(map))
}

export function mergeProfileImages<T extends { id: string; profileImage?: string }>(
  items: T[],
  type: ProfileImageType,
): T[] {
  const stored = loadMap(type)
  return items.map((item) => ({
    ...item,
    profileImage: item.profileImage ?? stored[item.id],
  }))
}

export function setProfileImage(type: ProfileImageType, id: string, dataUrl: string | undefined) {
  const map = loadMap(type)
  if (dataUrl) map[id] = dataUrl
  else delete map[id]
  saveMap(type, map)
}

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file'))
      return
    }
    if (file.size > 512 * 1024) {
      reject(new Error('Image must be under 512 KB'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.readAsDataURL(file)
  })
}
