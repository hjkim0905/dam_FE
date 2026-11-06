import type { DiaryItem, DiaryPage } from '@/lib/api/diary';
import { requestCutout } from '@/lib/bridge';
import { cutoutPoint, dateLabel, type Square } from '@/lib/diary';
import { drawSticker, loadStickers } from './stickers';

/* 책 텍스처와 편집 화면이 같은 좌표로 그린다. */
export const PAGE_PX = { width: 352, height: 492 };
const CELL = 2;
const PAPER = '#fdfcf8';
const DOT = '#ead9c6';
const INK = '#5a4d44';
const FRAME_LINE = '#e2d4c0';
const TAPE = 'rgba(242, 167, 180, 0.75)';
/* 페이지 폭에 대한 기본 크기. 배율 1 일 때의 크기다. */
const PHOTO_WIDTH = 0.42;
/* 폴라로이드 틀이 사진을 감싸는 두께. 폭에 대한 비율이다. */
const INSET = 0.07;
const STICKER_WIDTH = 0.26;
const TEXT_SIZE = 26;

export type Images = ReadonlyMap<number, HTMLImageElement>;

/* 모눈 노트. 왼쪽 여백에 시간 눈금이 있는 다꾸용 속지다. */
const GRID = 14;
const GRID_LINE = 'rgba(126, 160, 196, 0.22)';
const GRID_BOLD = 'rgba(126, 160, 196, 0.38)';
const MARGIN = 30;
const HOURS = 'rgba(110, 120, 140, 0.55)';

export function drawPaper(paint: CanvasRenderingContext2D, width = PAGE_PX.width, height = PAGE_PX.height) {
  paint.fillStyle = PAPER;
  paint.fillRect(0, 0, width, height);
  paint.lineWidth = 0.6;
  for (let x = MARGIN; x <= width; x += GRID) {
    paint.strokeStyle = (x - MARGIN) % (GRID * 5) === 0 ? GRID_BOLD : GRID_LINE;
    paint.beginPath();
    paint.moveTo(x, 0);
    paint.lineTo(x, height);
    paint.stroke();
  }
  for (let y = GRID; y <= height; y += GRID) {
    paint.strokeStyle = y % (GRID * 2) === 0 ? GRID_BOLD : GRID_LINE;
    paint.beginPath();
    paint.moveTo(MARGIN, y);
    paint.lineTo(width, y);
    paint.stroke();
  }
  paint.fillStyle = HOURS;
  paint.font = '8px -apple-system, "Helvetica Neue", sans-serif';
  paint.textAlign = 'right';
  paint.textBaseline = 'middle';
  for (let hour = 6, y = GRID * 2; y < height - GRID; hour += 1, y += GRID * 2) {
    paint.fillText(String(hour % 24).padStart(2, '0'), MARGIN - 6, y);
  }
  paint.textAlign = 'left';
}

/** 회전 전, 배율을 곱한 크기. 편집 화면의 손잡이와 터치 영역도 이 크기를 쓴다. */
export function itemBounds(item: Pick<DiaryItem, 'kind' | 'scale' | 'sticker' | 'text' | 'frame' | 'entryId'>, font: string) {
  if (item.kind === 'PHOTO') {
    const width = PAGE_PX.width * PHOTO_WIDTH * item.scale;
    if (cutoutPoint(item.frame) === null) return { width, height: width * 1.2 };
    const lifted = cutouts.get(cutoutKey(item));
    return { width, height: lifted ? (width * lifted.naturalHeight) / lifted.naturalWidth : width };
  }
  if (item.kind === 'STICKER') {
    const width = PAGE_PX.width * STICKER_WIDTH * item.scale;
    return { width, height: width };
  }
  const size = textSize(item.scale);
  return { width: measure(item.text ?? '', size, font), height: size * 1.2 };
}

const textSize = (scale: number): number => Math.max(12, Math.round(TEXT_SIZE * scale));

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

/** 정사각형으로 가운데를 잘라 그린다. 사진이 아직 안 왔으면 그날의 색으로 채운다. */
function squarePhoto(paint: CanvasRenderingContext2D, item: DiaryItem, image: HTMLImageElement | undefined,
  x: number, y: number, size: number) {
  if (!image || !image.complete || image.naturalWidth === 0) {
    paint.fillStyle = item.color ?? DOT;
    paint.fillRect(x, y, size, size);
    return;
  }
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const smooth = paint.imageSmoothingEnabled;
  paint.imageSmoothingEnabled = true;
  paint.imageSmoothingQuality = 'high';
  paint.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, x, y, size, size);
  paint.imageSmoothingEnabled = smooth;
}

function drawPhoto(paint: CanvasRenderingContext2D, item: DiaryItem, image: HTMLImageElement | undefined, font: string) {
  const { width, height } = itemBounds(item, font);
  const left = -width / 2;
  const top = -height / 2;
  const inset = width * INSET;
  const size = width - inset * 2;
  const lifted = cutouts.get(cutoutKey(item));
  if (lifted) {
    const smooth = paint.imageSmoothingEnabled;
    paint.imageSmoothingEnabled = true;
    paint.imageSmoothingQuality = 'high';
    paint.drawImage(lifted, left, top, width, height);
    paint.imageSmoothingEnabled = smooth;
    return;
  }
  /* 누끼가 아직 없거나(브라우저, 피사체 없음) 따는 중이면 동그란 사진으로 둔다. */
  if (item.frame === 'round' || cutoutPoint(item.frame) !== null) {
    paint.save();
    paint.beginPath();
    paint.arc(0, top + width / 2, width / 2, 0, Math.PI * 2);
    paint.clip();
    squarePhoto(paint, item, image, left, top, width);
    paint.restore();
    return;
  }
  box(paint, left, top, width, item.frame === 'tape' ? width : height, '#ffffff');
  squarePhoto(paint, item, image, left + inset, top + inset, size);
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
    drawSticker(paint, item.sticker ?? '', -width / 2, -height / 2, width);
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

/** 사진이 보이는 정사각형 칸. 가운데를 (0, 0) 으로 한 페이지 좌표다. 누른 자리를 사진 위의 자리로 바꿀 때 쓴다. */
export function photoSquare(item: DiaryItem, font: string): Square {
  const { width, height } = itemBounds(item, font);
  if (item.frame === 'round') return { x: -width / 2, y: -height / 2, size: width };
  const inset = width * INSET;
  return { x: -width / 2 + inset, y: -height / 2 + inset, size: width - inset * 2 };
}

const cutouts = new Map<string, HTMLImageElement>();
const cutting = new Map<string, Promise<boolean>>();
const cutoutKey = (item: Pick<DiaryItem, 'entryId' | 'frame'>): string => `${item.entryId}|${item.frame}`;

export const cutoutReady = (item: Pick<DiaryItem, 'entryId' | 'frame'>): boolean => cutouts.has(cutoutKey(item));

export const cutoutSrc = (entryId: number, frame: string): string | undefined => cutouts.get(cutoutKey({ entryId, frame }))?.src;

/* 사진 앱에서 피사체를 들어 올릴 때처럼, 움직이지 않고 이만큼 누르고 있으면 누끼를 딴다. */
export const LIFT_MS = 450;

/** 같은 사진의 같은 자리 누끼는 한 번만 딴다. Vision 이 사진마다 1초 가까이 걸린다. 땄으면 true 다. */
export function loadCutout(entryId: number, url: string, frame: string): Promise<boolean> {
  const key = cutoutKey({ entryId, frame });
  const known = cutting.get(key);
  if (known) return known;
  const point = cutoutPoint(frame);
  const promise = requestCutout(String(entryId), url, point === 'whole' || point === null ? undefined : point)
    .then((data) => new Promise<boolean>((resolve) => {
      if (!data) {
        cutting.delete(key);
        resolve(false);
        return;
      }
      const image = new Image();
      image.onload = () => {
        cutouts.set(key, image);
        resolve(true);
      };
      image.onerror = () => resolve(false);
      image.src = data;
    }));
  cutting.set(key, promise);
  return promise;
}

/** 페이지들에 붙은 사진과 스티커 그림을 모두 받아 둔다. 실패한 사진은 그날의 색으로 남는다. */
export async function loadPhotos(pages: readonly DiaryPage[]): Promise<Map<number, HTMLImageElement>> {
  const photos = pages.flatMap((page) => page.items)
    .filter((item): item is DiaryItem & { entryId: number; photoUrl: string } =>
      item.entryId !== null && item.photoUrl !== null);
  const [settled] = await Promise.all([
    Promise.allSettled(photos.map((item) => loadPhoto(item.entryId, item.photoUrl).then((image) => [item.entryId, image] as const))),
    loadStickers(),
    Promise.all(photos.filter((item) => cutoutPoint(item.frame) !== null)
      .map((item) => loadCutout(item.entryId, item.photoUrl, item.frame ?? ''))),
  ]);
  return new Map(settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])));
}
