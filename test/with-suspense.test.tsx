import type { ReactElement } from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { withSuspense } from '../src'

type Props = {
  name: string
}

// A promise that never resolves — suspends any component that throws it permanently
const neverResolves = new Promise<void>(() => {})

function Greeting({ name }: Props): ReactElement {
  if (name === 'no') throw neverResolves

  return <p>Hello, {name}</p>
}

function SuspendingComponent(): ReactElement {
  throw neverResolves
}

type LoadingMessageProps = {
  text?: string
}

function LoadingMessage({ text = '...' }: LoadingMessageProps): ReactElement {
  return <p>Loading, {text}</p>
}

const fallback = <p>Loading...</p>

const WrappedGreeting = withSuspense(Greeting, fallback)
const WrappedSuspending = withSuspense(SuspendingComponent, fallback)

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

  it('renders a component without props as the usage-site fallback override', () => {
    render(<WrappedSuspending fallback={<LoadingMessage />} />)

    expect(screen.getByText('Loading, ...')).toBeInTheDocument()
  })

  it('renders a component with props as the usage-site fallback override', () => {
    render(
      <WrappedSuspending fallback={<LoadingMessage text="Please wait..." />} />,
    )

    expect(screen.getByText('Loading, Please wait...')).toBeInTheDocument()
  })

  it('renders the fallback with a prop-derived value while the component is suspended', () => {
    const name = 'no'

    render(
      <WrappedGreeting name={name} fallback={<LoadingMessage text={name} />} />,
    )

    expect(screen.getByText('Loading, no')).toBeInTheDocument()
  })

  it('renders the component with a prop-derived value and not the fallback when not suspended', async () => {
    const name = 'yes'

    render(
      <WrappedGreeting name={name} fallback={<LoadingMessage text={name} />} />,
    )

    expect(await screen.findByText('Hello, yes')).toBeInTheDocument()
  })
})
