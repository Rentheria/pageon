export type PageonErrorCode =
  | 'CONTAINER_NOT_FOUND'
  | 'INVALID_SOURCE'
  | 'SOURCE_NOT_ALLOWED'
  | 'PDF_LOAD_FAILED'
  | 'PAGE_NOT_FOUND'
  | 'RENDER_FAILED'
  | 'RENDER_CANCELLED'
  | 'UNSUPPORTED_BROWSER'
  | 'MEMORY_LIMIT_EXCEEDED';

export interface PageonErrorShape {
  code: PageonErrorCode;
  message: string;
  cause?: unknown;
  details?: Record<string, unknown>;
}

export class PageonError extends Error implements PageonErrorShape {
  code: PageonErrorCode;
  cause?: unknown;
  details?: Record<string, unknown>;

  constructor({ code, message, cause, details }: PageonErrorShape) {
    super(message);
    this.name = 'PageonError';
    this.code = code;
    this.cause = cause;
    this.details = details;
  }

  static is(error: unknown): error is PageonError {
    return error instanceof PageonError;
  }
}

export function toPageonError(error: unknown, fallback: Omit<PageonErrorShape, 'cause'>): PageonError {
  if (error instanceof PageonError) {
    return error;
  }

  return new PageonError({
    ...fallback,
    cause: error
  });
}
