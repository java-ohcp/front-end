export type Category = 'water' | 'light' | 'soil'
export type MetricKey = 'rwc' | 'humidity' | 'temperature' | 'lightLux' | 'ppfd' | 'sunshineHours' | 'soilMoisture' | 'soilPh' | 'soilEc' | 'soilTemperature'
export interface Metric { key: MetricKey; name: string; unit: string; precision: number; note: string }
export interface CategoryConfig {
  id: Category; title: string; icon: string; summary: string
  primary: Metric; historyKey: 'rwc' | 'lightLux' | 'soilMoisture'; metrics: Metric[]
}
const rwc: Metric = { key: 'rwc', name: '叶片相对含水量', unit: '%', precision: 1, note: '叶片水分测量值' }
const moisture: Metric = { key: 'soilMoisture', name: '土壤含水率', unit: '%', precision: 1, note: '按原始仪器定义展示' }
const light: Metric = { key: 'lightLux', name: '光照强度', unit: 'lx', precision: 0, note: '照度测量值' }
export const categories: CategoryConfig[] = [
  { id: 'water', title: '水分', icon: '◒', summary: '关注叶片、土壤与空气中的水分变化。', primary: rwc, historyKey: 'rwc', metrics: [rwc, moisture,
    { key: 'humidity', name: '空气相对湿度', unit: '%', precision: 1, note: '采样环境记录' },
    { key: 'temperature', name: '环境温度', unit: '℃', precision: 1, note: '辅助理解水分变化' }] },
  { id: 'light', title: '光照', icon: '☀', summary: '记录光照强度、光合有效辐射与日照时长。', primary: light, historyKey: 'lightLux', metrics: [light,
    { key: 'ppfd', name: '光合光子通量密度', unit: 'μmol/(m²·s)', precision: 0, note: 'PPFD · 需专用传感器测量' },
    { key: 'sunshineHours', name: '日照时长', unit: 'h', precision: 1, note: '原始文件提供的日照记录' },
    { key: 'temperature', name: '环境温度', unit: '℃', precision: 1, note: '同一采样环境记录' }] },
  { id: 'soil', title: '土壤', icon: '▧', summary: '了解根区水分、酸碱度、温度与电导率。', primary: moisture, historyKey: 'soilMoisture', metrics: [moisture,
    { key: 'soilPh', name: '土壤酸碱度', unit: 'pH', precision: 1, note: '不等同于养分含量检测' },
    { key: 'soilTemperature', name: '土壤温度', unit: '℃', precision: 1, note: '根区温度记录' },
    { key: 'soilEc', name: '土壤电导率', unit: 'mS/cm', precision: 2, note: 'EC · 需结合检测方法解释' }] },
]
