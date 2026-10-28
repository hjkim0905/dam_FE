import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  ShadowMaterial,
  SRGBColorSpace,
  type Texture,
} from 'three';
import type { Size } from '@/lib/curl';

/* 넘기는 몇 장 아래에 깔린 나머지 속지. 실제로 넘기지는 않지만 이 두께가 있어야 책이다. */
export const BLOCK_THICKNESS = 0.035;
export const LEAF_GAP = 0.0025;
const BOARD_THICKNESS = 0.018;
/* 하드커버는 속지보다 사방으로 조금 크다. 이 테두리가 보여야 표지가 판으로 읽힌다. */
const OVERHANG = 0.025;
const PAPER = '#f7f3ea';

function canvasTexture(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context) draw(context);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** 종이 묶음의 옆면. 얇은 줄이 겹쳐 보여야 종이가 여러 장인 것을 안다. */
function edgeTexture(across: boolean): CanvasTexture {
  const texture = canvasTexture(64, 64, (context) => {
    context.fillStyle = '#efe8da';
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = 'rgba(120, 100, 80, 0.18)';
    for (let i = 0; i < 64; i += 4) {
      if (across) context.fillRect(i, 0, 1, 64);
      else context.fillRect(0, i, 64, 1);
    }
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

/** 묶음 윗면. 책등 쪽이 어둡다. spineAtLeft 는 텍스처의 왼쪽 끝이 책등인지. */
function gutterTexture(spineAtLeft: boolean): CanvasTexture {
  return canvasTexture(256, 16, (context) => {
    context.fillStyle = PAPER;
    context.fillRect(0, 0, 256, 16);
    const gradient = context.createLinearGradient(spineAtLeft ? 0 : 256, 0, spineAtLeft ? 40 : 216, 0);
    gradient.addColorStop(0, 'rgba(60, 45, 30, 0.35)');
    gradient.addColorStop(1, 'rgba(60, 45, 30, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 16);
  });
}

function pageBlock(page: Size, spineAtLeft: boolean): Mesh {
  const along = edgeTexture(false);
  const across = edgeTexture(true);
  const edge = (map: Texture) => new MeshStandardMaterial({ map, roughness: 1 });
  const top = new MeshStandardMaterial({ map: gutterTexture(spineAtLeft), roughness: 0.95 });
  /* BoxGeometry 의 면 순서는 +x, -x, +y, -y, +z, -z 다. */
  const block = new Mesh(new BoxGeometry(page.width, page.height, BLOCK_THICKNESS), [
    edge(across), edge(across), edge(along), edge(along), top, edge(along),
  ]);
  block.position.set((spineAtLeft ? 1 : -1) * (page.width / 2), 0, BLOCK_THICKNESS / 2);
  block.castShadow = true;
  block.receiveShadow = true;
  return block;
}

function board(page: Size, faces: { outside: Texture; inside: Texture }): Mesh {
  const cloth = new MeshStandardMaterial({ color: 0x5c2733, roughness: 0.8 });
  const width = page.width + OVERHANG;
  const height = page.height + OVERHANG * 2;
  const mesh = new Mesh(new BoxGeometry(width, height, BOARD_THICKNESS), [
    cloth, cloth, cloth, cloth,
    new MeshStandardMaterial({ map: faces.outside, roughness: 0.75 }),
    new MeshStandardMaterial({ map: faces.inside, roughness: 0.9 }),
  ]);
  mesh.position.x = width / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export type Book = {
  readonly group: Group;
  /** 표지를 연 정도. 0 이면 닫혀 오른쪽 위에 덮여 있다. */
  openCover: (progress: number) => void;
  /** 오른쪽 묶음 위, 넘길 낱장들이 쌓이기 시작하는 높이. */
  readonly restZ: number;
  dispose: () => void;
};

/**
 * 표지는 휘지 않는다. 책등을 축으로 통째로 돌고, 다 열리면 왼쪽 묶음 밑으로 들어간다.
 * 왼쪽 묶음은 표지가 열리는 만큼 나타난다. 닫힌 책 왼쪽에 종이가 떠 있으면 안 되니까.
 */
export function createBook(page: Size, cover: { outside: Texture; inside: Texture }, leaves: number): Book {
  const group = new Group();

  const desk = new Mesh(new PlaneGeometry(8, 8), new ShadowMaterial({ opacity: 0.16 }));
  desk.position.z = -BOARD_THICKNESS;
  desk.receiveShadow = true;

  const backBoard = board(page, { outside: cover.inside, inside: cover.inside });
  backBoard.position.z = -BOARD_THICKNESS / 2;

  const right = pageBlock(page, true);
  const left = pageBlock(page, false);

  const front = board(page, cover);
  const hinge = new Group();
  hinge.add(front);

  group.add(desk, backBoard, right, left, hinge);

  const closedZ = BLOCK_THICKNESS + (leaves + 1) * LEAF_GAP + BOARD_THICKNESS / 2;
  const openZ = -BOARD_THICKNESS / 2;

  const openCover: Book['openCover'] = (progress) => {
    hinge.rotation.y = -Math.PI * progress;
    hinge.position.z = closedZ + (openZ - closedZ) * progress + Math.sin(Math.PI * progress) * 0.12;
    left.visible = progress > 0.02;
    left.scale.z = Math.max(0.001, progress);
    left.position.z = (BLOCK_THICKNESS * left.scale.z) / 2;
  };
  openCover(0);

  return {
    group,
    openCover,
    restZ: BLOCK_THICKNESS,
    dispose: () => {
      group.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          (material as MeshStandardMaterial).map?.dispose();
          material.dispose();
        });
      });
    },
  };
}
