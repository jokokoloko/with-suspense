import {
  Suspense,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react'

type Props<T> = T & {
  fallback?: ReactNode
  devToolsName?: string
}

type WrappedComponent<T> = (props: Props<T>) => ReactElement

function withSuspense<T extends object>(
  Component: ComponentType<T>,
  fallback: ReactNode = 'Loading...',
): WrappedComponent<T> {
  const displayName = `withSuspense(${Component.displayName ?? Component.name})`

  function WithSuspense({
    fallback: fallbackOverride,
    devToolsName,
    ...props
  }: Props<T>): ReactElement {
    const resolvedFallback =
      fallbackOverride === undefined ? fallback : fallbackOverride

    return (
      <Suspense fallback={resolvedFallback} name={devToolsName}>
        <Component {...(props as T)} />
      </Suspense>
    )
  }

  WithSuspense.displayName = displayName

  return WithSuspense
}

export default withSuspense

export {
  type Props as WithSuspenseProps,
  type WrappedComponent as WithSuspenseComponent,
}
