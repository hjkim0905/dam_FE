import type { CanvasTexture } from 'three';
import { drawPage, PAGE_PX, type Images } from '../page-art';
import type { DiaryPage } from '@/lib/api/diary';
import { shade } from '@/lib/color';
import { PAGE_TEXELS, pixelBox, pixelCanvas, pixelCircle, pixelText } from './pixel';

const PAPER = '#fffaf0';
const INK = '#5a4d44';
const DROPS = ['#f2a7b4', '#f6cf7a', '#9fd3b5', '#9cc3ef', '#c9a7e8', '#f5b48a'];

export function coverTexture(font: string, color: string, year: number): CanvasTexture {
  const { width, height } = PAGE_TEXELS;
  return pixelCanvas(width, height, (paint) => {
    paint.fillStyle = color;
    paint.fillRect(0, 0, width, height);
    paint.fillStyle = shade(color, -0.4);
    for (let i = 6; i < width - 6; i += 4) {
      paint.fillRect(i, 6, 2, 1);
      paint.fillRect(i, height - 7, 2, 1);
    }
    for (let i = 6; i < height - 6; i += 4) {
      paint.fillRect(6, i, 1, 2);
      paint.fillRect(width - 7, i, 1, 2);
    }
    pixelBox(paint, { x: 24, y: 40, width: 128, height: 64 }, PAPER, shade(color, 0.2));
    pixelText(paint, '담.', 40, 52, INK, font, 2);
    pixelText(paint, String(year), 104, 80, INK, font);
    DROPS.forEach((drop, i) => pixelCircle(paint, 40 + i * 19, 190, 6, drop));
  });
}

/** 펼친 면 하나. 페이지가 없으면 점 찍힌 빈 종이다. */
export function sideTexture(page: DiaryPage | null, images: Images, font: string): CanvasTexture {
  return pixelCanvas(PAGE_PX.width, PAGE_PX.height, (paint) => drawPage(paint, page, images, font));
}
