import { describe, expect, it } from 'vitest'
import { formatDetail } from './useChat'

describe('formatDetail', () => {
  it('renders a candidate as text with a percentage', () => {
    expect(formatDetail('candidate', { element: 'N', elementName: '氮', confidence: 0.88 })).toBe('氮，置信度 88%')
  })

  it('omits confidence when it is missing', () => {
    expect(formatDetail('candidate', { element: 'P' })).toBe('P')
  })

  it('joins the sizheng story and value', () => {
    expect(formatDetail('sizheng', { story: '缺氮典型表现', value: '老叶先黄' })).toBe('缺氮典型表现：老叶先黄')
  })

  it('falls back instead of exposing raw JSON', () => {
    expect(formatDetail('sizheng', null)).toBe('暂无补充说明')
    expect(formatDetail('candidate', 'not-json')).toBe('未知元素')
  })
})
