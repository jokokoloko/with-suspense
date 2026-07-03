import { type ReactElement } from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  withSuspense,
  type WithSuspenseComponent,
  type WithSuspenseProps,
} from '../src'

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

describe('withSuspense', () => {
  it('rejects an omitted or undefined fallback', () => {
    // @ts-expect-error the fallback argument is required
    withSuspense(UserCard)

    // @ts-expect-error undefined is excluded; null is the only way to render nothing
    withSuspense(UserCard, undefined)
  })

  it('renders the definition-time fallback when one is given', () => {
    const name = 'Ada'

    const fallback = <p>Loading...</p>

    const WrappedUserCard = withSuspense(UserCard, fallback)

    render(<WrappedUserCard name={name} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders nothing by suppressing the fallback when null is given', () => {
    const name = 'Ada'

    const fallback = null

    const WrappedUserCard = withSuspense(UserCard, fallback)

    const { container } = render(<WrappedUserCard name={name} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('the wrapped component', () => {
  const fallback = <p>Loading...</p>

  const WrappedUserCard = withSuspense(UserCard, fallback)

  it('renders the component when not suspended', async () => {
    const name = 'Grace'

    render(<WrappedUserCard name={name} />)

    expect(await screen.findByText(`Hello, ${name}`)).toBeInTheDocument()
  })

  it('renders the definition-time fallback when the fallback prop is omitted', () => {
    const name = 'Ada'

    render(<WrappedUserCard name={name} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders the override fallback without a usage-site value', () => {
    const name = 'Ada'

    const fallback = <UserCardSkeleton />

    render(<WrappedUserCard name={name} fallback={fallback} />)

    expect(screen.getByText('Loading user...')).toBeInTheDocument()
  })

  it('renders the override fallback with a usage-site value', () => {
    const name = 'Ada'

    const fallback = <UserCardSkeleton label={name} />

    render(<WrappedUserCard name={name} fallback={fallback} />)

    expect(screen.getByText(`Loading ${name}...`)).toBeInTheDocument()
  })

  it('renders nothing by suppressing the fallback when the fallback prop is null', () => {
    const name = 'Ada'

    const fallback = null

    const { container } = render(
      <WrappedUserCard name={name} fallback={fallback} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('sets the displayName to WithSuspense(Component)', () => {
    expect(WrappedUserCard.displayName).toBe('WithSuspense(UserCard)')
  })

  it('leaves the Suspense boundary anonymous when suspenseBoundaryName is omitted', () => {
    const name = 'Ada'

    const element = WrappedUserCard({ name })

    expect(element.props).toHaveProperty('name', undefined)
  })

  it('names the Suspense boundary when suspenseBoundaryName is set', () => {
    const name = 'Ada'

    const suspenseBoundaryName = 'UserCardSuspense'

    const element = WrappedUserCard({ name, suspenseBoundaryName })

    expect(element.props).toHaveProperty('name', suspenseBoundaryName)
  })
})

describe('the exported types', () => {
  const fallback = <p>Loading...</p>

  const WrappedUserCard = withSuspense(UserCard, fallback)

  it('matches the wrapped component with WithSuspenseComponent', () => {
    expectTypeOf(WrappedUserCard).toEqualTypeOf<
      WithSuspenseComponent<UserCardProps>
    >()
  })

  it('matches the wrapped component props with WithSuspenseProps', () => {
    expectTypeOf<WithSuspenseProps<UserCardProps>>().toEqualTypeOf<
      Parameters<WithSuspenseComponent<UserCardProps>>[0]
    >()
  })
})
