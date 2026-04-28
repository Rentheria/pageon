# Troubleshooting

## PDF_LOAD_FAILED

- Verify URL and CORS headers.
- Verify `pdfWorkerSrc` if custom worker is used.
- Try `useWorker: false` to isolate worker-related issues.

## SOURCE_NOT_ALLOWED

- Check `security.allowRemote` and `security.allowedDomains`.
- For blob/data URLs, verify `allowBlob` / `allowDataUrl`.

## MEMORY_LIMIT_EXCEEDED

- Increase `security.maxFileSize` or provide smaller PDF.
- Reduce `performance.maxCachedPages` and set `mobileMemoryMode: 'low'`.
