<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { fetchKnowledge, type KnowledgeResponse } from '../api'
import KnowledgeCard from '../components/KnowledgeCard.vue'

const portraitFailed = ref<Record<string, boolean>>({})
const scientists = [
  { name: '袁隆平', field: '杂交水稻 · 心系粮食安全', image: 'https://www.qiaokou.gov.cn/qkzx/kjzx/201909/W020190918551117976744.png', source: 'https://www.qiaokou.gov.cn/qkzx/kjzx/201909/t20190918_118427.shtml', credit: '武汉市硚口区政府', story: '投身杂交水稻研究，以持续的田间探索推动水稻育种发展，让科研成果回应人们对粮食的需要。', lesson: '把稳产目标落到田间：认识营养元素的作用，结合生育期与实际长势观察作物。', tag: '一粒种子，牵系万家粮仓' },
  { name: '吴明珠', field: '瓜类育种 · 扎根农业一线', image: 'https://ybyjy.swu.edu.cn/__local/F/17/E5/A4026E858E7348AC0C8B2D932CF_0CCDEDCD_64336.png', source: 'https://ybyjy.swu.edu.cn/info/1048/1052.htm', credit: '西南大学宜宾研究院', story: '扎根新疆开展瓜类育种，收集整理地方甜瓜品种资源，把对农业的热爱融入长期研究。', lesson: '关注产量，也关注品质：学习元素知识时，同时考虑品种特点和种植环境。', tag: '把甘甜，种进土地与生活' },
  { name: '李振声', field: '小麦育种 · 坚持科研创新', image: 'https://genetics.cas.cn/sourcedb/zw/zjrc/200907/P020190506561473314137.jpg', source: 'https://genetics.cas.cn/sourcedb/zw/zjrc/200907/t20090721_2130994.html', credit: '中科院遗传发育所', story: '长期从事小麦远缘杂交研究，探索种质创新与品种改良，为粮食生产贡献科研力量。', lesson: '用证据支持判断：记录症状、核对知识来源，再结合检测与农技指导制定管理方案。', tag: '让每一次探索，扎根真实问题' },
]

const elements = ['N', 'P', 'K', 'Mg', 'Fe', 'Zn', 'Ca', 'B', 'Mn', 'Cu', 'Mo', 'S']
const active = ref('N')
const item = ref<KnowledgeResponse>()
const loading = ref(false)
const failed = ref(false)
let requestController: AbortController | undefined

async function load(element = active.value) {
  requestController?.abort()
  const controller = new AbortController()
  requestController = controller
  active.value = element
  loading.value = true
  failed.value = false
  try {
    const response = await fetchKnowledge(element, controller.signal)
    if (!controller.signal.aborted) item.value = response
  } catch { if (!controller.signal.aborted) failed.value = true }
  finally { if (!controller.signal.aborted) loading.value = false }
}

onMounted(() => void load())
onBeforeUnmount(() => requestController?.abort())
</script>

<template>
  <section class="page-content knowledge-page">
    <div class="page-heading">
      <div><div class="eyebrow"><span class="eyebrow-line"></span> FIELD LIBRARY · 科普</div><h1>认识作物的<span class="heading-accent">营养语言。</span></h1><p class="heading-copy">从元素与作物的关系，理解田间症状背后的线索。</p></div>
      <div class="season-stamp"><span>REFERENCE</span><strong>12</strong><small>营养元素索引</small></div>
    </div>

    <div class="knowledge-layout">
      <aside class="element-index panel">
        <div class="index-heading"><span class="step-label">ELEMENTS / 12</span><h2>元素索引</h2><p>选择元素查看知识条目</p></div>
        <div class="element-list"><button v-for="element in elements" :key="element" type="button" :class="{ active: element === active }" @click="load(element)"><span class="element-mini">{{ element }}</span><span>{{ ({ N: '氮', P: '磷', K: '钾', Mg: '镁', Fe: '铁', Zn: '锌', Ca: '钙', B: '硼', Mn: '锰', Cu: '铜', Mo: '钼', S: '硫' } as Record<string, string>)[element] }}</span><span class="index-arrow">→</span></button></div>
        <div class="index-footnote"><span>✳</span> 以真实知识库返回内容为准</div>
      </aside>
      <div class="knowledge-detail panel">
        <div class="detail-toolbar"><div><span class="step-label">KNOWLEDGE ENTRY</span><span class="entry-id">{{ active }}</span></div><button class="refresh-advice" type="button" :disabled="loading" aria-label="刷新知识条目" @click="load()">↻</button></div>
        <div v-if="loading" class="knowledge-loading"><span class="loading-orbit"></span><strong>正在读取知识条目</strong><small>请稍候片刻</small></div>
        <div v-else-if="failed" class="knowledge-failure"><div class="failure-mark">!</div><h2>知识条目暂时不可用</h2><p>本次失败不会影响其他页面与已经完成的诊断。</p><button class="primary-button compact-button" type="button" @click="load()">重试 <span>→</span></button></div>
        <KnowledgeCard v-else-if="item" :item="item" />
        <div class="knowledge-reference-note"><span>NOTE</span><p>条目和来源由后端知识库提供。页面不生成缺失的作物范围、诊断结论或施肥内容。</p></div>
      </div>
    </div>
    <section class="agri-stories panel" aria-labelledby="agri-stories-title">
      <div class="stories-heading">
        <div><span class="step-label">PEOPLE &amp; THE LAND · 农业人物</span><h2 id="agri-stories-title">知农爱农，把学问写在土地上。</h2><p>从农业科学家的探索出发，理解每一份收获背后的责任与坚守。</p></div>
        <span class="stories-seal">科学兴农<br>绿色同行</span>
      </div>
      <div class="scientist-grid">
        <article v-for="person in scientists" :key="person.name" class="scientist-card">
          <div class="scientist-photo">
            <img v-if="!portraitFailed[person.name]" :src="person.image" :alt="person.name + '人物照片'" loading="lazy" referrerpolicy="no-referrer" @error="portraitFailed[person.name] = true" />
            <div v-else class="portrait-fallback"><strong>{{ person.name }}</strong><span>照片暂未加载，可查看人物资料</span></div>
            <span class="scientist-tag">{{ person.tag }}</span>
          </div>
          <div class="scientist-body"><span class="scientist-field">{{ person.field }}</span><h3>{{ person.name }}</h3><p>{{ person.story }}</p><div class="scientist-lesson"><strong>联系营养管理</strong><p>{{ person.lesson }}</p></div><a :href="person.source" target="_blank" rel="noopener noreferrer">人物资料 · {{ person.credit }} ↗</a></div>
        </article>
      </div>
      <div class="field-practice"><span class="step-label">从认识到行动</span><h3>守护粮食安全，从科学管理每一株作物开始。</h3><p>查阅元素知识，记录田间表现，结合检测与当地农技指导按需施肥。把合理投入、养分高效利用与耕地保护，融入日常管理。</p></div>
    </section>
  </section>
</template>

<style scoped>
.agri-stories { margin-top: 28px; padding: 28px; }
.stories-heading { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 24px; }
.stories-heading h2 { margin: 10px 0; color: var(--green-950); font: 600 25px/1.5 'Noto Serif SC', serif; }
.stories-heading p, .field-practice p { margin: 0; color: #627263; font-size: 14px; line-height: 1.9; }
.stories-seal { flex-shrink: 0; padding: 12px; border: 1px solid #a9bea8; border-radius: 4px; color: var(--green-700); font-size: 13px; line-height: 1.8; letter-spacing: .15em; }
.scientist-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.scientist-card { overflow: hidden; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); }
.scientist-photo { position: relative; height: 250px; background: #e5ede2; }
.scientist-photo img { width: 100%; height: 100%; object-fit: cover; object-position: center 25%; }
.scientist-tag { position: absolute; bottom: 0; left: 0; right: 0; padding: 28px 16px 14px; color: white; background: linear-gradient(transparent, #1d3927e6); font-size: 13px; }
.portrait-fallback { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--green-800); }
.portrait-fallback strong { font-size: 28px; }
.portrait-fallback span { font-size: 12px; }
.scientist-body { padding: 20px; }
.scientist-field { font-size: 12px; color: var(--green-700); }
.scientist-body h3 { margin: 8px 0 12px; font: 600 23px 'Noto Serif SC', serif; }
.scientist-body p { margin: 0; font-size: 14px; line-height: 1.9; color: #627263; }
.scientist-lesson { margin: 18px 0; padding: 14px; background: var(--green-50); border-radius: 8px; }
.scientist-lesson strong { display: block; margin-bottom: 6px; color: var(--green-800); font-size: 13px; }
.scientist-body a { font-size: 12px; color: var(--green-700); text-underline-offset: 4px; }
.field-practice { margin-top: 24px; padding: 22px; border-left: 3px solid var(--green-600); background: var(--green-50); }
.field-practice h3 { margin: 8px 0; font-size: 17px; }
@media (max-width: 1100px) { .scientist-grid { grid-template-columns: 1fr; } .scientist-photo { height: 300px; } }
@media (max-width: 600px) { .agri-stories { padding: 18px; } .stories-heading h2 { font-size: 21px; } .stories-seal { display: none; } }
</style>
