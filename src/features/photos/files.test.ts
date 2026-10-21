import { describe, expect, it } from 'vitest'
import { MAX_PHOTO_BYTES, validatePhoto } from './files'

describe('photo input boundary', () => {
  it('accepts supported photos within the size limit', () => {
    expect(validatePhoto({ type: 'image/jpeg', size: MAX_PHOTO_BYTES })).toBeUndefined()
  })
  it('rejects unsupported, empty and oversized files', () => {
    expect(validatePhoto({ type: 'image/svg+xml', size: 100 })).toBeTruthy()
    expect(validatePhoto({ type: 'image/png', size: 0 })).toBeTruthy()
    expect(validatePhoto({ type: 'image/webp', size: MAX_PHOTO_BYTES + 1 })).toBeTruthy()
  })
})
