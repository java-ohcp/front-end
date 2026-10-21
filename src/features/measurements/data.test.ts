import { describe, expect, it } from 'vitest'
import { demoMeasurements, parseMeasurements } from './data'

describe('measurement result imports', () => {
  it('does not invent missing data and retains known demo provenance on reimport', () => {
    const [record] = parseMeasurements('{"id":"A","lightLux":0}', 'a.json')
    expect(record?.lightLux).toBe(0)
    expect(record?.rwc).toBeNull()
    expect(record?.history).toEqual([])
    expect(record?.origin).toBe('imported')
    expect(parseMeasurements(JSON.stringify(demoMeasurements()), 'export.json')[0]?.origin).toBe('demo')
  })
  it('requires turgid weight to calculate RWC from masses', () => {
    const [record] = parseMeasurements('{"freshWeight":0.8,"dryWeight":0.2,"turgidWeight":1}', 'a.json')
    expect(record?.rwc).toBeCloseTo(75)
    expect(() => parseMeasurements('{"freshWeight":0.8,"dryWeight":0.2}', 'a.json')).toThrow('没有可展示')
  })
  it('handles quoted CSV cells, line breaks, empty values and Chinese aliases', () => {
    const [record] = parseMeasurements('\uFEFF样本编号,样本名称,RWC,光照强度\r\nA,"田块,一\n叶片",92,', 'a.csv')
    expect(record?.name).toBe('田块,一\n叶片')
    expect(record?.rwc).toBe(92)
    expect(record?.lightLux).toBeNull()
  })
  it('rejects invalid numeric values, impossible masses and malformed CSV', () => {
    for (const data of [{ rwc: 101 }, { lightLux: 'abc' }, { soilPh: 15 }, { rwc: true }, { rwc: 92, freshWeight: 0.1, dryWeight: 0.2 }]) {
      expect(() => parseMeasurements(JSON.stringify(data), 'a.json')).toThrow()
    }
    expect(() => parseMeasurements('id,rwc\nA,"92', 'a.csv')).toThrow('未闭合')
    expect(() => parseMeasurements('id,rwc\nA,92,3', 'a.csv')).toThrow('列数')
  })
  it('retains timeline ordering and missing measurements without interpolation', () => {
    const [record] = parseMeasurements('{"history":[{"time":"08:00","rwc":92},{"time":"09:00","lightLux":30000}]}', 'a.json')
    expect(record?.history[0]?.rwc).toBe(92)
    expect(record?.history[1]?.rwc).toBeNull()
    expect(record?.history[1]?.lightLux).toBe(30000)
    expect(() => parseMeasurements('{"history":[{"rwc":92}]}', 'a.json')).toThrow('time')
    expect(() => parseMeasurements('{"history":[{"time":"08:00","soilMoisture":101}]}', 'a.json')).toThrow()
  })
  it('imports multiple records, limits batches and keeps demo data visibly separate', () => {
    expect(parseMeasurements('{"samples":[{"rwc":90},{"soilPh":6.5}]}', 'a.json')).toHaveLength(2)
    expect(() => parseMeasurements(JSON.stringify(Array(101).fill({ rwc: 90 })), 'a.json')).toThrow('1–100')
    expect(demoMeasurements().every(record => record.origin === 'demo')).toBe(true)
  })
})
