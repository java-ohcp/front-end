import { afterEach, expect, it, vi } from 'vitest'
import { askOntology } from './ontology'
afterEach(() => vi.unstubAllGlobals())
it('uses the real ontology endpoint outside the FE adapter prefix', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 0, data: { status: 'CONFLICT' } }) })
  vi.stubGlobal('fetch', fetch)
  const result = await askOntology('水稻', '老叶先均匀黄化', new AbortController().signal)
  expect(result.status).toBe('CONFLICT')
  expect(fetch).toHaveBeenCalledWith('/api/v1/ontology/question', expect.objectContaining({ method: 'POST', body: JSON.stringify({ crop: '水稻', question: '老叶先均匀黄化' }) }))
})
it('surfaces service failures instead of displaying an empty success', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ code: 2001, message: '本体服务暂不可用' }) }))
  await expect(askOntology('水稻', '老叶先均匀黄化', new AbortController().signal)).rejects.toThrow('本体服务暂不可用')
})
