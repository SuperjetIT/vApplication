const AVATAR_COLORS = [
  '#f93e42',
  '#5057ea',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#4f46e5',
]

export function getInitials(email: string, name?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  const local = email.split('@')[0] ?? ''
  const chunks = local.replace(/[^a-zA-Z]/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (chunks.length >= 2) {
    return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase()
  }
  return local.slice(0, 2).toUpperCase() || 'U'
}

export function getAvatarColor(email: string): string {
  let hash = 0
  for (let i = 0; i < email.length; i += 1) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function getDisplayName(email: string, name?: string): string {
  if (name?.trim()) return name.trim()
  const local = email.split('@')[0] ?? 'User'
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
