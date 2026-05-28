import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from './dialog'

describe('Dialog', () => {
  it('renders trigger and shows content when open=true', () => {
    render(
      <Dialog open>
        <DialogTrigger>open dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>dialog body</p>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.getByText('Test Dialog')).toBeInTheDocument()
    expect(screen.getByText('dialog body')).toBeInTheDocument()
  })

  it('does not render content when open=false', () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Hidden Dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.queryByText('Hidden Dialog')).not.toBeInTheDocument()
  })

  it('calls onOpenChange(false) when close button is clicked', () => {
    const onOpenChange = vi.fn()
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Closeable</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
