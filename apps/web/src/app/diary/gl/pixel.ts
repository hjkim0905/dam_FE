import { CanvasTexture, LinearMipmapLinearFilter, NearestFilter, SRGBColorSpace } from 'three';

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

/** 사진과 스티커가 붙는 속지. 픽셀이 아니라 또렷해야 해서 크게 그려 부드럽게 줄인다. */
export function paperCanvas(width: number, height: number, scale: number, draw: (paint: Paint) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const paint = canvas.getContext('2d');
  if (paint) {
    paint.scale(scale, scale);
    draw(paint);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 4;
  return texture;
}
