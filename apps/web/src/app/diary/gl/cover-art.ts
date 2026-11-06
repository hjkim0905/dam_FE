import type { CanvasTexture } from 'three';
import { drawPage, PAGE_PX, type Images } from '../page-art';
import type { DiaryPage } from '@/lib/api/diary';
import { shade } from '@/lib/color';
import { paperCanvas } from './pixel';

/* 펼친 면 한 쪽이 폰에서 기기 픽셀로 700 남짓이다. 그보다 크게 그리면 넘길 때마다
   텍스처를 올리느라 한 박자 멈춘다. */
const SIDE_SCALE = 2;

const LABEL = '#fdfaf3';
const INK = '#4a3f38';
const COVER_SCALE = 2;

function roundRect(paint: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  paint.beginPath();
  paint.roundRect(x, y, width, height, radius);
}

/** 천을 씌운 하드커버. 바느질 선, 이름표, 고무줄 밴드가 있다. */
export function coverTexture(font: string, color: string, year: number): CanvasTexture {
  const { width, height } = PAGE_PX;
  return paperCanvas(width, height, COVER_SCALE, (paint) => {
    paint.fillStyle = color;
    paint.fillRect(0, 0, width, height);
    const vignette = paint.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, height * 0.75);
    vignette.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
    paint.fillStyle = vignette;
    paint.fillRect(0, 0, width, height);

    paint.setLineDash([5, 4]);
    paint.lineWidth = 1.2;
    paint.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    roundRect(paint, 12, 12, width - 24, height - 24, 10);
    paint.stroke();
    paint.setLineDash([]);

    paint.shadowColor = 'rgba(0, 0, 0, 0.18)';
    paint.shadowBlur = 8;
    paint.shadowOffsetY = 3;
    paint.fillStyle = LABEL;
    roundRect(paint, 44, 92, width - 120, 128, 8);
    paint.fill();
    paint.shadowColor = 'transparent';
    paint.fillStyle = INK;
    paint.textBaseline = 'alphabetic';
    paint.font = `64px ${font}`;
    paint.fillText('담.', 64, 170);
    paint.font = `26px ${font}`;
    paint.fillText(`${year} diary`, 66, 204);

    const band = width - 44;
    paint.fillStyle = shade(color, 0.3);
    paint.fillRect(band, 0, 14, height);
    paint.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let y = 0; y < height; y += 4) paint.fillRect(band, y, 14, 1.5);
  });
}

/** 표지 안쪽 면지. 페이지가 아니라는 게 보이게, 표지 색을 옅게 깔고 작은 물방울 무늬를 찍는다. 둘이 쓰는 책이면 주인이 우리다. */
export function endpaperTexture(font: string, color: string, year: number, shared: boolean): CanvasTexture {
  const { width, height } = PAGE_PX;
  return paperCanvas(width, height, COVER_SCALE, (paint) => {
    paint.fillStyle = '#fbf7f0';
    paint.fillRect(0, 0, width, height);
    paint.fillStyle = color;
    paint.globalAlpha = 0.22;
    paint.fillRect(0, 0, width, height);
    paint.globalAlpha = 0.45;
    for (let row = 0, y = 14; y < height; row += 1, y += 26) {
      for (let x = row % 2 === 0 ? 14 : 27; x < width; x += 26) {
        paint.beginPath();
        paint.arc(x, y, 3, 0, Math.PI * 2);
        paint.fill();
      }
    }
    paint.globalAlpha = 1;
    paint.shadowColor = 'rgba(0, 0, 0, 0.12)';
    paint.shadowBlur = 6;
    paint.shadowOffsetY = 2;
    paint.fillStyle = LABEL;
    roundRect(paint, 56, height / 2 - 52, width - 112, 104, 8);
    paint.fill();
    paint.shadowColor = 'transparent';
    paint.fillStyle = INK;
    paint.textAlign = 'center';
    paint.font = `22px ${font}`;
    paint.fillText('이 다이어리의 주인은', width / 2, height / 2 - 14);
    paint.font = `30px ${font}`;
    paint.fillText(`${year}년의 ${shared ? '우리' : '나'}`, width / 2, height / 2 + 26);
    paint.textAlign = 'left';
  });
}

/** 펼친 면 하나. 페이지가 없으면 점 찍힌 빈 종이다. */
export function sideTexture(page: DiaryPage | null, images: Images, font: string): CanvasTexture {
  return paperCanvas(PAGE_PX.width, PAGE_PX.height, SIDE_SCALE, (paint) => drawPage(paint, page, images, font));
}
