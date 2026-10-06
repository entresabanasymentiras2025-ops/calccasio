import type { KeyboardLayout } from './core/CalculatorKeyboard'
import type { ScreenProfile } from './core/CalculatorDisplay'
import type { CalculatorModelConfig } from '../models/types'
import { calculatorCatalog } from '../models/calculatorCatalog'

/**
 * Plugin-style registries so new models, keyboards and display profiles
 * can be added without touching the core. Engines are registered in
 * engineRegistry.ts (registerEngine) and math functions in the evaluator
 * (registerFunction).
 */
const keyboards = new Map<string, KeyboardLayout>()
const displays = new Map<string, ScreenProfile>()

export function registerKeyboardLayout(layout: KeyboardLayout): void {
  keyboards.set(layout.id, layout)
}

export function getKeyboardLayout(id: string): KeyboardLayout | undefined {
  return keyboards.get(id)
}

/** Returns the registered layout for a model's keyboardProfile, or the engine's default. */
export function layoutFor(config: CalculatorModelConfig, fallback: KeyboardLayout): KeyboardLayout {
  return keyboards.get(config.keyboardProfile) ?? fallback
}

export function registerDisplayProfile(profile: ScreenProfile): void {
  displays.set(profile.id, profile)
}

export function getDisplayProfile(id: string): ScreenProfile | undefined {
  return displays.get(id)
}

export function registerCalculator(config: CalculatorModelConfig): void {
  if (calculatorCatalog.some((c) => c.id === config.id)) throw new Error(`Calculator "${config.id}" is already registered`)
  if (!/^[a-z0-9-]+$/.test(config.id)) throw new Error(`Invalid calculator id "${config.id}"`)
  calculatorCatalog.push(config)
}

// Built-in screen profiles (dimensions from public product specifications; colors are our own).
registerDisplayProfile({ id: 'graph9860', width: 128, height: 64, color: false, background: '#c8d4bc', foreground: '#1b2414' })
registerDisplayProfile({ id: 'cg50', width: 384, height: 216, color: true, background: '#fbfcff', foreground: '#14181f' })
registerDisplayProfile({ id: 'cg100', width: 384, height: 216, color: true, background: '#ffffff', foreground: '#101418' })
registerDisplayProfile({ id: 'classpad', width: 320, height: 528, color: true, background: '#ffffff', foreground: '#111111' })
