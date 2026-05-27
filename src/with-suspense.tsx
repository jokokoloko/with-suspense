import {
  Suspense,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react'

function withSuspense<T extends object>(
  Component: ComponentType<T>,
  fallback: ReactNode = 'Loading...',
): (props: T & { fallback?: ReactNode }) => ReactElement {
  function WithSuspense({
    fallback: fallbackOverride,
    ...props
  }: T & { fallback?: ReactNode }): ReactElement {
    const resolvedFallback =
      fallbackOverride === undefined ? fallback : fallbackOverride

    return (
      <Suspense fallback={resolvedFallback}>
        <Component {...(props as T)} />
      </Suspense>
    )
  }

  WithSuspense.displayName = `WithSuspense(${Component.displayName ?? Component.name})`

  return WithSuspense
}

export default withSuspense
