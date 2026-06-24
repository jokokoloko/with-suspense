# withSuspense

A higher-order component that wraps a React component in a `<Suspense>` boundary.

`withSuspense` bundles all three concerns of a streaming component — the component itself, its `<Suspense>` boundary, and its default fallback — into the component's own file, so consumers stay free of the usual `<Suspense>` boilerplate.

## Install

```bash
npm install @jokokoloko/with-suspense
```

Also available via `pnpm add` and `yarn add`.

## Usage

```tsx
import { type ReactElement } from 'react'

import { withSuspense } from '@jokokoloko/with-suspense'

type Props = {
  id: string
}

async function UserCard({ id }: Props): Promise<ReactElement> {
  const { name } = await getUser(id)

  return <div>{name}</div>
}

const fallback = <p>Loading...</p>

export default withSuspense(UserCard, fallback)
```

The wrapped component renders its `<Suspense>` boundary automatically — no need to add one at the usage site.

## Fallback

The second argument to `withSuspense` determines what renders while the component suspends:

| Second argument          | Fallback behavior                             |
| ------------------------ | --------------------------------------------- |
| Nothing (or `undefined`) | Renders `'Loading...'` — the built-in default |
| Any `ReactNode`          | Renders that value                            |
| `null`                   | Renders nothing                               |

- **A visible fallback** — use when the user benefits from knowing content is loading. A spinner, skeleton, or text string.
- **`null`** — renders nothing while the component suspends. React's own documentation uses `<Suspense fallback={null}>` as the canonical way to suppress a loading indicator. Use for components that are visually secondary or where a flash of placeholder content would be jarring.

Providing an explicit value rather than relying on the built-in `'Loading...'` default keeps the loading state intentional.

### The `fallback` const

Extracting the fallback to a named `const fallback` before the `withSuspense` call, rather than passing JSX inline, keeps the export line clean and the fallback easy to find and update:

```tsx
const fallback = <p>Loading...</p>

export default withSuspense(UserCard, fallback)
```

When a skeleton component is ready, it is a one-line swap. Using JSX (`<UserCardSkeleton />`) rather than a bare component reference preserves the ability to pass props at definition time:

```tsx
const fallback = <UserCardSkeleton variant="compact" />

export default withSuspense(UserCard, fallback)
```

### Overriding the fallback at a usage site

The wrapped component also accepts a `fallback` prop, which overrides the definition-time fallback for that one usage:

```tsx
<UserCard id="1" fallback={<UserCardSkeleton />} />
```

Passing `null` suppresses the fallback entirely for that usage. The prop uses a strict `=== undefined` check internally, so `null` suppresses consistently at both the definition site and the usage site — only omitting the prop falls through to the definition-time fallback:

```tsx
<UserCard id="1" />                 // uses the definition-time fallback
<UserCard id="1" fallback={null} /> // suppresses — renders nothing
```

## Boundary placement

`withSuspense` is purely additive over `<Suspense>` — it never removes a capability. The wrapped component is an ordinary component, `<Suspense>` still works everywhere it always did, and where a boundary sits is simply a matter of _which_ component you wrap with `withSuspense`.

**Independent boundary** — wrapping a component gives each instance its own boundary, streaming in independently:

```tsx
export default withSuspense(UserCard, fallback)
```

**Container boundary** — wrapping a single container component (the one suspending point that resolves the data and passes it to presentational children) makes several components reveal together as one unit:

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

A container boundary can be reached two ways: the container resolves the data itself and passes props to presentational children, as above, or it composes children that each fetch their own data using the unwrapped exports from the [Escape hatch](#escape-hatch) below.

## Streaming patterns

The examples above use async components that `await` their data, but `withSuspense` only provides the boundary — it works with any component that suspends. A common alternative is to start a fetch without awaiting it, pass the pending promise down, and resolve it with React's `use` hook in the component that needs it:

```tsx
'use client'

import { use, type ReactElement } from 'react'

import { withSuspense } from '@jokokoloko/with-suspense'

type Props = {
  userPromise: Promise<User>
}

function UserCard({ userPromise }: Props): ReactElement {
  const { name } = use(userPromise)

  return <div>{name}</div>
}

const fallback = <p>Loading...</p>

export default withSuspense(UserCard, fallback)
```

The parent starts the fetch and passes the unresolved promise as a prop; `use` suspends until it resolves, and the wrapped boundary shows the fallback in the meantime:

```tsx
function Page(): ReactElement {
  const userPromise = getUser('1')

  return <UserCard userPromise={userPromise} />
}
```

### Relationship to route-level loading

Frameworks with file-based routing (such as Next.js) provide a route-level loading file that wraps an entire route segment in its own boundary. That boundary and a `withSuspense` boundary compose: the route-level fallback covers the initial shell, and individual `withSuspense` components stream in within it, each with its own finer-grained fallback. Reach for the route-level file for the whole-page loading state, and `withSuspense` for the pieces inside it.

## Escape hatch

A component author who wants to give consumers full manual control can export both the unwrapped and wrapped versions from their component file:

```tsx
// default export — wrapped, for the common case
export default withSuspense(UserCard, fallback)

// named export — unwrapped, for full manual control
export { UserCard }
```

This is a convention for the component author, not something `withSuspense` enforces. It is a zero-compromise approach: the HOC handles the common case cleanly, and the escape hatch is always available without reaching into the component's internals.

The primary use is composing unwrapped components inside a container boundary — each suspends against the container's boundary rather than its own, so they all reveal together:

```tsx
import { UserBio } from './user-bio' // unwrapped
import { UserCard } from './user-card' // unwrapped

function Profile({ id }: Props): ReactElement {
  return (
    <>
      <UserCard id={id} />

      <UserBio id={id} />
    </>
  )
}

const fallback = <ProfileSkeleton />

export default withSuspense(Profile, fallback)
```

The unwrapped version also works directly with a raw `<Suspense>` boundary when that fits better:

```tsx
import { Suspense } from 'react'

import { UserCard } from './user-card' // unwrapped

function Page(): ReactElement {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UserCard id="1" />
    </Suspense>
  )
}
```

It also makes resolving a double-wrap a one-character fix — see [Double-wrap caution](#double-wrap-caution) below.

Between wrapping at the right level and the unwrapped export, every boundary arrangement you could build by hand with `<Suspense>` stays available — `withSuspense` only removes the usage-site boilerplate for the common case.

## Double-wrap caution

Applying a `<Suspense>` boundary around a `withSuspense`-wrapped component causes the outer boundary to never fire. React resolves a suspension at the nearest `<Suspense>` ancestor — which is the inner one from `withSuspense`. No error or warning is thrown; the outer fallback silently never appears:

```tsx
// avoid — outer Suspense never fires, outer fallback silently ignored
<Suspense fallback={<UserCardSkeletonA />}>
  <UserCard id="1" /> {/* already wrapped in withSuspense */}
</Suspense>

// correct — use the fallback prop for per-usage overrides
<UserCard id="1" fallback={<UserCardSkeletonA />} />
```

To make the failure concrete: if `UserCard` has a definition-time fallback of `<UserCardSkeletonB />` and a consumer wraps it expecting `<UserCardSkeletonA />` to appear, only `<UserCardSkeletonB />` ever renders — silently, with no error or warning:

```tsx
// UserCardSkeletonA is never rendered — withSuspense's inner boundary
// intercepts the suspension before the outer one fires
<Suspense fallback={<UserCardSkeletonA />}>
  <UserCard id="1" fallback={<UserCardSkeletonB />} />
</Suspense>
```

The `fallback` prop is the correct API for per-usage overrides. If full manual `<Suspense>` control is needed, use the [unwrapped escape hatch export](#escape-hatch) instead.

## Naming the wrapped export

How a component file names its exports signals which version is primary. Two patterns cover most cases:

**Wrapped as default, unwrapped as named** (recommended) — the wrapped version is what most consumers want:

```tsx
async function UserCard({ id }: Props): Promise<ReactElement> { ... }

const fallback = <p>Loading...</p>

export default withSuspense(UserCard, fallback)

export { UserCard }
// also consider aliasing to flag that it needs its own boundary, e.g.
// export { UserCard as UserCardWithoutSuspense } or { UserCard as UserCardNeedsSuspense }
```

**Wrapped as named, unwrapped as default** — when the wrapped version should carry a more descriptive name that signals it streams in (e.g. `UserCardStreaming`):

```tsx
async function UserCard({ id }: Props): Promise<ReactElement> { ... }

export default UserCard

const fallback = <p>Loading...</p>

const UserCardStreaming = withSuspense(UserCard, fallback)

export { UserCardStreaming }
```

The name `UserCardStreaming` signals at the import site that this version handles its own suspension.

## Why a higher-order component

A higher-order component composes at the export boundary, so the `<Suspense>` boundary is declared once in the component's own file:

```tsx
export default withSuspense(UserCard, fallback)
```

A wrapper component — `<WithSuspense fallback={...}><UserCard /></WithSuspense>` — would push that boundary back to every usage site, recreating the repetition of the raw `<Suspense>` pattern: each parent has to remember to wrap the component and to supply the fallback. It also has no clean way to expose a per-usage `fallback` prop on `UserCard` itself; the override would live on the wrapper instead.

The HOC keeps the boundary co-located with the component while still exposing the unwrapped component for the cases that need manual control (see [Escape hatch](#escape-hatch)).

## Drawbacks

`withSuspense` is a thin convenience over `<Suspense>`, and that shapes where it does and does not pay off:

- **It adds a layer of indirection.** The default export is a generated wrapper, not the component as authored. In React DevTools and stack traces it appears as a `withSuspense(UserCard)` layer around the real component.
- **A nested manual boundary silently no-ops.** Wrapping an already-wrapped component in another `<Suspense>` does nothing, with no warning — see [Double-wrap caution](#double-wrap-caution).
- **It is component-level, not route-level.** For a boundary around an entire route, a framework's route-level loading file is the better fit — see [Streaming patterns](#streaming-patterns).
- **For a single one-off boundary, inline `<Suspense>` may read more clearly** than introducing the dependency. The value grows with the number of components that each own a boundary; for one, the raw element is fine.
- **When manual boundary control is always needed,** the wrapped layer is bypassed through the escape hatch every time — at which point plain `<Suspense>` is the simpler tool.

## API

### `withSuspense(Component, fallback?)`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `Component` | `ComponentType<T>` | — | The component to wrap |
| `fallback` | `ReactNode` | `'Loading...'` | Rendered while the component suspends |

Returns a new component that accepts all of `Component`'s original props plus an optional `fallback` prop for per-usage overrides.

### `fallback` prop (on the returned component)

| Value       | Behavior                                                      |
| ----------- | ------------------------------------------------------------- |
| omitted     | Uses the fallback passed to `withSuspense` at definition time |
| `ReactNode` | Overrides the definition-time fallback at this usage site     |
| `null`      | Suppresses the fallback — renders nothing while suspended     |

## Requirements

React 16.6 or later (`Suspense` was introduced in React 16.6). `withSuspense` is plain React — it works anywhere a component can suspend; the examples here use async components, but nothing ties it to a particular framework.

## License

MIT
