/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { describe, expect, test } from 'vitest'

import { getLogCacheHitRate } from '../format'

describe('getLogCacheHitRate', () => {
  test('uses the normalized input total when the log carries one', () => {
    const hit = getLogCacheHitRate(
      { cache_tokens: 314, input_tokens_total: 1000 },
      1000
    )
    expect(hit).toEqual({
      rate: 31.4,
      cacheReadTokens: 314,
      inputTokens: 1000,
    })
  })

  test('falls back to prompt tokens for OpenAI-style prompts that include cache reads', () => {
    const hit = getLogCacheHitRate({ cache_tokens: 300 }, 1000)
    expect(hit?.rate).toBe(30)
  })

  test('adds cache reads and writes for Claude usage semantics', () => {
    const hit = getLogCacheHitRate(
      {
        cache_tokens: 500,
        cache_creation_tokens: 200,
        usage_semantic: 'anthropic',
      },
      300
    )
    expect(hit).toEqual({
      rate: 50,
      cacheReadTokens: 500,
      inputTokens: 1000,
    })
  })

  test('keeps the larger of the combined and split cache write counts', () => {
    const hit = getLogCacheHitRate(
      {
        cache_tokens: 100,
        cache_creation_tokens: 900,
        cache_creation_tokens_5m: 100,
        cache_creation_tokens_1h: 100,
        claude: true,
      },
      100
    )
    expect(hit?.inputTokens).toBe(1100)
  })

  test('returns null when the request had no cache read', () => {
    expect(getLogCacheHitRate({ input_tokens_total: 1000 }, 1000)).toBeNull()
    expect(getLogCacheHitRate(null, 1000)).toBeNull()
  })

  test('returns null when there is no input total to divide by', () => {
    expect(getLogCacheHitRate({ cache_tokens: 30 }, 0)).toBeNull()
  })

  test('caps upstream counts that exceed the input total', () => {
    expect(
      getLogCacheHitRate({ cache_tokens: 200, input_tokens_total: 100 }, 100)
        ?.rate
    ).toBe(100)
  })
})
