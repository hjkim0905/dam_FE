import * as Sentry from '@sentry/nextjs';
import { options } from './sentry.shared';

Sentry.init(options);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
