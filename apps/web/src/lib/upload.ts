import { ApiError, OFFLINE } from './api/errors';

export type Progress = { loaded: number; total: number };

/** 0 에서 1. 총량을 모를 때가 있어 그때는 진행률을 말하지 않는다. */
export function ratioOf({ loaded, total }: Progress): number | null {
  if (total <= 0) return null;
  return Math.min(1, Math.max(0, loaded / total));
}

/**
 * 서명받은 자리에 사진을 직접 올린다. ky 를 쓰지 않는 유일한 요청이다.
 * fetch 에는 업로드 진행률에 해당하는 것이 없고, 요청 본문 스트리밍은 WebKit 에서
 * 안 된다. 담은 웹뷰 안이라 전부 WebKit 이므로 여기서만 XHR 을 쓴다.
 */
export function uploadPhoto(
  uploadUrl: string,
  photo: Blob,
  onProgress?: (progress: Progress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', uploadUrl);
    request.setRequestHeader('Content-Type', photo.type);

    request.upload.onprogress = (event) => {
      onProgress?.({
        loaded: event.loaded,
        total: event.lengthComputable ? event.total : 0,
      });
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      reject(new ApiError('UPLOAD_FAILED', '사진을 올리지 못했어요', request.status));
    };

    request.onerror = () =>
      reject(new ApiError(OFFLINE, '연결을 확인해 주세요', 0));
    request.onabort = () =>
      reject(new ApiError('UPLOAD_ABORTED', '사진 올리기를 멈췄어요', 0));

    request.send(photo);
  });
}
