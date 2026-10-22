import { beforeEach, describe, expect, it, vi } from 'vitest'
import { streamChat } from '../api'
import { useChat } from './useChat'

vi.mock('../api', () => ({ streamChat: vi.fn() }))

describe('禾禾对话', () => {
  beforeEach(() => { vi.mocked(streamChat).mockReset() })

  it('没有 sessionId 也能发起对话，并携带作物和原始症状', async () => {
    const chat = useChat(() => undefined, undefined, () => ({ crop: '番茄', symptomText: '病斑呈水渍状，叶背白色霉层' }))
    chat.chatInput.value = '果实上还有硬斑'
    await chat.send()
    expect(streamChat).toHaveBeenCalledWith(expect.objectContaining({ crop: '番茄', question: '果实上还有硬斑', symptomText: '病斑呈水渍状，叶背白色霉层\n补充问题：果实上还有硬斑' }), expect.any(Function), expect.any(AbortSignal))
  })

  it('在收到流式内容时立即更新禾禾气泡', async () => {
    vi.mocked(streamChat).mockImplementation(async (_request, onEvent) => {
      onEvent({ event: 'token', data: { delta: '请补充叶背情况' } })
      expect(chat.chatMessages.value[1]?.text).toBe('请补充叶背情况')
    })
    const chat = useChat(() => 'session')
    chat.chatInput.value = '帮我看看'
    await chat.send()
    expect(chat.chatMessages.value[1]?.status).toBeUndefined()
  })

  it('重置后丢弃旧请求的事件', async () => {
    vi.mocked(streamChat).mockImplementation(async (_request, onEvent) => {
      chat.reset()
      onEvent({ event: 'meta', data: { sessionId: 'old' } })
    })
    const onSession = vi.fn()
    const chat = useChat(() => undefined, onSession)
    chat.chatInput.value = '叶片出现病斑'
    await chat.send()
    expect(chat.chatMessages.value).toEqual([])
    expect(onSession).not.toHaveBeenCalled()
  })
})
