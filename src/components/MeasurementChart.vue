<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ points: Array<{ time: string; value: number | null }>; title: string; unit: string; demo: boolean }>()
const cursor = ref<number | null>(null)
const frame = ref<HTMLDivElement>()
const width = ref(960)
const height = 265, left = 58, right = 24, top = 24, bottom = 45
const validCount = computed(() => props.points.filter(p => p.value != null).length)
const maxY = computed(() => {
  const max = Math.max(...props.points.map(p => p.value ?? 0), 1)
  return props.unit === '%' ? 100 : Math.ceil(max / 10000) * 10000
})
const x = (index: number) => left + index / Math.max(1, props.points.length - 1) * (width.value - left - right)
const y = (value: number) => height - bottom - value / maxY.value * (height - top - bottom)
const line = computed(() => {
  let segment = false
  return props.points.map((point, index) => {
    if (point.value == null) { segment = false; return '' }
    const command = segment ? 'L' : 'M'; segment = true
    return `${command}${x(index).toFixed(2)},${y(point.value).toFixed(2)}`
  }).join(' ')
})
const active = computed(() => cursor.value == null ? undefined : props.points[cursor.value])
const tickIndexes = computed(() => {
  const count = width.value < 500 ? 4 : 7
  return [...new Set(Array.from({ length: count }, (_, i) => Math.round(i * (props.points.length - 1) / (count - 1))))]
})
function move(event: PointerEvent) {
  const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect()
  const index = ((event.clientX - rect.left) / rect.width * width.value - left) / (width.value - left - right) * (props.points.length - 1)
  cursor.value = Math.max(0, Math.min(props.points.length - 1, Math.round(index)))
}
function keyboard(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  cursor.value = Math.max(0, Math.min(props.points.length - 1, (cursor.value ?? 0) + (event.key === 'ArrowRight' ? 1 : -1)))
}
const resizeObserver = new ResizeObserver(entries => { const entry = entries[0]; if (entry) width.value = Math.max(320, entry.contentRect.width) })
watch(frame, element => { resizeObserver.disconnect(); if (element) resizeObserver.observe(element) }, { flush: 'post' })
watch(() => props.points, () => { cursor.value = null })
onBeforeUnmount(() => resizeObserver.disconnect())
</script>

<template>
  <section class="measurement-chart">
    <div class="chart-heading"><div><h3>{{ title }}变化趋势</h3><p>{{ validCount ? `${validCount} 个有效时间点 · 按文件顺序展示` : '导入带 history 时间序列的结果文件后展示' }}</p></div><span v-if="validCount" class="chart-legend"><i></i>{{ demo ? '示例趋势' : '导入记录' }}</span></div>
    <div v-if="validCount >= 2" ref="frame" class="chart-frame">
      <div class="chart-readout" aria-live="polite">{{ active ? `${active.time} / ${active.value == null ? '未提供' : active.value.toLocaleString('zh-CN', {maximumFractionDigits: 1}) + ' ' + unit}` : '悬停、触摸或使用左右方向键查看数据' }}</div>
      <svg :viewBox="`0 0 ${width} ${height}`" role="img" :aria-label="`${title}时间变化曲线，使用左右方向键读取数据`" tabindex="0" @pointermove="move" @pointerleave="cursor = null" @keydown="keyboard">
        <g v-for="i in 5" :key="`y${i}`"><line :x1="left" :x2="width-right" :y1="y((i-1)*maxY/4)" :y2="y((i-1)*maxY/4)" class="grid-line"/><text :x="left-10" :y="y((i-1)*maxY/4)+4" text-anchor="end">{{ ((i-1)*maxY/4).toLocaleString('zh-CN', {maximumFractionDigits: 0}) }}</text></g>
        <g v-for="index in tickIndexes" :key="index"><text :x="x(index)" :y="height-18" text-anchor="middle">{{ (points[index]?.time || '').slice(-16) }}</text></g>
        <text :x="left" y="13">{{ unit }}</text><text :x="width-right" :y="height-1" text-anchor="end">时间</text>
        <path :d="line" fill="none" stroke="#648b5c" stroke-width="2.8" stroke-linejoin="round"/>
        <g v-if="active && cursor != null"><line :x1="x(cursor)" :x2="x(cursor)" :y1="top" :y2="height-bottom" stroke="#b49b68" stroke-dasharray="4 4"/><circle v-if="active.value != null" :cx="x(cursor)" :cy="y(active.value)" r="5" fill="#648b5c" stroke="#fff" stroke-width="2"/></g>
      </svg>
    </div>
    <div v-else class="chart-empty">{{ validCount === 1 ? '仅有一个时间点，至少两个点才能绘制趋势。' : '暂无对应历史记录，不根据照片或单次数值生成趋势。' }}</div>
    <p class="chart-caption">{{ demo ? '此趋势使用合成示例数据。切换水分、光照、土壤，可查看不同指标。' : '缺失时间点保留空缺，不自动补齐；请核实传感器、采样时间和测量单位。' }}</p>
  </section>
</template>

<style scoped>
.measurement-chart{padding-top:27px;border-top:1px solid #e4eade}.chart-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.chart-heading h3{font-size:18px;margin:0;color:#354b33}.chart-heading p{font-size:12px;margin:5px 0 0;color:#74816d}.chart-legend{display:flex;align-items:center;gap:8px;font-size:12px;color:#68845d;white-space:nowrap}.chart-legend i{width:18px;height:3px;background:#648b5c}.chart-frame{margin-top:16px}.chart-readout{min-height:28px;text-align:right;color:#8b733f;font-size:12px;line-height:1.7}.chart-frame svg{display:block;width:100%;height:auto;touch-action:pan-y}.chart-frame svg text{fill:#74816d;font-size:12px;font-family:inherit}.grid-line{stroke:#e5ebdf;stroke-width:1}.chart-caption{color:#74816d;font-size:12px;line-height:1.8;margin:8px 0 0}.chart-empty{display:grid;place-items:center;min-height:170px;color:#74816d;font-size:14px;text-align:center;padding:20px}
</style>
