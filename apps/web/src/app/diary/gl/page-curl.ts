import {
  BackSide,
  BufferAttribute,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  type Texture,
} from 'three';
import { bend, turnedShare, type Fold, type Size } from '@/lib/curl';

/* 세로로 더 촘촘해야 할 이유가 없다. 접힘선이 기울어도 휘는 축은 대개 가로 쪽이다. */
const SEGMENTS_X = 48;
const SEGMENTS_Y = 24;
/* 책등 쪽으로 갈수록 종이가 안으로 말려 들어가 빛이 덜 닿는다. 이 그늘이 없으면 종이 두 장을
   나란히 놓은 것처럼 보인다. */
const GUTTER_DEPTH = 0.3;
const GUTTER_WIDTH = 0.08;

export type Sheet = {
  readonly group: Group;
  readonly meshes: readonly Mesh[];
  /** right 는 오른쪽 더미 위 높이, left 는 왼쪽 더미 위 높이. 넘어간 만큼 그 사이를 오간다. */
  shape: (fold: Fold | null, right: number, left: number) => void;
  /** 앞뒤 그림을 갈아 끼운다. 넘긴 자리에서 멀어진 장은 빈 종이로 바꿔 메모리를 돌려준다. */
  paint: (front: Texture, back: Texture) => void;
  dispose: () => void;
};

function mirrored(texture: Texture): Texture {
  const copy = texture.clone();
  copy.wrapS = RepeatWrapping;
  copy.repeat.x = -1;
  copy.needsUpdate = true;
  return copy;
}

/**
 * 앞뒤 두 장의 메시가 같은 지오메트리를 나눠 쓴다. 한 메시에 양면 재질을 주면 뒷면에도
 * 앞면 그림이 거울처럼 비친다.
 */
export function createSheet(page: Size, front: Texture, back: Texture): Sheet {
  const geometry = new PlaneGeometry(page.width, page.height, SEGMENTS_X, SEGMENTS_Y);
  geometry.translate(page.width / 2, page.height / 2, 0);
  const rest = Float32Array.from(geometry.attributes.position.array);
  const colors = new BufferAttribute(new Float32Array(rest.length), 3);
  geometry.setAttribute('color', colors);

  let backTexture = mirrored(back);
  const paper = { roughness: 0.9, metalness: 0, vertexColors: true };
  const frontMaterial = new MeshStandardMaterial({ ...paper, map: front, side: FrontSide });
  const backMaterial = new MeshStandardMaterial({ ...paper, map: backTexture, side: BackSide });
  const meshes = [new Mesh(geometry, frontMaterial), new Mesh(geometry, backMaterial)];
  meshes.forEach((mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  const group = new Group();
  group.add(...meshes);
  group.position.y = -page.height / 2;

  const shape: Sheet['shape'] = (fold, right, left) => {
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const [px, py] = [rest[i * 3], rest[i * 3 + 1]];
      const [x, y, z] = fold ? bend(px, py, fold) : [px, py, 0];
      const share = fold ? turnedShare(px, py, fold) : 0;
      position.setXYZ(i, x, y, z + right + (left - right) * share);
      const shade = 1 - GUTTER_DEPTH * Math.exp(-Math.abs(x) / GUTTER_WIDTH) * Math.exp(-z * 20);
      colors.setXYZ(i, shade, shade, shade);
    }
    position.needsUpdate = true;
    colors.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  shape(null, 0, 0);

  const paint: Sheet['paint'] = (nextFront, nextBack) => {
    frontMaterial.map = nextFront;
    backTexture.dispose();
    backTexture = mirrored(nextBack);
    backMaterial.map = backTexture;
    frontMaterial.needsUpdate = true;
    backMaterial.needsUpdate = true;
  };

  return {
    group,
    meshes,
    shape,
    paint,
    dispose: () => {
      geometry.dispose();
      backTexture.dispose();
      meshes.forEach((mesh) => (mesh.material as MeshStandardMaterial).dispose());
    },
  };
}
