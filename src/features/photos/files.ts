export const MAX_PHOTOS = 4
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validatePhoto(file: Pick<File, 'size' | 'type'>): string | undefined {
  if (!PHOTO_TYPES.includes(file.type)) return '请选择 JPG、PNG 或 WebP 照片。'
  if (file.size === 0) return '照片内容为空，请重新选择。'
  if (file.size > MAX_PHOTO_BYTES) return '单张照片不能超过 8 MB。'
}
