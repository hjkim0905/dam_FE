import { call } from './client';
import type { UploadTicket } from './types';

export function requestUploadUrl(input: {
  contentType: string;
  contentLength: number;
}): Promise<UploadTicket> {
  return call<UploadTicket>('post', 'photos/upload-url', { json: input });
}
