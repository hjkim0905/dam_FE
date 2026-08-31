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

/** 돋보기가 떠올 원본 구간. 집는 점이 가운데 오고, 배율이 높을수록 좁게 본다. */
export function zoomRect(
  center: { x: number; y: number },
  size: number,
  zoom: number
): Rect {
  const span = size / zoom;
  return { x: center.x - span / 2, y: center.y - span / 2, width: span, height: span };
}
