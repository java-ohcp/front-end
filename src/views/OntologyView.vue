<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { askOntology, type OntologyAnswer, type Triple } from '../api/ontology'
import { safeHttpUrl } from '../api/links'

const crop = ref('水稻')
const question = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<OntologyAnswer>()
const submittedCrop = ref('')
let controller: AbortController | undefined
const stale = computed(() => !!result.value && (question.value !== result.value.question || crop.value !== submittedCrop.value))
const statuses: Record<string, string> = { CANDIDATES: '候选待复核', CONFLICT: '需澄清冲突', NEED_MORE_INFO: '需补充观察', NOT_COVERED: '尚未收录', NO_MATCH: '暂无匹配', DONE: '已完成', SKIPPED: '未执行', EMPTY: '暂无证据', UNAVAILABLE: '暂不可用' }
const decisions: Record<string, string> = { SUPPORTED: '支持复核', EXCLUDED: '本次排除', UNSUPPORTED: '暂无支持', WITHHELD: '暂停判断' }
const names: Record<string, string> = { OldLeaf: '老叶', YoungLeaf: '新叶', LeafMargin: '叶缘', UniformChlorosis: '均匀黄化', InterveinalChlorosis: '脉间失绿', MarginNecrosis: '叶缘坏死' }
const local = (value: string) => value.replace('https://ohcp.example/ontology#', '').replace('http://www.w3.org/1999/02/22-rdf-syntax-ns#', '').replace('urn:ohcp:observation', '本次观察')
const triple = (value: Triple) => `${local(value.subject)} → ${local(value.predicate)} → ${local(value.object)}`
function example(conflict = false) {
  if (loading.value) return
  crop.value = '水稻'
  question.value = conflict ? '老叶先均匀黄化；新叶先脉间失绿。' : '分蘖期，老叶先均匀黄化，植株长势偏弱。'
}
async function analyze() {
  if (loading.value || !crop.value.trim() || question.value.trim().length < 4) return
  controller?.abort()
  const current = new AbortController(); controller = current
  loading.value = true; error.value = ''; result.value = undefined
  const inputCrop = crop.value; const inputQuestion = question.value
  try {
    const response = await askOntology(inputCrop, inputQuestion, current.signal)
    if (!current.signal.aborted) { result.value = response; submittedCrop.value = inputCrop }
  } catch (failure) {
    if (!current.signal.aborted) error.value = failure instanceof Error && failure.message ? failure.message : '连接失败，请检查后端服务后重试。'
  } finally { if (controller === current) loading.value = false }
}
function cancel() { controller?.abort(); loading.value = false }
function openStage(id: string) {
  const step = document.getElementById(`ontology-stage-${id}`)
  if (step instanceof HTMLDetailsElement) { step.open = true; step.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
}
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <section class="page-content ontology-page">
    <header class="ontology-heading"><div><span class="step-label">禾诊 · 本体推理</span><h1>每个判断，都有来处。</h1><p>从观察到候选，核对本体、规则和来源，理解支持与排除的依据。</p></div><span class="ontology-version">V2 · 知识增强</span></header>
    <div class="ontology-workspace">
      <form class="panel observation-form" @submit.prevent="analyze">
        <h2>记录一次观察</h2><p class="muted">同一株作物的症状写在一起；不同部位请分句描述。</p>
        <label for="ontology-crop">作物名称</label><input id="ontology-crop" v-model="crop" maxlength="80" required :disabled="loading" placeholder="例如：水稻" />
        <label for="ontology-question">症状与先后顺序</label><textarea id="ontology-question" v-model="question" rows="6" minlength="4" maxlength="500" required :disabled="loading" placeholder="例如：老叶先均匀黄化；新叶脉间失绿。"></textarea>
        <div class="input-caption"><span>明确部位与形态，避免只写“发黄”</span><span>{{ question.length }}/500</span></div>
        <div class="example-buttons"><button type="button" :disabled="loading" @click="example()">填入观察示例</button><button type="button" :disabled="loading" @click="example(true)">填入冲突示例</button></div>
        <button class="primary-button" type="submit" :disabled="loading || !crop.trim() || question.trim().length < 4">{{ loading ? '正在核对知识与规则…' : '分析观察' }} <span aria-hidden="true">→</span></button>
        <button v-if="loading" class="text-button" type="button" @click="cancel">取消本次请求</button>
        <p class="scope-note">当前为通用症状推理，作物适用关系尚待审核。候选不是确诊，不据此生成施肥用量。</p>
      </form>

      <div class="ontology-output" :aria-busy="loading">
        <div v-if="error" class="ontology-alert error" role="alert"><strong>本次分析未完成</strong><p>{{ error }}</p><button type="button" class="text-button" @click="analyze">重试</button></div>
        <div v-if="loading" class="panel output-empty" role="status"><h2>正在核对这次观察</h2><p>服务正在解析部位、查询本体并执行规则。结果返回后可逐步展开查看。</p></div>
        <div v-else-if="!result && !error" class="panel output-empty"><span class="step-label">从观察到依据</span><h2>先记录症状，再看推理过程。</h2><p>完成分析后，这里会展示解析、查询、规则、证据和输出五个步骤。</p><ol><li>明确哪个部位、呈现什么形态</li><li>查看支持与排除候选的依据</li><li>核对来源，再决定如何继续观察</li></ol></div>
        <template v-if="result">
          <div v-if="stale" class="ontology-alert" role="status">输入已修改，下方仍是上一次观察的结果。请重新分析。</div>
          <nav class="stage-navigation" aria-label="查看分析步骤"><button v-for="(stage, index) in result.stages" :key="stage.id" type="button" @click="openStage(stage.id)"><span>{{ index + 1 }} · {{ stage.title }}</span><small>{{ statuses[stage.status] || stage.status }}</small></button></nav>
          <section class="panel answer-panel" aria-live="polite"><span class="result-state" :class="result.status.toLowerCase()">{{ statuses[result.status] || result.status }}</span><h2>这次观察的结果</h2><p>{{ result.answer }}</p><small>模板组织输出 · 未调用大模型</small></section>
          <section v-if="result.reasoning" class="panel candidate-panel"><div class="section-line"><h2>候选与排除</h2><span>仅针对本次观察</span></div>
            <article v-for="candidate in result.reasoning.candidates" :key="candidate.id" class="candidate-line" :class="candidate.decision.toLowerCase()"><div><strong>{{ candidate.label }}</strong><span class="decision-label">{{ decisions[candidate.decision] || candidate.decision }}</span><span v-if="candidate.prioritized" class="priority-label">优先复核</span></div><p>{{ candidate.reason }}</p></article>
            <div v-for="conflict in result.reasoning.conflicts" :key="conflict.subject + conflict.type" class="ontology-alert">{{ conflict.reason }}</div>
          </section>
          <section class="panel process-panel"><div class="section-line"><h2>查询与输出过程</h2><span>后端实际返回</span></div>
            <details v-for="(stage, index) in result.stages" :key="stage.id" :id="`ontology-stage-${stage.id}`" :open="stage.id === 'parse'" class="process-step"><summary><span class="step-number">{{ index + 1 }}</span><strong>{{ stage.title }}</strong><span class="stage-status">{{ statuses[stage.status] || stage.status }}</span></summary><div class="step-body"><p>{{ stage.summary }}</p>
              <template v-if="stage.id === 'parse'"><dl class="slot-list"><div><dt>作物</dt><dd>{{ result.slots.crop }}</dd></div><div><dt>生育期</dt><dd>{{ result.slots.stage || '未提供' }}</dd></div></dl><p v-for="(observation, i) in result.slots.observations" :key="i" class="observation-slot">{{ names[observation.part] || observation.part }} · {{ names[observation.pattern] || observation.pattern }} <strong v-if="observation.first">最先出现</strong></p><p v-for="missing in result.slots.missing" :key="missing" class="missing-slot">{{ missing }}</p></template>
              <template v-if="stage.id === 'query' && result.reasoning?.query"><pre>{{ result.reasoning.query.sparql }}</pre><div class="table-scroll"><table><thead><tr><th>候选</th><th>元素</th></tr></thead><tbody><tr v-for="(row, i) in result.reasoning.query.rows" :key="i"><td>{{ row.label || local(row.disorder || '') }}</td><td>{{ local(row.nutrient || '') }}</td></tr></tbody></table></div></template>
              <template v-if="stage.id === 'reason' && result.reasoning"><details v-for="(step, i) in result.reasoning.steps" :key="i" class="rule-step"><summary>{{ step.ruleId }} <span>查看前提 → 结论</span></summary><p>{{ step.reason }}</p><pre>{{ step.ruleText }}</pre><ul class="premise-list"><li v-for="(premise, j) in step.premises" :key="j"><span>{{ premise.asserted ? '已给事实' : '推导事实' }}</span>{{ triple(premise) }}</li></ul><p class="conclusion-line">结论：{{ triple(step.conclusion) }}</p></details></template>
              <template v-if="stage.id === 'evidence'"><article v-for="evidence in result.evidence" :key="evidence.id" class="evidence-item"><strong>{{ evidence.nutrient }} · {{ evidence.id }}</strong><p>{{ evidence.text }}</p><a v-if="safeHttpUrl(evidence.sourceUrl)" :href="safeHttpUrl(evidence.sourceUrl)" target="_blank" rel="noopener noreferrer">查看原始来源 ↗</a></article></template>
              <p v-if="stage.id === 'answer'">{{ result.answer }}</p>
            </div></details>
          </section>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ontology-page .step-label { color: #627263; }
.stage-navigation { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); border: 1px solid var(--line); border-radius: 8px; background: #fbfcfa; overflow: auto; }
.stage-navigation button { border: 0; border-right: 1px solid var(--line); background: transparent; padding: 12px 8px; cursor: pointer; text-align: left; }
.stage-navigation button:last-child { border-right: 0; }
.stage-navigation span { display: block; font-size: 12px; color: #345a3b; white-space: nowrap; }
.stage-navigation small { display: block; font-size: 12px; color: #627263; margin-top: 5px; }
@media(max-width:600px) { .ontology-page { padding-left: 18px; padding-right: 18px; } .stage-navigation { grid-template-columns: repeat(5, minmax(95px, 1fr)); } }

.ontology-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:28px}.ontology-heading h1{font:600 28px/1.5 'Noto Serif SC',serif;margin:8px 0}.ontology-heading p,.muted{color:#627263;font-size:14px;line-height:1.8;margin:0}.ontology-version{font-size:12px;color:#466f4c;white-space:nowrap}.ontology-workspace{display:grid;grid-template-columns:minmax(270px,340px) minmax(0,1fr);gap:24px;align-items:start}.observation-form{padding:24px;position:sticky;top:24px}.ontology-page h2{font-size:18px;margin:0 0 12px}.observation-form label{display:block;font-size:14px;font-weight:600;margin:22px 0 8px}.observation-form input,.observation-form textarea{width:100%;border:1px solid #cedbcb;border-radius:7px;padding:11px 12px;background:#fbfcfa;resize:vertical;color:var(--ink);font:inherit;font-size:14px}.input-caption{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#627263;margin-top:8px}.example-buttons{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}.example-buttons button{border:0;background:transparent;color:#466f4c;font-size:13px;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:4px}.scope-note{border-top:1px solid var(--line);margin:22px 0 0;padding-top:16px;color:#627263;font-size:12px;line-height:1.9}.ontology-output{display:grid;gap:20px;min-width:0}.output-empty,.answer-panel,.candidate-panel,.process-panel{padding:24px}.output-empty{min-height:300px}.output-empty h2{margin-top:18px}.output-empty p,.output-empty li{color:#627263;line-height:1.9;font-size:14px}.output-empty ol{padding-left:22px;margin-top:28px}.answer-panel p{font-size:15px;line-height:1.9}.answer-panel small{color:#627263;font-size:12px}.result-state{display:inline-block;font-size:12px;color:#466f4c;margin-bottom:14px}.result-state.conflict,.result-state.need_more_info{color:#946200}.section-line{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.section-line>span{font-size:12px;color:#627263}.candidate-line{padding:16px 0;border-top:1px solid var(--line)}.candidate-line>div{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.candidate-line strong{font-size:15px}.candidate-line p{font-size:13px;line-height:1.8;color:#627263;margin:8px 0 0}.decision-label,.priority-label{font-size:12px}.supported .decision-label{color:#345a3b;font-weight:600}.excluded .decision-label{color:#946200}.priority-label{color:#466f4c;background:#edf3eb;padding:2px 6px;border-radius:3px}.ontology-alert{padding:14px 16px;background:#fff8e6;border:1px solid #eed599;border-radius:8px;color:#795513;font-size:14px;line-height:1.8}.ontology-alert.error{background:#fff3ef;color:#8f3f2e;border-color:#ecd1c6}.process-step{border-top:1px solid var(--line)}summary{cursor:pointer}summary:focus-visible{outline:2px solid #5d875e;outline-offset:3px}.process-step>summary{display:flex;align-items:center;gap:12px;padding:18px 0;list-style:none}.process-step>summary:after{content:'+';font-size:18px;color:#627263}.process-step[open]>summary:after{content:'−'}.step-number{font:12px monospace;color:#627263}.process-step summary strong{font-size:14px}.stage-status{margin-left:auto;font-size:12px;color:#627263}.step-body{padding:0 0 20px 26px;min-width:0}.step-body>p{font-size:13px;line-height:1.8;color:#627263}.slot-list{display:flex;gap:32px;font-size:13px}.slot-list div{display:flex;gap:10px}.slot-list dt{color:#627263}.slot-list dd{margin:0}.observation-slot{border-left:2px solid #5d875e;padding-left:12px}.observation-slot strong{font-size:12px;margin-left:10px}.missing-slot{color:#946200!important}pre{font:12px/1.8 monospace;white-space:pre-wrap;overflow-wrap:anywhere;background:#f1f5ef;border:1px solid var(--line);border-radius:6px;padding:14px;max-width:100%}.rule-step{border-top:1px solid var(--line);padding:12px 0;font-size:13px}.rule-step summary span{font-size:12px;color:#627263;margin-left:12px}.rule-step p{line-height:1.8}.premise-list{padding-left:18px;overflow-wrap:anywhere;font:12px/1.9 monospace}.premise-list span{display:inline-block;color:#627263;margin-right:8px}.conclusion-line{font-size:12px;overflow-wrap:anywhere;color:#345a3b}.table-scroll{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}th,td{padding:10px 8px;border-bottom:1px solid var(--line);white-space:nowrap}.evidence-item{padding:16px 0;border-top:1px solid var(--line);font-size:13px}.evidence-item p{line-height:1.9;white-space:pre-wrap}.evidence-item a{color:#466f4c;text-underline-offset:4px}button:disabled{opacity:.55;cursor:not-allowed}@media(max-width:1100px){.ontology-workspace{grid-template-columns:1fr}.observation-form{position:static}}@media(max-width:600px){.ontology-heading{align-items:start}.ontology-heading h1{font-size:24px}.ontology-version{display:none}.observation-form,.output-empty,.answer-panel,.candidate-panel,.process-panel{padding:18px}.step-body{padding-left:0}.section-line{flex-wrap:wrap}.slot-list{gap:18px;flex-wrap:wrap}}
</style>
