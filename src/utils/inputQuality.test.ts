import { expect, it } from 'vitest'
import { isLikelyGarbled } from './inputQuality'

it.each(['�叶片发黄', '@#$%^&*', '啊啊啊啊啊啊', 'asdfghjkl', 'qwertyuiop', '123456789'])('checks suspicious input: %s', (value) => {
  expect(isLikelyGarbled(value)).toBe(value !== '123456789')
})
it.each(['', '叶黄', '水稻下部老叶发黄，叶脉仍绿。', 'Older leaves are yellow.', 'pH 6.5，施肥 N-P-K 15:15:15', '叶片黄黄黄，叶脉仍绿'])('preserves ordinary input: %s', (value) => {
  expect(isLikelyGarbled(value)).toBe(false)
})
