export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024

export function readProfileImageFile(
  file: File,
  maxBytes = MAX_PROFILE_PHOTO_BYTES,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file (JPG, PNG, or WebP).'))
      return
    }
    if (file.size > maxBytes) {
      reject(new Error('JPG, PNG or WebP · max 5 MB'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read image.'))
    reader.readAsDataURL(file)
  })
}
