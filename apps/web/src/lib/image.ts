export type Size = { width: number; height: number };
export type Rect = Size & { x: number; y: number };

export function coverRect(image: Size, box: Size): Rect {
  const imageRatio = image.width / image.height;
  const boxRatio = box.width / box.height;

  if (imageRatio > boxRatio) {
    const width = box.height * imageRatio;
    return { x: (box.width - width) / 2, y: 0, width, height: box.height };
  }

  const height = box.width / imageRatio;
  return { x: 0, y: (box.height - height) / 2, width: box.width, height };
}

/** ImageBitmap 은 width/height 가 프로토타입 getter라 spread 로는 값이 빠진다. */
export function fitSize(image: Size, max: number): Size {
  const { width, height } = image;
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };

  const scale = max / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
