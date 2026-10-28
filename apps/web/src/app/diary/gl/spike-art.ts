import { CanvasTexture, SRGBColorSpace } from 'three';

/*
 * 스파이크 전용 가짜 그림. 실제 페이지는 편집 화면을 찍은 이미지가 들어갈 자리라,
 * 이 파일은 그 단계에서 통째로 지운다.
 */

const PAPER = '#f7f3ea';
const INK = '#4a443e';
const DROPS = ['#793a03', '#7b7873', '#94764c', '#a6847b', '#7c3444', '#3b3632', '#c9a24a', '#6f8f7a'];
const PAGE_PX = { width: 1024, height: 1434 };

function texture(canvas: HTMLCanvasElement): CanvasTexture {
  const result = new CanvasTexture(canvas);
  result.colorSpace = SRGBColorSpace;
  result.anisotropy = 4;
  return result;
}

function canvasOf(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2d 캔버스를 만들 수 없습니다');
  return [canvas, context];
}

function paperGrain(context: CanvasRenderingContext2D, width: number, height: number, seed: number) {
  let state = seed * 9301 + 49297;
  const random = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
  for (let i = 0; i < 2600; i += 1) {
    context.fillStyle = `rgba(80, 60, 40, ${random() * 0.05})`;
    context.fillRect(random() * width, random() * height, 2, 2);
  }
}

function photo(
  context: CanvasRenderingContext2D,
  { x, y, size, angle, color }: { x: number; y: number; size: number; angle: number; color: string }
) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.shadowColor = 'rgba(0, 0, 0, 0.18)';
  context.shadowBlur = 18;
  context.shadowOffsetY = 6;
  context.fillStyle = '#ffffff';
  context.fillRect(-size / 2, -size / 2, size, size * 1.18);
  context.shadowColor = 'transparent';
  const inner = size * 0.86;
  const gradient = context.createLinearGradient(0, -inner / 2, 0, inner / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, '#1f1b17');
  context.fillStyle = gradient;
  context.fillRect(-inner / 2, -inner / 2, inner, inner);
  context.restore();
}

export function pageTexture(index: number, font: string): CanvasTexture {
  const { width, height } = PAGE_PX;
  const [canvas, context] = canvasOf(width, height);
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  paperGrain(context, width, height, index + 1);

  context.fillStyle = INK;
  context.font = `56px ${font}`;
  context.fillText(`10월 ${index * 4 + 1}일`, 80, 140);

  DROPS.forEach((color, i) => {
    context.fillStyle = DROPS[(i + index) % DROPS.length];
    context.beginPath();
    context.arc(110 + i * 112, 240, 34, 0, Math.PI * 2);
    context.fill();
  });

  photo(context, { x: 330, y: 560, size: 380, angle: -0.08, color: DROPS[index % DROPS.length] });
  photo(context, { x: 700, y: 900, size: 320, angle: 0.11, color: DROPS[(index + 3) % DROPS.length] });

  context.fillStyle = INK;
  context.font = `42px ${font}`;
  context.fillText(['feconf 양도 받았다아!!!', '뉴네일!', '담다디담다디', '과제전형 합격!!!'][index % 4], 90, 1300);
  return texture(canvas);
}

export function coverTexture(font: string): CanvasTexture {
  const [canvas, context] = canvasOf(PAGE_PX.width, PAGE_PX.height);
  const gradient = context.createLinearGradient(0, 0, PAGE_PX.width, PAGE_PX.height);
  gradient.addColorStop(0, '#7c3444');
  gradient.addColorStop(1, '#4b1f2a');
  context.fillStyle = gradient;
  context.fillRect(0, 0, PAGE_PX.width, PAGE_PX.height);
  paperGrain(context, PAGE_PX.width, PAGE_PX.height, 99);
  context.fillStyle = PAPER;
  context.font = `168px ${font}`;
  context.fillText('담.', 120, 360);
  context.font = `56px ${font}`;
  context.fillText('2026', 128, 470);
  return texture(canvas);
}

export function blankTexture(): CanvasTexture {
  const [canvas, context] = canvasOf(256, 358);
  context.fillStyle = PAPER;
  context.fillRect(0, 0, 256, 358);
  return texture(canvas);
}

export function stickerTexture(color: string): CanvasTexture {
  const [canvas, context] = canvasOf(512, 512);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, 512, 512);
  const gradient = context.createLinearGradient(0, 40, 0, 472);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, '#1f1b17');
  context.fillStyle = gradient;
  context.fillRect(36, 36, 440, 440);
  return texture(canvas);
}

export const STICKER_COLORS = DROPS.slice(0, 4);
