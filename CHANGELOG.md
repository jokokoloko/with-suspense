# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-07-01

### Added

- `WithSuspenseComponent<T>` type export — the `WrappedComponent<T>` return type of `withSuspense`, exposed so consumers can type the wrapped component

### Changed

- **Breaking:** renamed the `devToolsName` prop to `suspenseBoundaryName` — the prop names the `<Suspense>` boundary (the subject it sets), not React DevTools (the destination the value surfaces in); the old name was ambiguous because the HOC exposes two DevTools names, the wrapper `displayName` and the boundary `name`
- `displayName` label capitalized to `WithSuspense(Component)` to match the inner `WithSuspense` component name (reverses the 0.2.0 lowercasing)
- The `<Suspense>` boundary is now unnamed by default — it no longer inherits the wrapper's `WithSuspense(Component)` label as its DevTools `name`, so it behaves like a hand-written `<Suspense>`; set `suspenseBoundaryName` to name it per usage
- Expanded the README and npm keywords (`streaming`, `fallback`, `nextjs`, `app-router`, `react-server-components`, `rsc`) for discoverability

## [0.2.0] - 2026-05-27

### Added

- `devToolsName` prop for usage-site override of the React DevTools `<Suspense name>` label — falls back to the definition-time `displayName` when not set

### Changed

- `displayName` label lowercased to `withSuspense(Component)` — matches the HOC function name and aligns with React's own DevTools conventions (`memo(Component)`, `forwardRef(Component)`)
- Extracted `Props<T>` type alias locally, re-exported as `WithSuspenseProps` — follows the same `Props` / export-as pattern as regular component files

## [0.1.0] - 2026-05-27

### Added

- `withSuspense` HOC — wraps a React component in a `<Suspense>` boundary so usage sites stay clean
- Optional `fallback` prop on the returned component for usage-site override or suppression (`null` renders nothing; omitting uses the definition-time default)
- `WithSuspenseProps<T>` type export so consumers can reference the injected prop shape
