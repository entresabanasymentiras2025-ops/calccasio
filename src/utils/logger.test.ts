import { describe, it, expect } from 'vitest'
import { logger } from './logger'

describe('logger', () => {
  it('records entries and can disable debug', () => {
    logger.clear()
    logger.setDebug(false)
    logger.debug('hidden')
    logger.info('shown', { a: 1n })
    expect(logger.entries()).toHaveLength(1)
    expect(logger.entries()[0].args[1]).toBe('{"a":"1n"}')
    logger.setDebug(true)
    logger.debug('now visible')
    expect(logger.entries()).toHaveLength(2)
  })
})
