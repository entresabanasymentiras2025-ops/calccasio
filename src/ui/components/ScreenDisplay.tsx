import { useEffect, useRef } from 'react'
import type { ScreenDisplayState, ScreenContent } from '../../calculators/core/CalculatorDisplay'

/**
 * Dot-matrix screen renderer for graphing engines. It draws the engine's
 * ScreenDisplayState at the profile's native resolution on a <canvas>
 * (scaled up with crisp pixels), plus an off-screen text transcript for
 * screen readers and tests. All geometry comes from the engine.
 */
export default function ScreenDisplay({ display }: { display: ScreenDisplayState }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { profile } = display

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    draw(ctx, display)
  }, [display])

  return (
    <div className="rounded-lg p-2 shadow-inner" style={{ background: profile.background }}>
      <canvas
        ref={ref}
        width={profile.width}
        height={profile.height}
        className="w-full h-auto block"
        style={{ imageRendering: profile.color ? 'auto' : 'pixelated', aspectRatio: `${profile.width} / ${profile.height}` }}
        aria-hidden
      />
      <div role="status" aria-live="polite" className="sr-only" data-testid="screen-text">
        {transcript(display)}
      </div>
    </div>
  )
}

function transcript(d: ScreenDisplayState): string {
  const parts = [d.statusBar]
  if (d.errorMessage) parts.push(d.errorMessage)
  const c = d.content
  if (c.type === 'lines') parts.push(...c.lines.map((l) => l.text))
  if (c.type === 'icons') parts.push(...c.items.map((it, i) => `${i === c.selected ? '[' : ''}${it.label}${i === c.selected ? ']' : ''}`))
  if (c.type === 'table') parts.push(c.headers.join(' '), ...c.rows.map((r) => r.join(' ')), c.footer ?? '')
  if (c.type === 'graph') parts.push(`Graph ${c.curves.map((cv) => cv.label).join(', ')}`, ...(c.info ?? []))
  if (d.softkeys) parts.push(d.softkeys.filter(Boolean).join(' | '))
  return parts.filter(Boolean).join('\n')
}

function draw(ctx: CanvasRenderingContext2D, d: ScreenDisplayState): void {
  const { width: W, height: H, foreground: FG, background: BG, color } = d.profile
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)
  const rowH = Math.floor(H / 8)
  const font = (px: number) => `${px}px ui-monospace, "SFMono-Regular", Menlo, monospace`
  ctx.textBaseline = 'middle'

  // Status bar
  ctx.fillStyle = color ? '#e8ecf4' : BG
  ctx.fillRect(0, 0, W, rowH)
  ctx.fillStyle = FG
  ctx.font = font(Math.floor(rowH * 0.75))
  ctx.fillText(d.statusBar, 2, rowH / 2)
  ctx.fillRect(0, rowH - 1, W, 1)

  const softH = d.softkeys && d.softkeys.length ? rowH : 0
  const area = { x: 0, y: rowH, w: W, h: H - rowH - softH }

  if (d.errorMessage) {
    drawBox(ctx, area, FG, BG, rowH, d.errorMessage.split('\n'))
  } else {
    drawContent(ctx, d.content, area, rowH, FG, BG, color)
  }

  if (softH) {
    const keys = d.softkeys!
    const w = W / 6
    ctx.font = font(Math.floor(rowH * 0.65))
    keys.slice(0, 6).forEach((label, i) => {
      if (!label) return
      const x = i * w
      ctx.fillStyle = color ? '#2b3a67' : FG
      ctx.fillRect(x + 1, H - softH + 1, w - 2, softH - 2)
      ctx.fillStyle = color ? '#ffffff' : BG
      ctx.textAlign = 'center'
      ctx.fillText(label, x + w / 2, H - softH / 2, w - 4)
      ctx.textAlign = 'left'
    })
  }
}

function drawBox(ctx: CanvasRenderingContext2D, a: { x: number; y: number; w: number; h: number }, FG: string, BG: string, rowH: number, lines: string[]) {
  const bx = a.x + a.w * 0.08
  const by = a.y + a.h * 0.15
  const bw = a.w * 0.84
  const bh = Math.min(a.h * 0.7, rowH * (lines.length + 1.5))
  ctx.fillStyle = BG
  ctx.fillRect(bx, by, bw, bh)
  ctx.strokeStyle = FG
  ctx.lineWidth = 1
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1)
  ctx.fillStyle = FG
  lines.forEach((l, i) => ctx.fillText(l, bx + 4, by + rowH * (i + 1), bw - 8))
}

function drawContent(
  ctx: CanvasRenderingContext2D,
  c: ScreenContent,
  a: { x: number; y: number; w: number; h: number },
  rowH: number,
  FG: string,
  BG: string,
  color: boolean,
) {
  const font = (px: number) => `${px}px ui-monospace, "SFMono-Regular", Menlo, monospace`
  ctx.font = font(Math.floor(rowH * 0.78))
  if (c.type === 'lines') {
    c.lines.forEach((line, i) => {
      const y = a.y + i * rowH
      if (y + rowH > a.y + a.h + 1) return
      if (line.inverted) {
        ctx.fillStyle = color ? '#2b3a67' : FG
        ctx.fillRect(a.x, y, a.w, rowH)
      }
      ctx.fillStyle = line.inverted ? (color ? '#ffffff' : BG) : line.color ?? FG
      ctx.textAlign = line.align === 'right' ? 'right' : line.align === 'center' ? 'center' : 'left'
      const x = line.align === 'right' ? a.x + a.w - 2 : line.align === 'center' ? a.x + a.w / 2 : a.x + 2
      ctx.fillText(line.text, x, y + rowH / 2, a.w - 4)
      ctx.textAlign = 'left'
      if (c.cursor && c.cursor.line === i) {
        const cw = ctx.measureText('M').width
        ctx.fillRect(a.x + 2 + c.cursor.col * cw, y + 2, 1, rowH - 4)
      }
    })
    return
  }
  if (c.type === 'icons') {
    const cols = c.columns
    const rowsVisible = 2
    const tileW = a.w / cols
    const tileH = a.h / rowsVisible
    const selRow = Math.floor(c.selected / cols)
    const firstRow = Math.max(0, selRow - rowsVisible + 1)
    c.items.forEach((it, i) => {
      const r = Math.floor(i / cols) - firstRow
      if (r < 0 || r >= rowsVisible) return
      const x = a.x + (i % cols) * tileW
      const y = a.y + r * tileH
      const sel = i === c.selected
      ctx.fillStyle = sel ? (color ? '#2b3a67' : FG) : color ? it.color ?? '#f2f4fa' : BG
      ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4)
      ctx.strokeStyle = FG
      ctx.strokeRect(x + 2.5, y + 2.5, tileW - 5, tileH - 5)
      ctx.fillStyle = sel ? (color ? '#ffffff' : BG) : FG
      ctx.textAlign = 'center'
      ctx.font = font(Math.floor(tileH * 0.32))
      ctx.fillText(it.icon, x + tileW / 2, y + tileH * 0.4, tileW - 6)
      ctx.font = font(Math.floor(tileH * 0.2))
      ctx.fillText(it.label, x + tileW / 2, y + tileH * 0.78, tileW - 6)
      ctx.textAlign = 'left'
    })
    return
  }
  if (c.type === 'table') {
    const cols = c.headers.length
    const colW = a.w / cols
    const visible = Math.floor(a.h / rowH) - (c.footer ? 2 : 1)
    const start = Math.max(0, c.selectedRow - visible + 1)
    ctx.fillStyle = FG
    c.headers.forEach((h, j) => ctx.fillText(h, a.x + j * colW + 2, a.y + rowH / 2, colW - 4))
    ctx.fillRect(a.x, a.y + rowH - 1, a.w, 1)
    c.rows.slice(start, start + visible).forEach((row, i) => {
      const y = a.y + (i + 1) * rowH
      const selected = start + i === c.selectedRow
      row.forEach((cell, j) => {
        const isSel = selected && (c.selectedCol === undefined || c.selectedCol === j)
        if (isSel) {
          ctx.fillStyle = color ? '#2b3a67' : FG
          ctx.fillRect(a.x + j * colW, y, colW, rowH)
        }
        ctx.fillStyle = isSel ? (color ? '#ffffff' : BG) : FG
        ctx.fillText(cell, a.x + j * colW + 2, y + rowH / 2, colW - 4)
      })
    })
    if (c.footer) {
      ctx.fillStyle = FG
      ctx.fillText(c.footer, a.x + 2, a.y + a.h - rowH / 2, a.w - 4)
    }
    return
  }
  // Graph
  const vp = c.viewport
  const sx = (x: number) => a.x + ((x - vp.xmin) / (vp.xmax - vp.xmin)) * a.w
  const sy = (y: number) => a.y + a.h - ((y - vp.ymin) / (vp.ymax - vp.ymin)) * a.h
  ctx.save()
  ctx.beginPath()
  ctx.rect(a.x, a.y, a.w, a.h)
  ctx.clip()
  if (c.grid && vp.xscl > 0 && vp.yscl > 0) {
    ctx.fillStyle = color ? '#c9cfdc' : FG
    const nx = (vp.xmax - vp.xmin) / vp.xscl
    const ny = (vp.ymax - vp.ymin) / vp.yscl
    if (nx < 80 && ny < 80) {
      for (let gx = Math.ceil(vp.xmin / vp.xscl) * vp.xscl; gx <= vp.xmax; gx += vp.xscl) {
        for (let gy = Math.ceil(vp.ymin / vp.yscl) * vp.yscl; gy <= vp.ymax; gy += vp.yscl) ctx.fillRect(Math.round(sx(gx)), Math.round(sy(gy)), 1, 1)
      }
    }
  }
  if (c.axes) {
    ctx.fillStyle = FG
    if (vp.ymin <= 0 && vp.ymax >= 0) ctx.fillRect(a.x, Math.round(sy(0)), a.w, 1)
    if (vp.xmin <= 0 && vp.xmax >= 0) ctx.fillRect(Math.round(sx(0)), a.y, 1, a.h)
    if (vp.xscl > 0 && (vp.xmax - vp.xmin) / vp.xscl < 100 && vp.ymin <= 0 && vp.ymax >= 0) {
      for (let t = Math.ceil(vp.xmin / vp.xscl) * vp.xscl; t <= vp.xmax; t += vp.xscl) ctx.fillRect(Math.round(sx(t)), Math.round(sy(0)) - 1, 1, 3)
    }
    if (vp.yscl > 0 && (vp.ymax - vp.ymin) / vp.yscl < 100 && vp.xmin <= 0 && vp.xmax >= 0) {
      for (let t = Math.ceil(vp.ymin / vp.yscl) * vp.yscl; t <= vp.ymax; t += vp.yscl) ctx.fillRect(Math.round(sx(0)) - 1, Math.round(sy(t)), 3, 1)
    }
  }
  ctx.lineWidth = color ? 1.5 : 1
  for (const curve of c.curves) {
    ctx.strokeStyle = color ? curve.color : FG
    for (const seg of curve.segments) {
      if (seg.length === 0) continue
      ctx.beginPath()
      seg.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(sx(x), sy(y)) : ctx.lineTo(sx(x), sy(y))))
      ctx.stroke()
    }
  }
  for (const p of c.points ?? []) {
    ctx.fillStyle = color ? p.color : FG
    ctx.fillRect(Math.round(sx(p.x)) - 1, Math.round(sy(p.y)) - 1, 3, 3)
  }
  if (c.cursor) {
    const cx = Math.round(sx(c.cursor.x))
    const cy = Math.round(sy(c.cursor.y))
    ctx.fillStyle = color ? '#d12f2f' : FG
    ctx.fillRect(cx - 3, cy, 7, 1)
    ctx.fillRect(cx, cy - 3, 1, 7)
  }
  ctx.restore()
  if (c.info && c.info.length) {
    ctx.font = font(Math.floor(rowH * 0.7))
    c.info.forEach((line, i) => {
      const y = a.y + a.h - (c.info!.length - i) * rowH
      ctx.fillStyle = BG
      const w = ctx.measureText(line).width + 4
      ctx.fillRect(a.x, y, w, rowH)
      ctx.fillStyle = FG
      ctx.fillText(line, a.x + 2, y + rowH / 2)
    })
  }
}
