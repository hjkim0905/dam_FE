import type { CanvasTexture } from 'three';
import { PAGE_TEXELS, pixelBox, pixelCanvas, pixelCircle, pixelText, type Paint } from './pixel';

/*
 * 스파이크 전용 가짜 그림. 실제 페이지는 편집 화면을 찍은 이미지가 들어갈 자리라,
 * 이 파일은 그 단계에서 통째로 지운다.
 */

const PAPER = '#fffaf0';
const DOT = '#ead9c6';
const INK = '#5a4d44';
const FRAME_LINE = '#e2d4c0';
const DROPS = ['#f2a7b4', '#f6cf7a', '#9fd3b5', '#9cc3ef', '#c9a7e8', '#f5b48a', '#793a03', '#a6847b'];
const MEMOS = ['feconf 양도!', '뉴네일!', '담다디담다디', '과제전형 합격!'];
const DATES = ['10.23', '10.25', '10.19', '10.08'];

/** 불렛저널처럼 점이 찍힌 종이. 꾸밀 자리가 있다는 느낌을 준다. */
function dottedPaper(paint: Paint, width: number, height: number) {
  paint.fillStyle = PAPER;
  paint.fillRect(0, 0, width, height);
  paint.fillStyle = DOT;
  for (let y = 8; y < height; y += 10) {
    for (let x = 8; x < width; x += 10) paint.fillRect(x, y, 1, 1);
  }
}

/** 픽셀 사진. 그라데이션 대신 띠 몇 개로 칠해야 픽셀 그림으로 읽힌다. */
function photo(paint: Paint, font: string, { x, y, color, date }: { x: number; y: number; color: string; date: string }) {
  pixelBox(paint, { x: x + 2, y: y + 2, width: 64, height: 76 }, 'rgba(90, 77, 68, 0.15)', 'rgba(90, 77, 68, 0.15)');
  pixelBox(paint, { x, y, width: 64, height: 76 }, '#ffffff', FRAME_LINE);
  const bands = [color, color, '#ffffff', INK];
  bands.forEach((band, i) => {
    paint.fillStyle = band;
    paint.globalAlpha = i < 2 ? 1 : 0.12 * i;
    paint.fillRect(x + 5, y + 5 + i * 13, 54, 13);
  });
  paint.globalAlpha = 1;
  pixelText(paint, date, x + 6, y + 60, INK, font);
}

export function pageTexture(index: number, font: string): CanvasTexture {
  const { width, height } = PAGE_TEXELS;
  return pixelCanvas(width, height, (paint) => {
    dottedPaper(paint, width, height);
    photo(paint, font, { x: 16, y: 24, color: DROPS[index % 6], date: DATES[index % 4] });
    photo(paint, font, { x: 92, y: 96, color: DROPS[(index + 3) % 6], date: DATES[(index + 1) % 4] });
    [0, 1, 2, 3, 4].forEach((i) => pixelCircle(paint, 24 + i * 12, 190, 4, DROPS[(i + index) % DROPS.length]));
    pixelText(paint, MEMOS[index % 4], 16, 212, INK, font);
  });
}

export function coverTexture(font: string): CanvasTexture {
  const { width, height } = PAGE_TEXELS;
  return pixelCanvas(width, height, (paint) => {
    paint.fillStyle = '#f6c1cc';
    paint.fillRect(0, 0, width, height);
    /* 바느질 자국. 점선 한 칸씩이 표지를 천처럼 보이게 한다. */
    paint.fillStyle = '#fff3f5';
    for (let i = 6; i < width - 6; i += 4) {
      paint.fillRect(i, 6, 2, 1);
      paint.fillRect(i, height - 7, 2, 1);
    }
    for (let i = 6; i < height - 6; i += 4) {
      paint.fillRect(6, i, 1, 2);
      paint.fillRect(width - 7, i, 1, 2);
    }
    pixelBox(paint, { x: 24, y: 40, width: 128, height: 64 }, PAPER, '#d98fa0');
    pixelText(paint, '담.', 40, 52, INK, font, 2);
    pixelText(paint, '2026', 104, 80, INK, font);
    DROPS.slice(0, 6).forEach((color, i) => pixelCircle(paint, 40 + i * 19, 190, 6, color));
  });
}

export function blankTexture(): CanvasTexture {
  const { width, height } = PAGE_TEXELS;
  return pixelCanvas(width, height, (paint) => dottedPaper(paint, width, height));
}

export function stickerTexture(color: string): CanvasTexture {
  return pixelCanvas(48, 48, (paint) => {
    pixelBox(paint, { x: 0, y: 0, width: 48, height: 48 }, '#ffffff', FRAME_LINE);
    paint.fillStyle = color;
    paint.fillRect(4, 4, 40, 30);
    pixelCircle(paint, 24, 19, 7, '#fffaf0');
    pixelCircle(paint, 24, 19, 4, color);
  });
}

export const STICKER_COLORS = DROPS.slice(0, 4);
