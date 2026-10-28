/*
 * 담. 의 픽셀 스티커. 글자 한 칸이 픽셀 한 칸이다. 이름은 서버가 받는 꼴(소문자와 하이픈)과
 * 같아야 저장된다. 그림을 고쳐도 이름은 바꾸지 않는다. 이미 붙인 스티커가 사라진다.
 */

const INK = '#5a4d44';
const WHITE = '#fffaf0';

type Sprite = { rows: readonly string[]; colors: Readonly<Record<string, string>> };

export const STICKERS: Readonly<Record<string, Sprite>> = {
  'heart-pink': {
    colors: { o: INK, p: '#f2a7b4', h: WHITE },
    rows: [
      '..oo...oo..',
      '.ohpo.oppo.',
      'ohpppoppppo',
      'opppppppppo',
      'opppppppppo',
      '.opppppppo.',
      '..opppppo..',
      '...opppo...',
      '....opo....',
      '.....o.....',
    ],
  },
  'star-yellow': {
    colors: { o: INK, y: '#f6cf7a', h: WHITE },
    rows: [
      '.....o.....',
      '....oyo....',
      '....oyo....',
      'ooooyyyoooo',
      'oyyyyhyyyyo',
      '.oyyyyyyyo.',
      '..oyyyyyo..',
      '.oyyyoyyyo.',
      '.oyyo.oyyo.',
      'oyyo...oyyo',
      'ooo.....ooo',
    ],
  },
  'flower-pink': {
    colors: { o: INK, p: '#f2a7b4', y: '#f6cf7a', g: '#9fd3b5' },
    rows: [
      '...ooooo...',
      '..oppoppo..',
      '.oppoyoppo.',
      '.oooyyyooo.',
      '.oppoyoppo.',
      '..oppoppo..',
      '...ooooo...',
      '....ogo....',
      '..oogggoo..',
      '....ogo....',
      '....ogo....',
    ],
  },
  cloud: {
    colors: { o: INK, h: WHITE },
    rows: [
      '....oooo.....',
      '..oohhhhoo...',
      '.ohhhhhhhhooo',
      'ohhhhhhhhhhho',
      'ohhhhhhhhhhho',
      '.ohhhhhhhhho.',
      '..ooooooooo..',
    ],
  },
  'drop-blue': {
    colors: { o: INK, b: '#9cc3ef', h: WHITE },
    rows: [
      '....o....',
      '...obo...',
      '...obo...',
      '..obbbo..',
      '.obhbbbo.',
      'obhbbbbbo',
      'obhbbbbbo',
      'obbbbbbbo',
      '.obbbbbo.',
      '..ooooo..',
    ],
  },
  sparkle: {
    colors: { o: INK, y: '#f6cf7a', h: WHITE },
    rows: [
      '....o....',
      '....y....',
      '...yhy...',
      'oyyhhhyyo',
      '...yhy...',
      '....y....',
      '....o....',
    ],
  },
  smile: {
    colors: { o: INK, y: '#f6cf7a' },
    rows: [
      '...ooooo...',
      '..oyyyyyo..',
      '.oyyyyyyyo.',
      'oyyoyyyoyyo',
      'oyyoyyyoyyo',
      'oyyyyyyyyyo',
      'oyoyyyyyoyo',
      'oyyoooooyyo',
      '.oyyyyyyyo.',
      '..oyyyyyo..',
      '...ooooo...',
    ],
  },
  cherry: {
    colors: { o: INK, r: '#e86a7a', h: WHITE, g: '#9fd3b5' },
    rows: [
      '......oo...',
      '.....ogo...',
      '....og.o...',
      '...og...o..',
      '..og....o..',
      '.ooo...ooo.',
      'orrho.orrho',
      'orrro.orrro',
      'orrro.orrro',
      '.ooo...ooo.',
    ],
  },
};

export const STICKER_NAMES = Object.keys(STICKERS);

export function spriteSize(name: string): { width: number; height: number } {
  const sprite = STICKERS[name];
  if (!sprite) return { width: 1, height: 1 };
  return { width: Math.max(...sprite.rows.map((row) => row.length)), height: sprite.rows.length };
}

/** 칸 하나를 cell 픽셀로 칠한다. 모르는 이름은 그리지 않는다. 옛 앱이 새 스티커를 만나도 깨지지 않게. */
export function drawSprite(paint: CanvasRenderingContext2D, name: string, x: number, y: number, cell: number) {
  const sprite = STICKERS[name];
  if (!sprite) return;
  sprite.rows.forEach((row, r) => {
    [...row].forEach((key, c) => {
      const color = sprite.colors[key];
      if (!color) return;
      paint.fillStyle = color;
      paint.fillRect(Math.round(x + c * cell), Math.round(y + r * cell), Math.ceil(cell), Math.ceil(cell));
    });
  });
}

/** 바텀시트와 편집 화면이 <img> 로 쓰는 그림. 한 번 만들면 다시 그리지 않는다. */
const urls = new Map<string, string>();

export function spriteUrl(name: string, cell = 4): string {
  const key = `${name}@${cell}`;
  const cached = urls.get(key);
  if (cached) return cached;
  const { width, height } = spriteSize(name);
  const canvas = document.createElement('canvas');
  canvas.width = width * cell;
  canvas.height = height * cell;
  const paint = canvas.getContext('2d');
  if (paint) drawSprite(paint, name, 0, 0, cell);
  const url = canvas.toDataURL('image/png');
  urls.set(key, url);
  return url;
}
