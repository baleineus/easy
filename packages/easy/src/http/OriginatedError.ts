import { VerbOptions } from './Verb';
import { ErrorOrigin } from '../types/ErrorOrigin';
import { isError } from '../types/Is';

export class OriginatedError extends Error {
  constructor(
    readonly origin: ErrorOrigin,
    readonly options?: VerbOptions
  ) {
    super();
    if (isError(origin)) this.stack = origin.stack;
  }
}

export const isOriginatedError = (e?: unknown): e is OriginatedError => isError(e) && e instanceof OriginatedError;

export const toOriginatedError = (e: unknown, options?: VerbOptions): OriginatedError =>
  isOriginatedError(e) ? e : new OriginatedError(e as ErrorOrigin, options);
