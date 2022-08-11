## 0.9.0

- Renamed `Grid.info` to `Grid.computed`.
- Added support for using multiple draw calls per primitive. If you've been
  using a custom primitive, you'll need to do the following:
  - Rename your `command` function to `commands`.
  - Return a `Record<string, DrawCommand>` from `commands`, where the string is
    a name you give each command. The exported type alias `NamedDrawCommands`
    resolves to this type.
  - Update your primitive's `render` function to accept a `NamedDrawCommands`
    and use the names you provided to find the `DrawCommand` you need.
- Added the `TransparentLineStrip` primitive that allows rendering line strips
  with alpha and avoids the overlap artifacts present in `LineStrip`.
- Added the `OpaqueLineStrip` primitive and a deprecation warning when using
  `LineStrip`.

([#44](https://github.com/wwwtyro/candygraph/pull/44))

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
