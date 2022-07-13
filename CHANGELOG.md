## 0.8.0

- Refactored all resources from the "create" pattern to classes instantiated
  with `new`. E.g., `createLineStrip(...)` is now `new LineStrip(...)`.
  ([#42](https://github.com/wwwtyro/candygraph/pull/42))

## 0.7.0

- Fixed the blending so that compositing with the webpage looks correct. While
  technically a bugfix, we can't be sure people haven't come to rely on the
  previous blending, so this is a zero-based major version bump.
  ([#41](https://github.com/wwwtyro/candygraph/pull/41))

## 0.6.0

- Cartesian and polar coordinate systems now allow their scopes to be garbage
  collected, removing a memory leak. This requires that a CandyGraph object be
  provided upon creation. ([#37](https://github.com/wwwtyro/candygraph/pull/37))

## 0.5.1

- Fix an error when trying to create text that contains chars that are not
  encoded in the given font
  ([#31](https://github.com/wwwtyro/candygraph/pull/31))

## 0.5.0

- Removed the memory management mechanics around `retain()`. All renderables are
  now retained by default. Renderables that go out of scope will be garbage
  collected, or one may call their associated `dispose()` functions to perform
  an immediate manual cleanup.
  ([#26](https://github.com/wwwtyro/candygraph/pull/26))
