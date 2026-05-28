# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
