import { type ReactElement } from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { withSuspense } from '../src'

// A component that throws this stays suspended for the whole test
const neverResolves = new Promise<void>(() => {})

type UserCardProps = {
  name: string
}

// Ada's data never resolves in these tests, so her card suspends; any other name renders
function UserCard({ name }: UserCardProps): ReactElement {
  if (name === 'Ada') throw neverResolves

  return <p>Hello, {name}</p>
}

type UserCardSkeletonProps = {
  label?: string
}

function UserCardSkeleton({
  label = 'user',
}: UserCardSkeletonProps): ReactElement {
  return <p>Loading {label}...</p>
}

const fallback = <UserCardSkeleton />

const WrappedUserCard = withSuspense(UserCard, fallback)

describe('withSuspense', () => {
  it('uses the built-in fallback when no fallback argument is given', () => {
    const name = 'Ada'

    const PlainUserCard = withSuspense(UserCard)

    render(<PlainUserCard name={name} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders the fallback argument while the component is suspended', () => {
    const name = 'Ada'

    render(<WrappedUserCard name={name} />)

    expect(screen.getByText('Loading user...')).toBeInTheDocument()
  })

  it('renders nothing while the component is suspended when the fallback argument is null', () => {
    const name = 'Ada'

    const fallback = null

    const SilentUserCard = withSuspense(UserCard, fallback)

    const { container } = render(<SilentUserCard name={name} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('sets the displayName to withSuspense(Component)', () => {
    expect(WrappedUserCard.displayName).toBe('withSuspense(UserCard)')
  })
})

describe('the wrapped component', () => {
  it('renders the component when not suspended', async () => {
    const name = 'Grace'

    render(<WrappedUserCard name={name} />)

    expect(await screen.findByText(`Hello, ${name}`)).toBeInTheDocument()
  })

  it('overrides the definition-time fallback with the fallback prop', () => {
    const name = 'Ada'

    const fallback = <UserCardSkeleton label={name} />

    render(<WrappedUserCard name={name} fallback={fallback} />)

    expect(screen.getByText(`Loading ${name}...`)).toBeInTheDocument()
  })

  it('suppresses the fallback when the fallback prop is null', () => {
    const name = 'Ada'

    const fallback = null

    const { container } = render(
      <WrappedUserCard name={name} fallback={fallback} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('leaves the Suspense boundary anonymous by default', () => {
    const name = 'Ada'

    const element = WrappedUserCard({ name })

    expect(element.props).toHaveProperty('name', undefined)
  })

  it('names the Suspense boundary when devToolsName is set', () => {
    const name = 'Ada'

    const devToolsName = 'UserCardSuspense'

    const element = WrappedUserCard({ name, devToolsName })

    expect(element.props).toHaveProperty('name', devToolsName)
  })
})
