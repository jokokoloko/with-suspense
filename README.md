# withSuspense

A higher-order component that wraps a React component in a `<Suspense>` boundary.

`withSuspense` bundles all three concerns of a streaming component — the component itself, its `<Suspense>` boundary, and its default fallback — into the component's own file, so consumers stay free of the usual `<Suspense>` boilerplate.

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

The wrapped component renders its own `<Suspense>` boundary automatically — no need to add one at the usage site.

## Fallback

The second argument to `withSuspense` determines what renders while the component suspends:

| Second argument          | Fallback behavior                             |
| ------------------------ | --------------------------------------------- |
| Omitted (or `undefined`) | Renders `'Loading...'` — the built-in default |
| Any `ReactNode`          | Renders that value                            |
| `null`                   | Renders nothing                               |

Passing `null` renders nothing while the component suspends. React's own documentation uses `<Suspense fallback={null}>` as the canonical way to suppress a loading indicator. Use it for components that are visually secondary or where a flash of placeholder content would be jarring.

Providing an explicit value rather than relying on the built-in `'Loading...'` default keeps the loading state intentional.

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

The prop uses a strict `=== undefined` check internally, so `null` suppresses consistently at both the definition site and the usage site — only omitting the prop falls through to the definition-time fallback.

**Avoid wrapping a `withSuspense`-wrapped component in your own `<Suspense>`.** It already carries its own boundary, so an additional outer boundary never fires — React resolves the suspension at the inner boundary first, causing the outer boundary's fallback to silently fail and never appear, with no error or warning. To change the fallback at a usage site, use the `fallback` prop shown above; for full manual `<Suspense>` control, reach for the unwrapped [escape hatch](#escape-hatch) export.

## Escape hatch

A component author who wants to give consumers full manual control can export both the wrapped and unwrapped versions from their component file:

```tsx
// default export — wrapped, for common use
export default withSuspense(UserCard, fallback)

// named export — unwrapped, for full manual control
export { UserCard }
```

This is a recommended convention for the component author, not something `withSuspense` enforces: the wrapped default handles common usage, while the unwrapped export stays available without reaching into the component's internals.

The unwrapped export is an ordinary component with no `<Suspense>` boundary of its own — use it wherever you need full manual control, such as within the usual streaming boilerplate or in a test.

## Naming to signal streaming

Throughout this documentation the wrapped component is the default export under the component's own name, so usage sites read `<UserCard />` — clean, but indistinguishable from a component that does not stream.

For all its boilerplate, the raw `<Suspense>` pattern has one benefit: it makes visible which components stream — each boundary can be seen right at the usage site. That same visibility can be kept while using `withSuspense` by giving the wrapped component a descriptive name that signals streaming.

When the wrapped component is a default export, a consumer who wants the usage site to signal streaming can import it under a descriptive name, with no change to the component file:

```tsx
import UserCardStreaming from './user-card'
```

To make that name canonical so every consumer gets it without renaming, bake it into the component file — export the plain component as the default and the wrapped version as a descriptive named export:

```tsx
async function UserCard({ id }: Props): Promise<ReactElement> { ... }

const fallback = <p>Loading user...</p>

const UserCardStreaming = withSuspense(UserCard, fallback)

export default UserCard

export { UserCardStreaming }
```

With either approach, the usage site reads `<UserCardStreaming />`, which signals that the component streams and handles its own suspension.

## API

### `withSuspense(Component, fallback?)`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `Component` | `ComponentType<T>` | — | The component to wrap |
| `fallback` | `ReactNode` | `'Loading...'` | Rendered while the component suspends |

`withSuspense` wraps `Component` in a `<Suspense>` boundary, with `fallback` as its definition-time default. The generic `T` is inferred from `Component`, so the wrapped component is typed with the same props automatically.

### The wrapped component

`withSuspense` returns a new component that accepts all of `Component`'s original props plus optional `fallback` and `devToolsName` props for per-usage overrides. In React DevTools and stack traces, it appears as `withSuspense(Component)`.

#### `fallback` prop (optional)

| Value | Behavior |
| --- | --- |
| Omitted (or `undefined`) | Uses the fallback passed to `withSuspense` at definition time |
| `ReactNode` | Overrides the definition-time fallback at this usage site |
| `null` | Suppresses the fallback — renders nothing while suspended |

Passing `null` suppresses the fallback rather than reverting to the default — the same behavior it has as the second argument to `withSuspense`.

#### `devToolsName` prop (optional)

By default the `<Suspense>` boundary carries the component's `withSuspense(Component)` label in React DevTools. `devToolsName` renames just that boundary for a given usage, leaving the component's label untouched.

## Requirements

React 16.6 or later (`Suspense` was introduced in React 16.6).

`withSuspense` is plain React — it works anywhere a component can suspend.

## License

MIT
