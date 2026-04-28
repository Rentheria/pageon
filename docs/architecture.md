# Architecture

Core components:

- `Pageon`: orchestration, state, lifecycle.
- `PdfLoader`: PDF.js loading and worker config.
- `PageRenderer`: page rendering and render cancellation.
- `RenderQueue`: render scheduling and priority.
- `PageCache`: LRU cache for rendered pages.
- `MemoryManager`: canvas lifecycle and memory heuristics.
- `SourceValidator`: secure source validation.
- `ResponsiveController`: ResizeObserver + window resize fallback.
- `GestureController`: Pointer events + touch/mouse fallback.
