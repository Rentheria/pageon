import { describe, expect, it } from 'vitest';
import { validateSource } from '../SourceValidator';
import { PageonError } from '../PageonError';

describe('SourceValidator', () => {
  it('rechaza javascript urls', () => {
    expect(() => validateSource('javascript:alert(1)')).toThrowError(PageonError);
  });

  it('aplica allowRemote=false', () => {
    expect(() => validateSource('https://example.com/a.pdf', { allowRemote: false })).toThrowError(PageonError);
  });

  it('aplica whitelist de dominios', () => {
    expect(() =>
      validateSource('https://evil.com/a.pdf', { allowedDomains: ['trusted.com'] })
    ).toThrowError(/not allowed/i);
  });

  it('valida tamaño en arraybuffer', () => {
    const src = new ArrayBuffer(12);
    expect(() => validateSource(src, { maxFileSize: 8 })).toThrowError(/exceeds/i);
  });
});
