<script setup lang="ts">
import type { DiseaseTriage } from '../api'
import { safeHttpUrl } from '../api/links'
defineProps<{ triage: DiseaseTriage }>()
</script>

<template>
  <section class="disease-triage" aria-label="病害方向排查">
    <span class="disease-label"><i></i>发现病害相关特征</span>
    <h3>{{ triage.candidates.length ? '建议优先排查以下病害' : '建议先进行病害排查' }}</h3>
    <p class="disease-summary">{{ triage.summary }}</p>
    <article v-for="candidate in triage.candidates" :key="candidate.id" class="disease-candidate">
      <h4>{{ candidate.name }}<span>疑似 · 待核实</span></h4>
      <div class="disease-feature-list"><span v-for="feature in candidate.matchedFeatures" :key="feature">{{ feature }}</span></div>
    </article>
    <div class="disease-next"><h4>下一步核实什么</h4><ul><li v-for="question in triage.questions" :key="question">{{ question }}</li></ul><p>照片目前用于本页观察对照，请把关键变化继续补充到症状文字中。</p></div>
    <div class="disease-actions"><h4>当前处理原则</h4><ul><li v-for="action in triage.actions" :key="action">{{ action }}</li></ul></div>
    <div v-if="triage.sources.length" class="disease-sources"><h4>参考资料</h4><a v-for="source in triage.sources" :key="source.url" :href="safeHttpUrl(source.url)" target="_blank" rel="noopener noreferrer">{{ source.title }} <span>↗</span></a></div>
    <p class="disease-disclaimer">这是基于文字与公开资料的方向提示，不构成确诊，也不自动生成用药或施肥用量。</p>
  </section>
</template>

<style scoped>
.disease-triage{padding-top:5px;color:#455642}.disease-label{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid #e6d8b5;border-radius:6px;background:#fbf6e9;color:#90753f;font-size:13px}.disease-label i{width:6px;height:6px;background:#b39458;border-radius:50%}.disease-triage h3{font:600 22px/1.5 'Noto Serif SC',serif;color:#3e5939;margin:18px 0 12px}.disease-summary{font-size:14px;line-height:1.95;color:#6b7d62}.disease-candidate{margin:20px 0;padding:17px 0;border-top:1px solid #e5ecdf;border-bottom:1px solid #e5ecdf}.disease-triage h4{font-size:15px;margin:0 0 11px;font-weight:600;color:#45623c}.disease-candidate h4{font-size:20px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}.disease-candidate h4>span{font-size:12px;font-weight:400;color:#957c4f}.disease-feature-list{display:flex;flex-wrap:wrap;gap:7px}.disease-feature-list>span{padding:5px 9px;font-size:12px;color:#617c50;background:#f0f5eb;border-radius:5px}.disease-triage ul{padding-left:19px;margin:0;color:#718268;font-size:13px;line-height:1.95}.disease-triage li+li{margin-top:6px}.disease-next>p,.disease-disclaimer{font-size:12px;color:#819074;line-height:1.8}.disease-actions,.disease-sources{margin-top:22px}.disease-sources a{display:block;font-size:13px;line-height:1.9;color:#648456;text-decoration:underline;text-underline-offset:4px}.disease-disclaimer{border-top:1px solid #e5ecdf;margin:21px 0 0;padding-top:13px}
</style>
