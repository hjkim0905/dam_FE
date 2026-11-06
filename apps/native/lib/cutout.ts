import { requireNativeModule } from "expo";

type Cutout = { cutout: (url: string, x: number | null, y: number | null) => Promise<string> };

/**
 * 피사체만 남긴 PNG 를 data URL 로 돌려준다. point 가 있으면 그 자리의 피사체 하나만,
 * 없으면 피사체를 모두 남긴다. 피사체를 못 찾으면 실패한다.
 */
export const cutout = (url: string, point?: { x: number; y: number }): Promise<string> =>
  requireNativeModule<Cutout>("Cutout").cutout(url, point?.x ?? null, point?.y ?? null);
