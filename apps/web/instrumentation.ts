import * as Sentry from '@sentry/nextjs';
import { options } from './sentry.shared';

export function register() {
  Sentry.init(options);
}

export const onRequestError = Sentry.captureRequestError;
