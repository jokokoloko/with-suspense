# with-suspense

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
