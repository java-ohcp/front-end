import { expect, it } from 'vitest'
import { isLikelyGarbled } from './inputQuality'

it.each(['�叶片发黄', '@#$%^&*', '啊啊啊啊啊啊', 'asdfghjkl', 'qwertyuiop', '123456789'])('checks suspicious input: %s', (value) => {
  expect(isLikelyGarbled(value)).toBe(value !== '123456789')
})
it.each(['', '叶黄', '水稻下部老叶发黄，叶脉仍绿。', 'Older leaves are yellow.', 'pH 6.5，施肥 N-P-K 15:15:15', '叶片黄黄黄，叶脉仍绿'])('preserves ordinary input: %s', (value) => {
  expect(isLikelyGarbled(value)).toBe(false)
})

it.each([
  '怒我好东西暖色五个八度静安寺关于白哈巴 C XSAKC B吧啊 和你拉可谓是东西lu*ox bxJCSCQASHNJUWHBXDNLOUQWHX电魂魔鬼不行BGUXJUBNXCBIUJXSA BXjushcuasg尿素金色年华虚度你随便选片',
  '叶片发黄，BXJCSCQASHNJUWHBXDNLOUQWHX',
  '正常文字夹着 asdfghjkl 再继续',
])('warns for random letter sequences mixed with Chinese: %s', (value) => {
  expect(isLikelyGarbled(value)).toBe(true)
})
it.each(['叶片 chlorophyll 含量下降', 'Photosynthesis is affected by nitrogen deficiency.', '使用NPK肥，EC值正常，DNA检测完成', '叶片偏黄 https://example.com/knowledge'])('keeps scientific terms and English sentences valid: %s', (value) => {
  expect(isLikelyGarbled(value)).toBe(false)
})
