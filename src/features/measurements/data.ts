export interface HistoryPoint { time: string; rwc: number | null; lightLux: number | null; soilMoisture: number | null }
export interface Measurement {
  id: string
  name: string
  crop: string
  variety: string
  stage: string
  treatment: string
  measuredAt: string
  temperature: number | null
  humidity: number | null
  freshWeight: number | null
  dryWeight: number | null
  turgidWeight: number | null
  rwc: number | null
  lightLux: number | null
  ppfd: number | null
  sunshineHours: number | null
  soilMoisture: number | null
  soilPh: number | null
  soilEc: number | null
  soilTemperature: number | null
  history: HistoryPoint[]
  origin: 'demo' | 'imported'
}

const aliases: Record<string, string[]> = {
  id: ['id', 'sampleId', '样本编号'], name: ['name', 'sampleName', '样本名称'],
  crop: ['crop', '作物'], variety: ['variety', '品种'], stage: ['stage', '生育期'],
  treatment: ['treatment', '水分处理'], measuredAt: ['measuredAt', '测量时间'],
  temperature: ['temperature', '环境温度'], humidity: ['humidity', '环境湿度'],
  freshWeight: ['freshWeight', '鲜重'], dryWeight: ['dryWeight', '干重'],
  turgidWeight: ['turgidWeight', '饱和鲜重'], rwc: ['rwc', 'RWC', '相对含水量'],
  lightLux: ['lightLux', '光照强度'], ppfd: ['ppfd', 'PPFD'], sunshineHours: ['sunshineHours', '日照时长'],
  soilMoisture: ['soilMoisture', '土壤含水率'], soilPh: ['soilPh', '土壤pH'],
  soilEc: ['soilEc', '土壤电导率'], soilTemperature: ['soilTemperature', '土壤温度'],
}

function value(row: Record<string, unknown>, key: string): unknown {
  for (const alias of aliases[key] ?? [key]) if (Object.hasOwn(row, alias)) return row[alias]
}
function text(row: Record<string, unknown>, key: string): string {
  const result = value(row, key)
  return typeof result === 'string' || typeof result === 'number' ? String(result).slice(0, 200) : ''
}
function numeric(raw: unknown, label: string, min: number, max: number): number | null {
  if (raw == null || (typeof raw === 'string' && !raw.trim())) return null
  if (typeof raw !== 'number' && typeof raw !== 'string') throw new Error(`${label} 必须为数字。`)
  const result = Number(raw)
  if (!Number.isFinite(result) || result < min || result > max) throw new Error(`${label} 需在 ${min}–${max} 范围内。`)
  return result
}

function normalize(raw: unknown, index: number): Measurement {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`第 ${index + 1} 条样本格式无效。`)
  const row = raw as Record<string, unknown>
  const number = (key: string, min: number, max: number) => numeric(value(row, key), key, min, max)
  const freshWeight = number('freshWeight', 0, 1e6)
  const dryWeight = number('dryWeight', 0, 1e6)
  const turgidWeight = number('turgidWeight', 0, 1e6)
  let rwc = number('rwc', 0, 100)
  if (freshWeight != null && dryWeight != null && freshWeight < dryWeight) throw new Error('鲜重不能小于干重。')
  if (turgidWeight != null && freshWeight != null && turgidWeight < freshWeight) throw new Error('饱和鲜重不能小于鲜重。')
  if (rwc == null && freshWeight != null && dryWeight != null && turgidWeight != null) {
    if (turgidWeight <= dryWeight) throw new Error('饱和鲜重必须大于干重，才能计算 RWC。')
    rwc = 100 * (freshWeight - dryWeight) / (turgidWeight - dryWeight)
  }
  const rawHistory = row.history ?? row.历史记录 ?? []
  if (!Array.isArray(rawHistory) || rawHistory.length > 2000) throw new Error('历史记录必须为数组，每个样本最多 2000 个时间点。')
  const history = rawHistory.map((point: unknown) => {
    if (!point || typeof point !== 'object' || Array.isArray(point)) throw new Error('历史记录格式无效。')
    const data = point as Record<string, unknown>
    if (typeof data.time !== 'string' || !data.time.trim() || data.time.length > 100) throw new Error('历史记录需提供有效 time 时间标签。')
    return { time: data.time, rwc: numeric(data.rwc, '历史 RWC', 0, 100),
      lightLux: numeric(data.lightLux, '历史光照强度', 0, 1e6), soilMoisture: numeric(data.soilMoisture, '历史土壤含水率', 0, 100) }
  })
  const result: Measurement = {
    id: text(row, 'id') || `sample-${index + 1}`, name: text(row, 'name'), crop: text(row, 'crop'),
    variety: text(row, 'variety'), stage: text(row, 'stage'), treatment: text(row, 'treatment'),
    measuredAt: text(row, 'measuredAt'), temperature: number('temperature', -80, 80), humidity: number('humidity', 0, 100),
    freshWeight, dryWeight, turgidWeight, rwc, lightLux: number('lightLux', 0, 1e6),
    ppfd: number('ppfd', 0, 10000), sunshineHours: number('sunshineHours', 0, 24),
    soilMoisture: number('soilMoisture', 0, 100), soilPh: number('soilPh', 0, 14), soilEc: number('soilEc', 0, 100),
    soilTemperature: number('soilTemperature', -80, 80), history, origin: row.origin === 'demo' ? 'demo' : 'imported',
  }
  if (['rwc', 'lightLux', 'soilMoisture', 'ppfd', 'sunshineHours', 'soilPh', 'soilEc', 'soilTemperature', 'humidity', 'temperature'].every(key => result[key as keyof Measurement] == null) && !history.some(point => point.rwc != null || point.lightLux != null || point.soilMoisture != null)) {
    throw new Error(`样本 ${result.id} 没有可展示的水分、光照或土壤指标。`)
  }
  return result
}

/** RFC-style quoted cells, including escaped quotes and embedded line breaks. */
function csvRows(input: string): string[][] {
  const firstLine = input.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = firstLine.includes('\t') ? '\t' : ','
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false, closed = false
  for (let i = 0; i < input.length; i++) {
    const character = input[i]!
    if (quoted) {
      if (character === '"' && input[i + 1] === '"') { cell += '"'; i++ }
      else if (character === '"') { quoted = false; closed = true }
      else cell += character
    } else if (character === '"') {
      if (cell.length || closed) throw new Error('CSV 引号格式无效。')
      quoted = true
    } else if (character === delimiter) { row.push(cell); cell = ''; closed = false }
    else if (character === '\n' || character === '\r') {
      if (character === '\r' && input[i + 1] === '\n') i++
      row.push(cell); if (row.some(value => value.trim())) rows.push(row)
      row = []; cell = ''; closed = false
    } else {
      if (closed && character.trim()) throw new Error('CSV 引号后存在额外字符。')
      if (!closed) cell += character
    }
  }
  if (quoted) throw new Error('CSV 引号未闭合。')
  row.push(cell); if (row.some(value => value.trim())) rows.push(row)
  return rows
}

export function parseMeasurements(content: string, filename: string): Measurement[] {
  if (content.length > 2_000_000) throw new Error('结果文件不能超过 2 MB。')
  const clean = content.replace(/^\uFEFF/, '').trim()
  if (!clean) throw new Error('结果文件为空。')
  let records: unknown[]
  if (filename.toLowerCase().endsWith('.json')) {
    let data: unknown
    try { data = JSON.parse(clean) } catch { throw new Error('JSON 格式有误，请检查文件。') }
    if (Array.isArray(data)) records = data
    else if (data && typeof data === 'object') {
      const wrapped = (data as Record<string, unknown>).samples ?? (data as Record<string, unknown>).records
      if (wrapped !== undefined && !Array.isArray(wrapped)) throw new Error('samples / records 必须为数组。')
      records = Array.isArray(wrapped) ? wrapped : [data]
    } else throw new Error('JSON 必须为样本对象或样本数组。')
  } else if (/\.(csv|tsv|txt)$/i.test(filename)) {
    const rows = csvRows(clean)
    const header = rows.shift()?.map(value => value.trim()) ?? []
    if (new Set(header).size !== header.length || header.some(value => !value)) throw new Error('CSV 表头不能重复或为空。')
    records = rows.map(row => {
      if (row.length !== header.length) throw new Error('CSV 数据列数与表头不一致。')
      return Object.fromEntries(header.map((key, i) => [key, row[i]]))
    })
  } else throw new Error('请导入 JSON、CSV 或 TSV 结果文件。')
  if (!records.length || records.length > 100) throw new Error('每个文件需包含 1–100 条样本。')
  return records.map(normalize)
}

export function demoMeasurements(): Measurement[] {
  return [92, 81, 72].map((rwc, index) => ({
    id: `DEMO-0${index + 1}`, name: ['对照样本', '观察样本 A', '观察样本 B'][index]!,
    crop: '水稻', variety: '川康优 6308（示例）', stage: '抽穗期', treatment: ['正常供水', '供水处理 A', '供水处理 B'][index]!,
    measuredAt: '2026-09-10 10:00', temperature: 28.5, humidity: 72,
    freshWeight: 0.846 - index * 0.07, dryWeight: 0.16, turgidWeight: null, rwc,
    lightLux: 32500 - index * 5200, ppfd: 620 - index * 80, sunshineHours: 7.2 - index * 0.5,
    soilMoisture: 34.6 - index * 5.5, soilPh: 6.5 + index * 0.2,
    soilEc: 0.82 + index * 0.12, soilTemperature: 24.8 + index * 0.8, origin: 'demo',
    history: Array.from({ length: 13 }, (_, i) => {
      const time = `${String(6 + i).padStart(2, '0')}:00`
      return { time, rwc: rwc - 2 + 2 * Math.cos(i / 2),
        lightLux: Math.max(0, (32500 - index * 5200) * Math.sin(Math.PI * i / 12)),
        soilMoisture: 38 - index * 5.5 - i * 0.28 + 0.6 * Math.sin(i) }
    }),
  }))
}

export function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = filename; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
