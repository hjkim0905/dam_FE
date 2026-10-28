import {
  BackSide,
  CanvasTexture,
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  type Texture,
} from 'three';
import { bend, type Fold, type Size } from '@/lib/curl';

const SEGMENTS = 24;
const SHADOW_SPREAD = 1.25;

export type Sticker = {
  readonly group: Group;
  readonly hit: Mesh;
  readonly size: Size;
  shape: (fold: Fold | null, lift: number) => void;
  dispose: () => void;
};

function softShadow(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  return new CanvasTexture(canvas);
}

/** 원점이 스티커의 (0, 0) 모서리다. 그룹 위치는 그 모서리가 종이 위에서 어디 있는지다. */
export function createSticker(size: Size, face: Texture): Sticker {
  const geometry = new PlaneGeometry(size.width, size.height, SEGMENTS, SEGMENTS);
  geometry.translate(size.width / 2, size.height / 2, 0);
  const rest = Float32Array.from(geometry.attributes.position.array);

  const front = new Mesh(geometry, new MeshStandardMaterial({ map: face, roughness: 0.55, side: FrontSide }));
  const back = new Mesh(geometry, new MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.9, side: BackSide }));

  const shadowTexture = softShadow();
  const shadowMaterial = new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  const shadow = new Mesh(new PlaneGeometry(size.width * SHADOW_SPREAD, size.height * SHADOW_SPREAD), shadowMaterial);
  shadow.position.set(size.width / 2, size.height / 2, 0.0005);

  const group = new Group();
  group.add(shadow, front, back);

  const shape: Sticker['shape'] = (fold, lift) => {
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const [x, y, z] = fold ? bend(rest[i * 3], rest[i * 3 + 1], fold) : [rest[i * 3], rest[i * 3 + 1], 0];
      position.setXYZ(i, x, y, z + lift);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();

    /* 높이 들수록 그림자는 옅어지고 번지며 빛 반대쪽으로 밀려난다. */
    shadowMaterial.opacity = 0.35 * (1 - Math.min(1, lift * 4)) + 0.12;
    shadow.scale.setScalar(1 + lift * 2);
    shadow.position.x = size.width / 2 + lift * 0.4;
    shadow.position.y = size.height / 2 - lift * 0.6;
  };

  shape(null, 0);

  return {
    group,
    hit: front,
    size,
    shape,
    dispose: () => {
      geometry.dispose();
      shadow.geometry.dispose();
      shadowTexture.dispose();
      shadowMaterial.dispose();
      [front, back].forEach((mesh) => (mesh.material as MeshStandardMaterial).dispose());
    },
  };
}
