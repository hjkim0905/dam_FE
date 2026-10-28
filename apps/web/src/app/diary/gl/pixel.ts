import { CanvasTexture, NearestFilter, SRGBColorSpace } from 'three';

/*
 * 담. 의 글자는 14px 픽셀 폰트다. 책도 같은 결로 보이도록 텍스처를 작게 그리고,
 * 키울 때 픽셀을 뭉개지 않고 그대로 늘린다. 페이지 한 장이 폰에서 기기 픽셀로
 * 500 남짓이라 176 칸으로 그리면 한 칸이 세 픽셀 안팎이 된다.
 */
export const PAGE_TEXELS = { width: 176, height: 246 };

export type Paint = CanvasRenderingContext2D;

export function pixelCanvas(width: number, height: number, draw: (paint: Paint) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const paint = canvas.getContext('2d');
  if (paint) {
    paint.imageSmoothingEnabled = false;
    draw(paint);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

/** 캔버스의 arc 는 가장자리를 흐리게 칠한다. 픽셀 원은 줄마다 사각형으로 채운다. */
export function pixelCircle(paint: Paint, cx: number, cy: number, radius: number, color: string) {
  paint.fillStyle = color;
  for (let dy = -radius; dy <= radius; dy += 1) {
    /* 반 칸 크게 재야 위아래 끝에 한 칸짜리 꼭지가 튀어나오지 않는다. */
    const half = Math.floor(Math.sqrt((radius + 0.5) ** 2 - dy * dy));
    paint.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
  }
}

/** 한 칸짜리 외곽선이 있는 사각형. 픽셀아트의 테두리는 선이 아니라 칸이다. */
export function pixelBox(
  paint: Paint,
  { x, y, width, height }: { x: number; y: number; width: number; height: number },
  fill: string,
  outline: string
) {
  paint.fillStyle = outline;
  paint.fillRect(x, y, width, height);
  paint.fillStyle = fill;
  paint.fillRect(x + 1, y + 1, width - 2, height - 2);
}

/** 갈무리는 14px 에서만 또렷하다. 기준선도 정수 칸에 맞춘다. */
export function pixelText(paint: Paint, text: string, x: number, y: number, color: string, font: string, scale = 1) {
  paint.fillStyle = color;
  paint.font = `${14 * scale}px ${font}`;
  paint.textBaseline = 'top';
  paint.fillText(text, Math.round(x), Math.round(y));
}
