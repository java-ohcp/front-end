import { describe, expect, it, vi } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ElementPlus, { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'
import DiagnoseView from './DiagnoseView.vue'

const state = vi.hoisted(() => ({ decision: '', loading: false, error: '' }))
vi.mock('../composables/useDiagnosis', async (importOriginal) => {
  const original = await importOriginal<typeof import('../composables/useDiagnosis')>()
  return { ...original, useDiagnosis: (...args: Parameters<typeof original.useDiagnosis>) => {
    const diagnosis = original.useDiagnosis(...args)
    if (state.decision) diagnosis.result.value = { decision: state.decision as import('../api').Decision, candidates: [] }
    diagnosis.loading.value = state.loading
    diagnosis.errorText.value = state.error
    return diagnosis
  } }
})

describe('禾禾入口', () => {
  it.each(['', 'CONFIRMED', 'DISEASE_SUSPECTED', 'NEED_MORE_INFO', 'NO_MATCH', 'loading', 'error'])('在 %s 状态且无会话编号时仍显示禾禾', async (scenario) => {
    Object.assign(state, { decision: ['loading', 'error'].includes(scenario) ? '' : scenario, loading: scenario === 'loading', error: scenario === 'error' ? '网络异常' : '' })
    const app = createSSRApp(DiagnoseView)
    app.use(ElementPlus)
    app.provide(ID_INJECTION_KEY, { prefix: 0, current: 0 })
    app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
    const html = await renderToString(app)
    expect(html).toContain('禾禾')
    expect(html).toContain('chat-composer')
  })
})
