import { PageonError } from './PageonError';
import type { PageonSecurityOptions, PageonSource } from './types';

export interface ValidatedSource {
  input: string | Blob | Uint8Array;
  normalizedUrl?: string;
}

const DEFAULT_SECURITY: Required<PageonSecurityOptions> = {
  allowRemote: true,
  allowedDomains: [],
  allowBlob: true,
  allowDataUrl: false,
  maxFileSize: Number.POSITIVE_INFINITY
};

function isArrayBufferLike(value: unknown): value is ArrayBuffer {
  return typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer;
}

function hasMimePdf(mime?: string): boolean {
  return (mime ?? '').toLowerCase() === 'application/pdf';
}

export function validateSource(src: PageonSource, security?: PageonSecurityOptions): ValidatedSource {
  const cfg = { ...DEFAULT_SECURITY, ...security };

  if (typeof src === 'string') {
    const raw = src.trim();
    if (!raw) {
      throw new PageonError({ code: 'INVALID_SOURCE', message: 'Source cannot be empty.' });
    }

    const lowered = raw.toLowerCase();
    if (lowered.startsWith('javascript:')) {
      throw new PageonError({ code: 'SOURCE_NOT_ALLOWED', message: 'javascript: URLs are blocked.' });
    }

    if (lowered.startsWith('data:') && !cfg.allowDataUrl) {
      throw new PageonError({ code: 'SOURCE_NOT_ALLOWED', message: 'data: URLs are blocked by security policy.' });
    }

    if (lowered.startsWith('blob:') && !cfg.allowBlob) {
      throw new PageonError({ code: 'SOURCE_NOT_ALLOWED', message: 'blob: URLs are blocked by security policy.' });
    }

    if (/^(https?:)?\/\//i.test(raw)) {
      if (!cfg.allowRemote) {
        throw new PageonError({ code: 'SOURCE_NOT_ALLOWED', message: 'Remote URLs are blocked by security policy.' });
      }

      let parsed: URL;
      try {
        parsed = new URL(raw, typeof window !== 'undefined' ? window.location.href : 'http://localhost/');
      } catch {
        throw new PageonError({ code: 'INVALID_SOURCE', message: 'Malformed source URL.' });
      }

      if (cfg.allowedDomains.length > 0 && !cfg.allowedDomains.includes(parsed.hostname)) {
        throw new PageonError({
          code: 'SOURCE_NOT_ALLOWED',
          message: `Domain ${parsed.hostname} is not allowed.`,
          details: { hostname: parsed.hostname }
        });
      }

      return { input: parsed.toString(), normalizedUrl: parsed.toString() };
    }

    if (lowered.startsWith('file:')) {
      throw new PageonError({ code: 'SOURCE_NOT_ALLOWED', message: 'file: URLs are not supported in browser context.' });
    }

    return { input: raw };
  }

  if (typeof Blob !== 'undefined' && src instanceof Blob) {
    if (!cfg.allowBlob) {
      throw new PageonError({ code: 'SOURCE_NOT_ALLOWED', message: 'Blob sources are blocked by security policy.' });
    }

    if (src.size > cfg.maxFileSize) {
      throw new PageonError({
        code: 'MEMORY_LIMIT_EXCEEDED',
        message: `Source size (${src.size}) exceeds maxFileSize (${cfg.maxFileSize}).`,
        details: { size: src.size, maxFileSize: cfg.maxFileSize }
      });
    }

    if (src.type && !hasMimePdf(src.type)) {
      throw new PageonError({ code: 'INVALID_SOURCE', message: `Unsupported MIME type: ${src.type}. Expected application/pdf.` });
    }

    return { input: src };
  }

  if (isArrayBufferLike(src)) {
    if (src.byteLength > cfg.maxFileSize) {
      throw new PageonError({
        code: 'MEMORY_LIMIT_EXCEEDED',
        message: `Source size (${src.byteLength}) exceeds maxFileSize (${cfg.maxFileSize}).`,
        details: { size: src.byteLength, maxFileSize: cfg.maxFileSize }
      });
    }

    return { input: new Uint8Array(src) };
  }

  throw new PageonError({ code: 'INVALID_SOURCE', message: 'Unsupported source type.' });
}
