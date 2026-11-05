import { describe, expect, it } from 'vitest'
import { addDays, defaultRange, eachDay, isIsoDate, isValidRange } from '../dates'

describe('dates', () => {
  it.each([
    ['2026-10-05', true],
    ['2024-02-29', true],
    ['2026-02-29', false],
    ['2026-13-01', false],
    ['2026-1-05', false],
    ['', false],
    [undefined, false],
  ])('isIsoDate(%s) is %s', (value, expected) => {
    expect(isIsoDate(value)).toBe(expected)
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('defaults to the 30 complete UTC days before today', () => {
    expect(defaultRange(new Date('2026-11-04T00:30:00Z'))).toEqual({
      from: '2026-10-05',
      to: '2026-11-03',
    })
  })

  it('lists every day of a range inclusively', () => {
    expect(eachDay({ from: '2026-10-30', to: '2026-11-02' })).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ])
  })

  it('lists days up to the last 4-digit year', () => {
    expect(eachDay({ from: '9999-12-30', to: '9999-12-31' })).toEqual(['9999-12-30', '9999-12-31'])
  })

  it('validates ranges', () => {
    expect(isValidRange({ from: '2026-10-05', to: '2026-10-05' })).toBe(true)
    expect(isValidRange({ from: '2026-10-06', to: '2026-10-05' })).toBe(false)
    expect(isValidRange({ from: '2026-10-05' })).toBe(false)
  })

  it('accepts ranges of up to 366 days', () => {
    expect(isValidRange({ from: '2025-11-03', to: '2026-11-03' })).toBe(true)
    expect(isValidRange({ from: '2025-11-02', to: '2026-11-03' })).toBe(false)
  })
})
