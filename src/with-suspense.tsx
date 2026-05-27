import {
  Suspense,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react'

type WithSuspenseProps<T> = T & {
  fallback?: ReactNode
  devToolsName?: string
}

function withSuspense<T extends object>(
  Component: ComponentType<T>,
  fallback: ReactNode = 'Loading...',
): (props: WithSuspenseProps<T>) => ReactElement {
  const displayName = `WithSuspense(${Component.displayName ?? Component.name})`

  function WithSuspense({
    fallback: fallbackOverride,
    devToolsName,
    ...props
  }: WithSuspenseProps<T>): ReactElement {
    const resolvedFallback =
      fallbackOverride === undefined ? fallback : fallbackOverride

    const resolvedName = devToolsName ?? displayName

    return (
      <Suspense fallback={resolvedFallback} name={resolvedName}>
        <Component {...(props as T)} />
      </Suspense>
    )
  }

  WithSuspense.displayName = displayName

  return WithSuspense
}

export default withSuspense

export type { WithSuspenseProps }
