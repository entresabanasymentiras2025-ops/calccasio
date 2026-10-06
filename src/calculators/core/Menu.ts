import type { MenuItem, MenuState } from './CalculatorState'

/**
 * Pure menu navigation used by every engine (MODE menus, SETUP, OPTN,
 * graphing MAIN MENU, financial mode lists...). A menu is a stack of
 * levels; each level is a list of MenuItem. Selecting an item either
 * descends into its `children` or returns its `action` for the engine to
 * perform. None of this knows about rendering — see renderMenuLines() for
 * the text renderer and the UI's canvas renderer for graphing screens.
 */
export type MenuNavigation = 'up' | 'down' | 'left' | 'right'

export interface MenuSelection {
  state: MenuState
  /** Set when a leaf item was chosen; the engine performs it and usually closes the menu. */
  action?: string
  item?: MenuItem
}

export function openMenu(items: MenuItem[], title: string, columns = 1): MenuState {
  return { open: true, path: [title], items, selectedIndex: 0, stack: [], columns }
}

export function navigateMenu(menu: MenuState, dir: MenuNavigation): MenuState {
  const n = menu.items.length
  if (n === 0) return menu
  const cols = menu.columns ?? 1
  let i = menu.selectedIndex
  if (cols === 1) {
    if (dir === 'up') i = (i - 1 + n) % n
    if (dir === 'down') i = (i + 1) % n
  } else {
    if (dir === 'left') i = (i - 1 + n) % n
    if (dir === 'right') i = (i + 1) % n
    if (dir === 'up') i = i - cols >= 0 ? i - cols : i
    if (dir === 'down') i = i + cols < n ? i + cols : i
  }
  return { ...menu, selectedIndex: i }
}

/** Selects the highlighted item (or the item with the given 1-based shortcut digit). */
export function selectMenuItem(menu: MenuState, shortcut?: number): MenuSelection {
  const index = shortcut !== undefined ? shortcut - 1 : menu.selectedIndex
  const item = menu.items[index]
  if (!item || item.disabled) return { state: menu }
  if (item.children && item.children.length > 0) {
    return {
      state: {
        ...menu,
        stack: [...(menu.stack ?? []), { items: menu.items, selectedIndex: index, title: menu.path[menu.path.length - 1] }],
        path: [...menu.path, item.label],
        items: item.children,
        selectedIndex: 0,
      },
    }
  }
  return { state: { ...menu, selectedIndex: index }, action: item.action ?? item.id, item }
}

/** Goes up one level; returns a closed menu when already at the root. */
export function menuBack(menu: MenuState): MenuState {
  const stack = menu.stack ?? []
  if (stack.length === 0) return closeMenu(menu)
  const parent = stack[stack.length - 1]
  return { ...menu, items: parent.items, selectedIndex: parent.selectedIndex, stack: stack.slice(0, -1), path: menu.path.slice(0, -1) }
}

export function closeMenu(menu: MenuState): MenuState {
  return { ...menu, open: false, stack: [], path: [], selectedIndex: 0 }
}

export interface MenuRenderOptions {
  numbered?: boolean
  maxLines?: number
}

/** Text renderer for menus on character displays; keeps the selection in view. */
export function renderMenuLines(menu: MenuState, opts: MenuRenderOptions = {}): { lines: string[]; selectedLine: number } {
  const all = menu.items.map((item, i) => {
    const prefix = opts.numbered ? `${i + 1}:` : i === menu.selectedIndex ? '▸ ' : '  '
    return `${prefix}${item.label}${item.children ? ' ›' : ''}${item.disabled ? ' (n/a)' : ''}`
  })
  const max = opts.maxLines ?? all.length
  const start = Math.max(0, Math.min(menu.selectedIndex - max + 1, all.length - max))
  const visible = all.slice(Math.max(0, start), Math.max(0, start) + max)
  return { lines: visible, selectedLine: menu.selectedIndex - Math.max(0, start) }
}
