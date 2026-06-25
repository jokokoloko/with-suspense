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

export { UserCard }
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

**Avoid wrapping the component in your own `<Suspense>`.** It already carries its own boundary, so an outer one never fires — React resolves the suspension at the inner boundary first, and the outer fallback silently never appears, with no error or warning. To change the fallback at a usage site, use the `fallback` prop above; for full manual `<Suspense>` control, reach for the unwrapped [escape hatch](#escape-hatch) export.

## Escape hatch

A component author who wants to give consumers full manual control can export both the unwrapped and wrapped versions from their component file:

```tsx
// default export — wrapped, for the common case
export default withSuspense(UserCard, fallback)

// named export — unwrapped, for full manual control
export { UserCard }
```

This is a recommended convention for the component author, not something `withSuspense` enforces: the wrapped default covers the common case, while the unwrapped export stays available without reaching into the component's internals.

The unwrapped export is an ordinary component with no `<Suspense>` boundary of its own — use it wherever you need full manual control, such as within the usual streaming boilerplate or in a test.

## Naming to signal streaming

Throughout this README the wrapped component is the default export under the component's own name, so usage sites read `<UserCard />` — clean, but indistinguishable from a component that does not stream.

For all its boilerplate, the raw `<Suspense>` pattern has one advantage: it makes streaming visible at the usage site, where a reader sees the boundary and knows exactly where and what suspends. A descriptive name keeps that signal while still using `withSuspense`.

The wrapped component is a default export, so the importer chooses its name. A consumer who wants the usage site to signal streaming can import it under a descriptive name, with no change to the component file:

```tsx
import UserCardStreaming from './user-card'
```

`<UserCardStreaming />` then reads as a streaming component at that usage site.

To make that name canonical so every consumer gets it without renaming, bake it into the component file — export the plain component as the default and the wrapped version under a descriptive name:

```tsx
async function UserCard({ id }: Props): Promise<ReactElement> { ... }

export default UserCard

const fallback = <p>Loading...</p>

const UserCardStreaming = withSuspense(UserCard, fallback)

export { UserCardStreaming }
```

Either way, `<UserCardStreaming />` announces at the usage site that this version handles its own suspension — recovering the visibility of the raw `<Suspense>` pattern without its boilerplate.

## API

### `withSuspense(Component, fallback?)`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `Component` | `ComponentType<T>` | — | The component to wrap |
| `fallback` | `ReactNode` | `'Loading...'` | Rendered while the component suspends |

Returns a new component that accepts all of `Component`'s original props plus an optional `fallback` prop for per-usage overrides. In React DevTools and stack traces, the returned component is named after the component it wraps — for example, `withSuspense(UserCard)`.

### `fallback` prop (on the returned component)

| Value       | Behavior                                                      |
| ----------- | ------------------------------------------------------------- |
| omitted     | Uses the fallback passed to `withSuspense` at definition time |
| `ReactNode` | Overrides the definition-time fallback at this usage site     |
| `null`      | Suppresses the fallback — renders nothing while suspended     |

The prop is resolved with a strict `=== undefined` check: only an omitted prop falls through to the definition-time fallback. Passing `null` therefore suppresses the fallback rather than reverting to the default — the same behavior `null` has as the second argument to `withSuspense`.

## Requirements

React 16.6 or later (`Suspense` was introduced in React 16.6).

`withSuspense` is plain React — it works anywhere a component can suspend.

## License

MIT
