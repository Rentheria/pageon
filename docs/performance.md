# Performance

## Memory

Configure:

```ts
performance: {
  maxCachedPages: 8,
  maxCanvasPixels: 4_000_000,
  enableAutoCleanup: true,
  mobileMemoryMode: 'normal' // or 'low'
}
```

- Large pages exceeding `maxCanvasPixels` are not cached.
- Auto cleanup evicts pages far from the current page.
- Canvas memory is released by setting width and height to `0`.

## Render queue

Render tasks are prioritized:
1. Current page
2. Next page
3. Previous page
4. Others

Queue prevents duplicate/stale renders and supports cancellation.
