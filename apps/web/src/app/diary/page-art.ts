import type { DiaryItem, DiaryPage } from '@/lib/api/diary';
import { dateLabel } from '@/lib/diary';
import { drawSprite, spriteSize } from './stickers';

/* 책 텍스처와 편집 화면이 같은 크기로 그린다. 픽셀 한 칸이 CELL 픽셀이다. */
export const PAGE_PX = { width: 352, height: 492 };
const CELL = 2;
const PAPER = '#fffaf0';
const DOT = '#ead9c6';
const INK = '#5a4d44';
const FRAME_LINE = '#e2d4c0';
const TAPE = 'rgba(242, 167, 180, 0.75)';
/* 페이지 폭에 대한 기본 크기. 배율 1 일 때의 크기다. */
const PHOTO_WIDTH = 0.42;
const STICKER_WIDTH = 0.2;
const TEXT_SIZE = 28;
/* 사진을 이만큼 작게 줄였다가 키운다. 픽셀이 보여야 책 전체와 같은 결이다. */
const PHOTO_PIXEL = 3;

export type Images = ReadonlyMap<number, HTMLImageElement>;

export function drawPaper(paint: CanvasRenderingContext2D, width = PAGE_PX.width, height = PAGE_PX.height) {
  paint.fillStyle = PAPER;
  paint.fillRect(0, 0, width, height);
  paint.fillStyle = DOT;
  for (let y = 16; y < height; y += 20) {
    for (let x = 16; x < width; x += 20) paint.fillRect(x, y, CELL, CELL);
  }
}

/** 회전 전, 배율을 곱한 크기. 편집 화면의 손잡이와 터치 영역도 이 크기를 쓴다. */
export function itemBounds(item: Pick<DiaryItem, 'kind' | 'scale' | 'sticker' | 'text'>, font: string) {
  if (item.kind === 'PHOTO') {
    const width = PAGE_PX.width * PHOTO_WIDTH * item.scale;
    return { width, height: width * 1.2 };
  }
  if (item.kind === 'STICKER') {
    const sprite = spriteSize(item.sticker ?? '');
    const width = PAGE_PX.width * STICKER_WIDTH * item.scale;
    return { width, height: (width * sprite.height) / sprite.width };
  }
  const size = textSize(item.scale);
  return { width: measure(item.text ?? '', size, font), height: size * 1.2 };
}

/* 갈무리는 14 의 배수에서만 또렷하다. 키우는 것도 14 칸씩. */
const textSize = (scale: number): number => Math.max(14, Math.round((TEXT_SIZE * scale) / 14) * 14);

let measurer: CanvasRenderingContext2D | null = null;
function measure(text: string, size: number, font: string): number {
  measurer ??= document.createElement('canvas').getContext('2d');
  if (!measurer) return text.length * size;
  measurer.font = `${size}px ${font}`;
  return Math.ceil(measurer.measureText(text).width);
}

function box(paint: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fill: string) {
  paint.fillStyle = FRAME_LINE;
  paint.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  paint.fillStyle = fill;
  paint.fillRect(Math.round(x) + CELL, Math.round(y) + CELL, Math.round(width) - CELL * 2, Math.round(height) - CELL * 2);
}

/** 정사각형으로 가운데를 잘라 작게 줄였다 키운다. 사진이 아직 안 왔으면 그날의 색으로 채운다. */
function pixelPhoto(paint: CanvasRenderingContext2D, item: DiaryItem, image: HTMLImageElement | undefined,
  x: number, y: number, size: number) {
  if (!image || !image.complete || image.naturalWidth === 0) {
    paint.fillStyle = item.color ?? DOT;
    paint.fillRect(Math.round(x), Math.round(y), Math.round(size), Math.round(size));
    return;
  }
  const cells = Math.max(8, Math.round(size / PHOTO_PIXEL));
  const small = document.createElement('canvas');
  small.width = cells;
  small.height = cells;
  const shrink = small.getContext('2d');
  if (!shrink) return;
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  shrink.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, cells, cells);
  paint.imageSmoothingEnabled = false;
  paint.drawImage(small, Math.round(x), Math.round(y), Math.round(size), Math.round(size));
}

function drawPhoto(paint: CanvasRenderingContext2D, item: DiaryItem, image: HTMLImageElement | undefined, font: string) {
  const { width, height } = itemBounds(item, font);
  const left = -width / 2;
  const top = -height / 2;
  const inset = width * 0.07;
  const size = width - inset * 2;
  if (item.frame === 'round') {
    paint.save();
    paint.beginPath();
    paint.arc(0, top + width / 2, width / 2, 0, Math.PI * 2);
    paint.clip();
    pixelPhoto(paint, item, image, left, top, width);
    paint.restore();
    return;
  }
  box(paint, left, top, width, item.frame === 'tape' ? width : height, '#ffffff');
  pixelPhoto(paint, item, image, left + inset, top + inset, size);
  if (item.frame === 'tape') {
    paint.fillStyle = TAPE;
    paint.fillRect(Math.round(-width * 0.2), Math.round(top - CELL * 3), Math.round(width * 0.4), CELL * 7);
    return;
  }
  paint.fillStyle = INK;
  paint.font = `${textSize(item.scale * 0.5)}px ${font}`;
  paint.textBaseline = 'middle';
  paint.fillText(dateLabel(item.date), Math.round(left + inset), Math.round(top + inset + size + (height - inset - size) / 2));
}

/** 붙인 것 하나를 (0, 0) 을 가운데로 그린다. 놓는 자리와 각도는 부르는 쪽이 정한다. */
export function drawItem(paint: CanvasRenderingContext2D, item: DiaryItem, images: Images, font: string) {
  if (item.kind === 'PHOTO') {
    drawPhoto(paint, item, item.entryId === null ? undefined : images.get(item.entryId), font);
    return;
  }
  const { width, height } = itemBounds(item, font);
  if (item.kind === 'STICKER') {
    const sprite = spriteSize(item.sticker ?? '');
    drawSprite(paint, item.sticker ?? '', -width / 2, -height / 2, width / sprite.width);
    return;
  }
  paint.fillStyle = INK;
  paint.font = `${textSize(item.scale)}px ${font}`;
  paint.textBaseline = 'middle';
  paint.fillText(item.text ?? '', Math.round(-width / 2), 0);
}

export function drawPage(paint: CanvasRenderingContext2D, page: DiaryPage | null, images: Images, font: string) {
  paint.imageSmoothingEnabled = false;
  drawPaper(paint);
  if (!page) return;
  [...page.items].sort((a, b) => a.layer - b.layer || a.id - b.id).forEach((item) => {
    paint.save();
    paint.translate(item.x * PAGE_PX.width, item.y * PAGE_PX.height);
    paint.rotate(item.rotation);
    drawItem(paint, item, images, font);
    paint.restore();
  });
}

/* 사진 주소는 서명이 바뀌어 매번 다르다. 같은 기록의 사진은 한 번만 내려받는다. */
const loading = new Map<number, Promise<HTMLImageElement>>();

/** 캔버스에 그린 뒤 텍스처로 올리려면 crossOrigin 이 있어야 한다. 없으면 WebGL 이 거부한다. */
export function loadPhoto(entryId: number, url: string): Promise<HTMLImageElement> {
  const cached = loading.get(entryId);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => {
      loading.delete(entryId);
      reject(new Error(`사진을 불러오지 못했다: ${entryId}`));
    };
    image.src = url;
  });
  loading.set(entryId, promise);
  return promise;
}

/** 페이지들에 붙은 사진을 모두 받아 둔다. 실패한 사진은 그날의 색으로 남는다. */
export async function loadPhotos(pages: readonly DiaryPage[]): Promise<Map<number, HTMLImageElement>> {
  const photos = pages.flatMap((page) => page.items)
    .filter((item): item is DiaryItem & { entryId: number; photoUrl: string } =>
      item.entryId !== null && item.photoUrl !== null);
  const settled = await Promise.allSettled(photos.map((item) => loadPhoto(item.entryId, item.photoUrl)
    .then((image) => [item.entryId, image] as const)));
  return new Map(settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])));
}
