# Security

## Source validation

Pageon validates sources before loading:

- Blocks `javascript:` URLs.
- Blocks `data:` by default (`security.allowDataUrl = false`).
- Blocks `file:` in browser context.
- Supports controlled remote URLs, Blob, File and ArrayBuffer.
- Supports domain whitelist with `security.allowedDomains`.
- Supports `security.maxFileSize` for Blob/File/ArrayBuffer.

## CORS

Remote PDF loading is subject to browser CORS policies. Pageon does not bypass CORS restrictions.

## Recommendations

- Use `allowedDomains` in production.
- Keep `allowDataUrl` disabled unless strictly needed.
- Set `maxFileSize` for mobile environments.
