/**
 * Tiny leveled logger. `debug` is silent in production builds unless
 * explicitly enabled (the dev inspector toggles it at runtime). Log
 * entries are also kept in a bounded ring buffer so the inspector can
 * show them without a devtools console.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  time: number
  args: string[]
}

const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD === true
let debugEnabled = !isProd
const buffer: LogEntry[] = []
const MAX = 200
const listeners = new Set<() => void>()

function stringify(a: unknown): string {
  if (typeof a === 'string') return a
  try {
    return JSON.stringify(a, (_k, v) => (typeof v === 'bigint' ? `${v}n` : v))
  } catch {
    return String(a)
  }
}

function record(level: LogLevel, args: unknown[]): void {
  buffer.push({ level, time: Date.now(), args: args.map(stringify) })
  if (buffer.length > MAX) buffer.shift()
  listeners.forEach((l) => l())
}

export const logger = {
  debug(...args: unknown[]) {
    if (!debugEnabled) return
    record('debug', args)
  },
  info(...args: unknown[]) {
    record('info', args)
  },
  warn(...args: unknown[]) {
    record('warn', args)
    console.warn('[hub]', ...args)
  },
  error(...args: unknown[]) {
    record('error', args)
    console.error('[hub]', ...args)
  },
  setDebug(enabled: boolean) {
    debugEnabled = enabled
  },
  isDebugEnabled() {
    return debugEnabled
  },
  entries(): readonly LogEntry[] {
    return buffer
  },
  clear() {
    buffer.length = 0
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
