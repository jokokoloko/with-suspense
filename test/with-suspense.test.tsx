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
    expect(WrappedGreeting.displayName).toBe('withSuspense(Greeting)')
  })

  it('accepts devToolsName without affecting rendering', async () => {
    const name = 'squid'

    render(<WrappedGreeting name={name} devToolsName="withSuspense(Custom)" />)

    expect(await screen.findByText(`Hello, ${name}`)).toBeInTheDocument()
  })

  it('renders the wrapped component when not suspended', async () => {
    const name = 'squid'

    render(<WrappedGreeting name={name} />)

    expect(await screen.findByText(`Hello, ${name}`)).toBeInTheDocument()
  })

  it('renders the definition-time fallback while suspended', () => {
    render(<WrappedSuspending />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders the usage-site fallback override when provided', () => {
    const message = 'Please wait...'

    const fallback = <p>{message}</p>

    render(<WrappedSuspending fallback={fallback} />)

    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('renders nothing while suspended when fallback is null', () => {
    const { container } = render(<WrappedSuspending fallback={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a component without props as the usage-site fallback override', () => {
    const fallback = <LoadingMessage />

    render(<WrappedSuspending fallback={fallback} />)

    expect(screen.getByText('Loading, ...')).toBeInTheDocument()
  })

  it('renders a component with props as the usage-site fallback override', () => {
    const text = 'Please wait...'

    const fallback = <LoadingMessage text={text} />

    render(<WrappedSuspending fallback={fallback} />)

    expect(screen.getByText(`Loading, ${text}`)).toBeInTheDocument()
  })

  it('renders the fallback with a prop-derived value while the component is suspended', () => {
    const name = 'no'

    const fallback = <LoadingMessage text={name} />

    render(<WrappedGreeting name={name} fallback={fallback} />)

    expect(screen.getByText(`Loading, ${name}`)).toBeInTheDocument()
  })

  it('renders the component with a prop-derived value and not the fallback when not suspended', async () => {
    const name = 'yes'

    const fallback = <LoadingMessage text={name} />

    render(<WrappedGreeting name={name} fallback={fallback} />)

    expect(await screen.findByText(`Hello, ${name}`)).toBeInTheDocument()
  })
})
