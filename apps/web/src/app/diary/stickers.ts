/*
 * 다꾸 스티커는 Microsoft Fluent Emoji 3D (MIT, public/stickers/LICENSE.txt) 다. 이름은 서버가 받는
 * 꼴(소문자와 하이픈, 32자 이하)과 같아야 저장된다. 파일을 바꿔도 이름은 바꾸지 않는다. 이미 붙인 스티커가 사라진다.
 */
export const STICKER_NAMES: readonly string[] = [
  'pink-heart', 'red-heart', 'two-hearts', 'sparkling-heart', 'heart-with-ribbon', 'love-letter',
  'sparkles', 'star', 'glowing-star', 'rainbow', 'cloud', 'sun-with-face', 'crescent-moon', 'bubbles',
  'smiling-face-with-smiling-eyes', 'smiling-face-with-hearts', 'star-struck',
  'teddy-bear', 'bear', 'cat-face', 'dog-face', 'rabbit-face', 'hamster', 'panda', 'penguin', 'hatching-chick',
  'frog', 'unicorn', 'dolphin', 'butterfly',
  'shortcake', 'birthday-cake', 'cupcake', 'doughnut', 'cookie', 'croissant', 'pancakes', 'soft-ice-cream',
  'shaved-ice', 'lollipop', 'candy', 'bubble-tea', 'hot-beverage', 'teacup-without-handle', 'clinking-glasses',
  'strawberry', 'cherries', 'peach', 'watermelon', 'lemon',
  'cherry-blossom', 'tulip', 'sunflower', 'four-leaf-clover',
  'ribbon', 'wrapped-gift', 'balloon', 'party-popper', 'crown', 'ring', 'lipstick', 'camera-with-flash',
  'headphone', 'musical-note', 'pencil', 'scissors', 'paperclip', 'pushpin', 'airplane', 'house',
];

/* 픽셀 스티커 시절에 붙인 것들. 서버에 남은 이름을 가장 닮은 그림으로 그린다. */
const RENAMED: Readonly<Record<string, string>> = {
  'heart-pink': 'pink-heart',
  'star-yellow': 'star',
  'flower-pink': 'cherry-blossom',
  'drop-blue': 'bubbles',
  sparkle: 'sparkles',
  smile: 'smiling-face-with-smiling-eyes',
  cherry: 'cherries',
};

export const stickerUrl = (name: string): string => `/stickers/${RENAMED[name] ?? name}.webp`;

const images = new Map<string, HTMLImageElement>();
let loading: Promise<void> | null = null;

/** 모두 받아 둔다. 책 텍스처는 한 번에 그려서, 그때 없던 스티커는 다음에 다시 그릴 때까지 빈자리로 남는다. */
export function loadStickers(): Promise<void> {
  loading ??= Promise.all([...STICKER_NAMES, ...Object.keys(RENAMED)].map((name) => new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => {
      images.set(name, image);
      resolve();
    };
    /* 하나가 안 와도 나머지는 붙어야 한다. 빠진 것은 그리지 않는다. */
    image.onerror = () => resolve();
    image.src = stickerUrl(name);
  }))).then(() => undefined);
  return loading;
}

export const stickerReady = (name: string): boolean => images.has(name);

/** 모르는 이름이나 아직 안 온 그림은 그리지 않는다. 옛 앱이 새 스티커를 만나도 깨지지 않게. */
export function drawSticker(paint: CanvasRenderingContext2D, name: string, x: number, y: number, size: number) {
  const image = images.get(name);
  if (!image) return;
  const smooth = paint.imageSmoothingEnabled;
  paint.imageSmoothingEnabled = true;
  paint.imageSmoothingQuality = 'high';
  paint.drawImage(image, x, y, size, size);
  paint.imageSmoothingEnabled = smooth;
}
