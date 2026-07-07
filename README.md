# withSuspense

A higher-order component that wraps a React component in a `<Suspense>` boundary.

`withSuspense` frees usage sites from the usual streaming boilerplate by bundling the `<Suspense>` boundary and the default fallback into the component's own file.

## Installation

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

const fallback = <p>Loading user...</p>

export default withSuspense(UserCard, fallback)

export { UserCard }
```

The wrapped component renders its own `<Suspense>` boundary automatically, so there is no need to add one at the usage site.

## Fallback

The second argument to `withSuspense` is required and determines what renders while the component suspends:

| Second argument | Fallback behavior  |
| --------------- | ------------------ |
| Any `ReactNode` | Renders that value |
| `null`          | Renders nothing    |

<p></p>

Passing `null` renders nothing while the component suspends. React's own documentation uses `<Suspense fallback={null}>` as the canonical way to suppress a loading indicator. Use it for components that are visually secondary or where a flash of placeholder content would be jarring.

The argument's type excludes `undefined`, so omitting it or passing `undefined` is a compile error. A blank pending state can only come from an explicit `null` — a deliberate choice, never a forgotten fallback.

### The `fallback` const

Extracting the fallback to a `const fallback` before the `withSuspense` call, rather than passing JSX inline, keeps the export line clean and the fallback easy to find and update:

```tsx
const fallback = <p>Loading user...</p>

export default withSuspense(UserCard, fallback)
```

When a skeleton component is ready, it is a one-line swap. Using JSX (`<UserCardSkeleton />`) rather than a bare component reference preserves the ability to pass props at definition time:

```tsx
const fallback = <UserCardSkeleton variant="compact" />

export default withSuspense(UserCard, fallback)
```

### Overriding the fallback at a usage site

The wrapped component also accepts a `fallback` prop, giving each usage site control over its own fallback.

Omitting the prop uses the definition-time fallback:

```tsx
<UserCard id="1" />
```

Passing any `ReactNode` overrides the definition-time fallback for that one usage:

```tsx
<UserCard id="1" fallback={<UserCardSkeleton />} />
```

Passing `null` suppresses the fallback entirely, rendering nothing while the component suspends:

```tsx
<UserCard id="1" fallback={null} />
```

The prop uses a strict `=== undefined` check internally, so `null` suppresses consistently at both the definition site and the usage site. Only omitting the prop falls through to the definition-time fallback.

**Avoid wrapping a `withSuspense`-wrapped component in your own `<Suspense>`.** It already carries its own boundary, so an additional outer boundary never fires: React resolves the suspension at the inner boundary first, causing the outer boundary's fallback to silently fail and never appear, with no error or warning. To change the fallback at a usage site, use the `fallback` prop shown above; for full manual `<Suspense>` control, reach for the unwrapped escape-hatch export described below.

## Escape hatch

A component author who wants to give consumers full manual control can export both the wrapped and unwrapped versions from their component file:

```tsx
// wrapped: renders its own <Suspense> boundary automatically
export default withSuspense(UserCard, fallback)

// unwrapped: no <Suspense> boundary of its own (full manual control)
export { UserCard }
```

This is a recommended convention for the component author, not something `withSuspense` enforces: the wrapped default renders its own `<Suspense>` boundary automatically, while the unwrapped export stays available without reaching into the component's internals.

The unwrapped export is an ordinary component with no `<Suspense>` boundary of its own. Use it wherever you need full manual control, such as within the usual streaming boilerplate or in a test.

## Naming to signal streaming

Throughout this documentation the wrapped component is the default export under the component's own name, so usage sites read `<UserCard />`, which is clean but indistinguishable from a component that does not stream.

By contrast, the usual `<Suspense>` boilerplate shows which components stream: each boundary sits right at the usage site. `withSuspense` moves that boundary into the component file, but the same visibility can be kept by giving the wrapped component a descriptive name that signals streaming.

When the wrapped component is a default export, a consumer who wants the usage site to signal streaming can import it under a descriptive name, with no change to the component file:

```tsx
import UserCardStreaming from './user-card'
```

To make that name canonical so every consumer gets it without renaming, bake it into the component file. Export the plain component as the default and the wrapped version as a descriptive named export:

```tsx
async function UserCard({ id }: Props): Promise<ReactElement> { ... }

const fallback = <p>Loading user...</p>

const UserCardStreaming = withSuspense(UserCard, fallback)

export default UserCard

export { UserCardStreaming }
```

With either approach, the usage site reads `<UserCardStreaming />`, which signals that the component streams and handles its own suspension.

## API

### `withSuspense(Component, fallback)`

| Parameter | Type | Description |
| --- | --- | --- |
| `Component` | `ComponentType<T>` | The component to wrap |
| `fallback` | `Exclude<ReactNode, undefined>` | Rendered while the component suspends |

<p></p>

`withSuspense` wraps `Component` in a `<Suspense>` boundary, with `fallback` as its definition-time default. Both parameters are required. Passing `null` as the `fallback` renders nothing while the component suspends. The generic `T` is inferred from `Component`, so the wrapped component is typed with the same props automatically.

### The wrapped component

`withSuspense` returns a new component that accepts all of `Component`'s original props plus optional `fallback` and `suspenseBoundaryName` props, set per usage site. In React DevTools and stack traces, it appears as `WithSuspense(Component)`.

#### `fallback` prop (optional)

| Value | Behavior |
| --- | --- |
| Omitted (or `undefined`) | Uses the fallback passed to `withSuspense` at definition time |
| `ReactNode` | Overrides the definition-time fallback at this usage site |
| `null` | Suppresses the fallback, rendering nothing while suspended |

<p></p>

Passing `null` suppresses the fallback rather than reverting to the default (the same behavior it has as the second argument to `withSuspense`).

#### `suspenseBoundaryName` prop (optional)

By default, the `<Suspense>` boundary is anonymous. React DevTools identifies it by its owner, the `WithSuspense(Component)` wrapper that renders it. Setting `suspenseBoundaryName` gives the boundary its own label, one per usage site.

## Requirements

React 16.6 or later (`Suspense` was introduced in React 16.6).

`withSuspense` is plain React: it works anywhere a component can suspend.

## License

MIT
