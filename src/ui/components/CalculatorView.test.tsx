import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalculatorView } from './CalculatorView'
import { getCalculatorById } from '../../models/calculatorCatalog'
import { loadEngine } from '../../calculators/engineRegistry'

const config = getCalculatorById('fx-991cw')!

beforeAll(async () => {
  await loadEngine('classwiz')
})

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

  it('HOME opens a real menu listing Calculate', async () => {
    const user = userEvent.setup()
    render(<CalculatorView config={config} />)
    await user.click(screen.getByRole('button', { name: 'HOME' }))
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

  it('history panel can repeat and delete entries', async () => {
    const user = userEvent.setup()
    render(<CalculatorView config={config} />)
    await user.click(screen.getByRole('button', { name: '6' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    await user.click(screen.getByRole('button', { name: 'History' }))
    await user.click(screen.getByRole('button', { name: 'Repeat 6' }))
    expect(screen.getByRole('status')).toHaveTextContent('6')
    await user.click(screen.getByRole('button', { name: 'Delete 6' }))
    expect(screen.getByText('No calculations yet.')).toBeInTheDocument()
  })

  it('save and restore a snapshot', async () => {
    const user = userEvent.setup()
    render(<CalculatorView config={config} />)
    await user.click(screen.getByRole('button', { name: '4' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    expect(screen.getByRole('status')).toHaveTextContent('45')
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    expect(screen.getByRole('status')).not.toHaveTextContent('45')
    expect(screen.getByRole('status')).toHaveTextContent('4')
  })

  it('physical keyboard input is ignored while typing in a text field', async () => {
    const user = userEvent.setup()
    render(
      <>
        <input aria-label="other" />
        <CalculatorView config={config} />
      </>,
    )
    await user.click(screen.getByLabelText('other'))
    await user.keyboard('7')
    expect(screen.getByRole('status')).not.toHaveTextContent('7')
  })
})
