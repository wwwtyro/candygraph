## 0.5.0

- Removed the memory management mechanics around `retain()`. All renderables are
  now retained by default. Renderables that go out of scope will be garbage
  collected, or one may call their associated `dispose()` functions to perform
  an immediate manual cleanup.
