# withSuspense

A higher-order component that wraps a React component in a `Suspense` boundary.

## Install

```bash
npm install @jokokoloko/with-suspense
```

## Usage

```tsx
import { type ReactElement } from 'react'

import { withSuspense } from '@jokokoloko/with-suspense'

type Props = {
  id: string
}

async function UserCard({ id }: Props): Promise<ReactElement> {
  const user = await getUser(id)

  return <div>{user.name}</div>
}

const fallback = <p>Loading...</p>

export default withSuspense(UserCard, fallback)
```

The wrapped component renders its `Suspense` boundary automatically — no need to add one at the usage site.

### Override the fallback at the usage site

The `fallback` prop can be overridden per usage when a different loading state is needed:

```tsx
<UserCard id="1" fallback={<UserCardSkeleton />} />
```

Pass `null` to suppress the fallback entirely:

```tsx
<UserCard id="1" fallback={null} />
```

## Boundary placement

`withSuspense` is purely additive over `<Suspense>` — it never removes a capability. The wrapped component is an ordinary component, `<Suspense>` still works everywhere it always did, and where a boundary sits is simply a matter of _which_ component you wrap with `withSuspense`.

**Leaf boundary** — wrap a leaf and each instance streams in behind its own boundary, independently:

```tsx
export default withSuspense(UserCard, fallback)
```

**Container boundary** — to make several components reveal together as one unit, wrap a single container component: the one suspending point that resolves the data and passes it to presentational children.

```tsx
async function Profile({ id }: Props): Promise<ReactElement> {
  const user = await getUser(id)

  return (
    <>
      <Avatar src={user.avatar} />

      <Details user={user} />
    </>
  )
}

const fallback = <ProfileSkeleton />

export default withSuspense(Profile, fallback)
```

`Avatar` and `Details` receive resolved data as props and never suspend, so the whole container reveals together behind `Profile`'s single boundary.

When neither of these placements fits — for example, to group several independently-suspending components under one `<Suspense>` — see [Escape hatch](#escape-hatch) below.

## Escape hatch

A component author who wants to give consumers full manual control can export both the unwrapped and wrapped versions from their component file:

```tsx
// default export — wrapped, for the common case
export default withSuspense(UserCard, fallback)

// named export — unwrapped, for full manual control
export { UserCard }
```

This is a convention for the component author, not something `withSuspense` enforces. It is a zero-compromise approach: the HOC handles the common case cleanly, and the escape hatch is always available without reaching into the component's internals.

Importing the named export gives the original component, free to wrap however you like:

```tsx
import { Suspense } from 'react'

import { UserCard } from './user-card'

function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UserCard id="1" />
    </Suspense>
  )
}
```

It also makes resolving a double-wrap a one-character fix — switching from `import UserCard` to `import { UserCard }` gives the unwrapped version and full control over the `<Suspense>` boundary, with no changes needed to the component definition itself.

Between wrapping at the right level and the unwrapped export, every boundary arrangement you could build by hand with `<Suspense>` stays available — `withSuspense` only removes the boilerplate for the common case.

## API

### `withSuspense(Component, fallback?)`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `Component` | `ComponentType<T>` | — | The component to wrap |
| `fallback` | `ReactNode` | `'Loading...'` | Rendered while the component suspends |

Returns a new component that accepts all of `Component`'s original props plus an optional `fallback` prop for per-usage overrides.

### `fallback` prop (on the returned component)

| Value       | Behaviour                                                     |
| ----------- | ------------------------------------------------------------- |
| omitted     | Uses the fallback passed to `withSuspense` at definition time |
| `ReactNode` | Overrides the definition-time fallback at this usage site     |
| `null`      | Suppresses the fallback — renders nothing while suspended     |

## Requirements

React 16.6 or later (`Suspense` was introduced in React 16.6).

## License

MIT
