import { ApiError } from './http'

export interface RuleStep {
  ruleId: string; ruleText: string; reason: string
  conclusion: Triple; premises: Triple[]
}
export interface Triple { subject: string; predicate: string; object: string; asserted: boolean }
export interface OntologyAnswer {
  status: string; question: string; answer: string; mode: string
  slots: { crop: string; cropId: string | null; stage: string; observations: { part: string; pattern: string; first: boolean }[]; missing: string[] }
  stages: { id: string; title: string; status: string; summary: string }[]
  reasoning: null | {
    status: string; scope: string; message: string
    candidates: { id: string; label: string; nutrient: string; decision: string; prioritized: boolean; reason: string; steps: RuleStep[] }[]
    conflicts: { subject: string; type: string; reason: string; steps: RuleStep[] }[]
    classifications: { observation: string; types: string[]; steps: RuleStep[] }[]
    query: { sparql: string; rows: Record<string, string>[] } | null
    steps: RuleStep[]
  }
  evidence: { id: string; nutrient: string; crops: string[]; text: string; sourceUrl: string; score: number }[]
}

export async function askOntology(crop: string, question: string, signal: AbortSignal): Promise<OntologyAnswer> {
  const response = await fetch('/api/v1/ontology/question', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crop, question }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
  })
  const payload = await response.json()
  if (!response.ok || payload.code !== 0) throw new ApiError(payload.message || '本体服务请求失败', payload.code, payload.traceId, response.status)
  return payload.data as OntologyAnswer
}
