import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalculatorView } from './CalculatorView'
import { getCalculatorById } from '../../models/calculatorCatalog'

const config = getCalculatorById('fx-991cw')!

beforeEach(() => {
  window.localStorage.clear()
  cleanup()
})

describe('CalculatorView integration', () => {
  it('pressing 2 + 2 = shows 4 on screen', async () => {
    const user = userEvent.setup()
    render(<CalculatorView config={config} />)
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '+' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(await screen.findByText('= 4')).toBeInTheDocument()
  })

  it('MODE opens a real menu listing Calculate', async () => {
    const user = userEvent.setup()
    render(<CalculatorView config={config} />)
    await user.click(screen.getByRole('button', { name: 'MODE' }))
    expect(await screen.findByText(/Calculate/)).toBeInTheDocument()
  })

  it('persists expression across remounts via localStorage', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<CalculatorView config={config} />)
    await user.click(screen.getByRole('button', { name: '9' }))
    expect(screen.getByRole('status')).toHaveTextContent('9')
    unmount()

    render(<CalculatorView config={config} />)
    expect(screen.getByRole('status')).toHaveTextContent('9')
  })

  it('Reset button clears memory after confirmation', async () => {
    const originalConfirm = window.confirm
    window.confirm = () => true
    const user = userEvent.setup()
    render(<CalculatorView config={config} />)
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: 'M+' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByRole('status')).toHaveTextContent('0')
    window.confirm = originalConfirm
  })
})
