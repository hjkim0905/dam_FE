'use client';

import { strings } from '@/lib/i18n';
import LoadingCapsule from './loading-capsule';

export default function Loading() {
  return <LoadingCapsule label={strings().loading} />;
}
