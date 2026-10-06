import { describe, it, expect } from 'vitest'
import { openMenu, navigateMenu, selectMenuItem, menuBack, renderMenuLines } from './Menu'

const items = [
  { id: 'a', label: 'Alpha', action: 'do:a' },
  { id: 'b', label: 'Beta', children: [{ id: 'b1', label: 'Beta 1', action: 'do:b1' }] },
  { id: 'c', label: 'Gamma', disabled: true },
]

describe('menu system', () => {
  it('wraps navigation', () => {
    const m = openMenu(items, 'ROOT')
    expect(navigateMenu(m, 'up').selectedIndex).toBe(2)
    expect(navigateMenu(navigateMenu(m, 'down'), 'down').selectedIndex).toBe(2)
  })
  it('selects leaves and descends into submenus', () => {
    const m = openMenu(items, 'ROOT')
    expect(selectMenuItem(m).action).toBe('do:a')
    const sub = selectMenuItem(m, 2).state
    expect(sub.path).toEqual(['ROOT', 'Beta'])
    expect(selectMenuItem(sub).action).toBe('do:b1')
    const back = menuBack(sub)
    expect(back.items).toHaveLength(3)
    expect(back.selectedIndex).toBe(1)
    expect(menuBack(back).open).toBe(false)
  })
  it('ignores disabled items', () => {
    expect(selectMenuItem(openMenu(items, 'R'), 3).action).toBeUndefined()
  })
  it('grid navigation', () => {
    const grid = openMenu([...items, ...items], 'G', 3)
    expect(navigateMenu(grid, 'down').selectedIndex).toBe(3)
    expect(navigateMenu(grid, 'right').selectedIndex).toBe(1)
  })
  it('renders numbered and windowed', () => {
    const m = navigateMenu(navigateMenu(openMenu(items, 'R'), 'down'), 'down')
    expect(renderMenuLines(m, { numbered: true, maxLines: 2 })).toEqual({ lines: ['2:Beta ›', '3:Gamma (n/a)'], selectedLine: 1 })
  })
})
