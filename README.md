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

## Fallback

The second argument to `withSuspense` determines what renders while the component suspends:

| Second argument          | Fallback behavior                             |
| ------------------------ | --------------------------------------------- |
| Nothing (or `undefined`) | Renders `'Loading...'` — the built-in default |
| `null`                   | Renders nothing                               |
| Any `ReactNode`          | Renders that value                            |

- **`null`** — renders nothing while the component suspends. React's own documentation uses `<Suspense fallback={null}>` as the canonical way to suppress a loading indicator. Use for components that are visually secondary or where a flash of placeholder content would be jarring.
- **A visible fallback** — use when the user benefits from knowing content is loading. A spinner, skeleton, or text string.

Always provide an explicit value rather than relying on the built-in `'Loading...'` default.

### `null` at the usage site

The `fallback` prop uses a strict `=== undefined` check internally — `null` suppresses consistently at both the definition site and the usage site. Passing `null` as the `fallback` prop suppresses the fallback for that render; omitting the prop falls through to the definition-time default:

```tsx
<CommentsList />                 // uses definition-time fallback
<CommentsList fallback={null} /> // suppresses — renders nothing
```

### The `fallback` const

Extract the fallback to a named `const fallback` before the `withSuspense` call rather than passing JSX inline:

```tsx
// recommended
const fallback = <p>Loading...</p>

export default withSuspense(CommentsList, fallback)

// avoid
export default withSuspense(CommentsList, <p>Loading...</p>)
```

This keeps the export line clean and makes the fallback easy to find and update. When a skeleton component is ready, it is a one-line swap. Using JSX (`<Skeleton />`) rather than a bare component reference preserves the ability to pass props at definition time:

```tsx
const fallback = <Skeleton type="list" />

export default withSuspense(CommentsList, fallback)
```

## Boundary placement

`withSuspense` is purely additive over `<Suspense>` — it never removes a capability. The wrapped component is an ordinary component, `<Suspense>` still works everywhere it always did, and where a boundary sits is simply a matter of _which_ component you wrap with `withSuspense`.

**Independent boundary** — wrap a component and each instance streams in behind its own boundary:

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

When a `withSuspense`-wrapped component needs to participate in a container boundary rather than suspending against its own, see [Escape hatch](#escape-hatch) below.

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

It also makes resolving a double-wrap a one-character fix — switching from `import UserCard` to `import { UserCard }` gives the unwrapped version and full control over the `<Suspense>` boundary, with no changes needed to the component definition itself.

Between wrapping at the right level and the unwrapped export, every boundary arrangement you could build by hand with `<Suspense>` stays available — `withSuspense` only removes the usage-site boilerplate for the common case.

### Double-wrap caution

Applying a `<Suspense>` boundary around a `withSuspense`-wrapped component causes the outer boundary to never fire. React resolves a suspension at the nearest `<Suspense>` ancestor — which is the inner one from `withSuspense`. No error or warning is thrown; the outer fallback silently never appears:

```tsx
// avoid — outer Suspense never fires, outer fallback silently ignored
<Suspense fallback={<CommentsListSkeletonA />}>
  <CommentsList /> {/* already wrapped in withSuspense */}
</Suspense>

// correct — use the fallback prop for per-usage overrides
<CommentsList fallback={<CommentsListSkeletonA />} />
```

To make the failure concrete: if `CommentsList` has a definition-time fallback of `<CommentsListSkeletonB />` and a consumer wraps it expecting `<CommentsListSkeletonA />` to appear, only `<CommentsListSkeletonB />` ever renders — silently, with no error or warning:

```tsx
// CommentsListSkeletonA is never rendered — withSuspense's inner boundary
// intercepts the suspension before the outer one fires
<Suspense fallback={<CommentsListSkeletonA />}>
  <CommentsList fallback={<CommentsListSkeletonB />} />
</Suspense>
```

The `fallback` prop is the correct API for per-usage overrides. If full manual `<Suspense>` control is needed, use the [unwrapped escape hatch export](#escape-hatch) instead.

## Conventions

### Default exports only

`withSuspense` wraps the default export of a file — never an internal sub-component. The wrapping is the last thing before the export:

```tsx
async function CommentsList(): Promise<ReactElement> { ... }

const fallback = <p>Loading comments...</p>

export default withSuspense(CommentsList, fallback)
```

Wrapping a sub-component defined inside a page or layout creates a module-level `const` at the point where `withSuspense` is called — and `const` declarations are not hoisted. Any component or variable referenced before that `const` must be defined above it, which constrains file layout in ways that functions alone do not. Moving the component into its own file eliminates the constraint.

### Route-private components

When a component is only used by one page, colocate it inside that route's directory rather than in a shared components folder. Apply `withSuspense` to its default export, and the page imports it cleanly by name:

```text
src/app/database/
  action/
    comments-list.tsx   ← withSuspense applied here
    page.tsx            ← imports and uses <CommentsList />
```

```tsx
// comments-list.tsx
async function CommentsList(): Promise<ReactElement> { ... }

const fallback = <p>Loading comments...</p>

export default withSuspense(CommentsList, fallback)
```

```tsx
// page.tsx
import CommentsList from './comments-list'

function ActionPage(): ReactElement {
  return (
    <main>
      <CommentsList />
    </main>
  )
}

export default ActionPage
```

The consumer never sees `withSuspense` — the component imports and renders exactly like any other component.

### Naming the wrapped export

How a component file names its exports signals which version is primary. Two patterns cover most cases:

**Wrapped as default, unwrapped as named** (recommended) — the wrapped version is what most consumers want:

```tsx
async function CommentsList(): Promise<ReactElement> { ... }

const fallback = <p>Loading comments...</p>

export default withSuspense(CommentsList, fallback)

export { CommentsList }
```

**Wrapped as named, unwrapped as default** — when the unwrapped component is genuinely the primary version:

```tsx
async function CommentsList(): Promise<ReactElement> { ... }

const fallback = <p>Loading comments...</p>

const CommentsListStreaming = withSuspense(CommentsList, fallback)

export default CommentsList

export { CommentsListStreaming }
```

The name `CommentsListStreaming` signals at the import site that this version handles its own suspension.

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
