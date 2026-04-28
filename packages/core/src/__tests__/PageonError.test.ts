import { describe, expect, it } from 'vitest';
import { PageonError } from '../PageonError';

describe('PageonError', () => {
  it('mantiene formato consistente', () => {
    const err = new PageonError({
      code: 'PDF_LOAD_FAILED',
      message: 'Unable to load PDF document.',
      details: { src: 'sample.pdf' }
    });

    expect(err.name).toBe('PageonError');
    expect(err.code).toBe('PDF_LOAD_FAILED');
    expect(err.details).toEqual({ src: 'sample.pdf' });
  });
});
