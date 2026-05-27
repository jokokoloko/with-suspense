import React from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { withSuspense } from '../src'

type Props = {
  name: string
}

function Greeting({ name }: Props): React.ReactElement {
  return <p>Hello, {name}</p>
}

// A component that always suspends — used to test fallback rendering
const neverResolves = new Promise<void>(() => {})

function SuspendingComponent(): React.ReactElement {
  throw neverResolves
}

const WrappedGreeting = withSuspense(Greeting, <p>Loading...</p>)
const WrappedSuspending = withSuspense(SuspendingComponent, <p>Loading...</p>)

describe('withSuspense', () => {
  it('sets displayName on the wrapped component', () => {
    expect(WrappedGreeting.displayName).toBe('WithSuspense(Greeting)')
  })

  it('renders the wrapped component when not suspended', async () => {
    render(<WrappedGreeting name="squid" />)

    expect(await screen.findByText('Hello, squid')).toBeInTheDocument()
  })

  it('renders the definition-time fallback while suspended', () => {
    render(<WrappedSuspending />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders the usage-site fallback override when provided', () => {
    render(<WrappedSuspending fallback={<p>Please wait...</p>} />)

    expect(screen.getByText('Please wait...')).toBeInTheDocument()
  })

  it('renders nothing while suspended when fallback is null', () => {
    const { container } = render(<WrappedSuspending fallback={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})
