/** Conservative checks for obvious corruption; ordinary Chinese and English remain valid. */
export function isLikelyGarbled(value: string): boolean {
  const text = value.trim()
  if (!text) return false
  if (/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(text)) return true
  const compact = Array.from(text.replace(/\s/gu, ''))
  if (compact.length < 4) return false
  const letters = compact.filter((char) => /[\p{L}\p{N}]/u.test(char)).length
  if (letters / compact.length < 0.3) return true
  if (/^(.)\1{5,}$/u.test(compact.join(''))) return true
  return /^(?:[a-z]*?(?:asdf|qwer|zxcv|hjkl)[a-z]*)$/iu.test(compact.join(''))
}
