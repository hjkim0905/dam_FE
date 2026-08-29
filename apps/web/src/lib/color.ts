export type Rgb = { r: number; g: number; b: number };

const CHANNELS = 4;
const OPAQUE = 255;
const NEAR_WHITE = 240;
const NEAR_BLACK = 20;

/** 흰 하늘이나 검은 그림자가 평균을 지배하면 어느 사진이든 회색이 나온다. */
function isExtreme({ r, g, b }: Rgb): boolean {
  const white = r > NEAR_WHITE && g > NEAR_WHITE && b > NEAR_WHITE;
  const black = r < NEAR_BLACK && g < NEAR_BLACK && b < NEAR_BLACK;
  return white || black;
}

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(Math.floor(value), max));
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function averageColor(rgba: Uint8ClampedArray): Rgb | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let i = 0; i < rgba.length; i += CHANNELS) {
    if (rgba[i + 3] < OPAQUE) continue;

    const pixel = { r: rgba[i], g: rgba[i + 1], b: rgba[i + 2] };
    if (isExtreme(pixel)) continue;

    r += pixel.r;
    g += pixel.g;
    b += pixel.b;
    count += 1;
  }

  if (count === 0) return null;

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

export function pixelAt(
  rgba: Uint8ClampedArray,
  width: number,
  x: number,
  y: number
): Rgb {
  const height = rgba.length / CHANNELS / width;
  const offset = (clamp(y, height - 1) * width + clamp(x, width - 1)) * CHANNELS;

  return { r: rgba[offset], g: rgba[offset + 1], b: rgba[offset + 2] };
}
