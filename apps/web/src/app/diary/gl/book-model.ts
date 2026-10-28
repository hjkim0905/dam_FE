import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  ShadowMaterial,
  type Texture,
} from 'three';
import type { Size } from '@/lib/curl';
import { pixelCanvas } from './pixel';

/* 넘기는 몇 장 아래에 깔린 나머지 속지. 실제로 넘기지는 않지만 이 두께가 있어야 책이다. */
export const BLOCK_THICKNESS = 0.035;
export const LEAF_GAP = 0.0025;
const BOARD_THICKNESS = 0.018;
/* 하드커버는 속지보다 사방으로 조금 크다. 이 테두리가 보여야 표지가 판으로 읽힌다. */
const OVERHANG = 0.025;
const PAPER = '#fffaf0';
const BOARD_EDGE = 0xe49aab;

/** 종이 묶음의 옆면. 한 칸짜리 줄이 겹쳐 보여야 종이가 여러 장인 것을 안다. */
function edgeTexture(across: boolean): Texture {
  const texture = pixelCanvas(16, 16, (paint) => {
    paint.fillStyle = '#f6eee2';
    paint.fillRect(0, 0, 16, 16);
    paint.fillStyle = '#e3d6c4';
    for (let i = 0; i < 16; i += 2) {
      if (across) paint.fillRect(i, 0, 1, 16);
      else paint.fillRect(0, i, 16, 1);
    }
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

/** 묶음 윗면. 책등 쪽 몇 칸이 계단처럼 어두워진다. spineAtLeft 는 왼쪽 끝이 책등인지. */
function gutterTexture(spineAtLeft: boolean): Texture {
  return pixelCanvas(88, 4, (paint) => {
    paint.fillStyle = PAPER;
    paint.fillRect(0, 0, 88, 4);
    ['#d9cbb8', '#e6dccd', '#f1eadf'].forEach((shade, i) => {
      paint.fillStyle = shade;
      paint.fillRect(spineAtLeft ? i * 2 : 86 - i * 2, 0, 2, 4);
    });
  });
}

function pageBlock(page: Size, spineAtLeft: boolean): Mesh {
  const edge = (across: boolean) => new MeshStandardMaterial({ map: edgeTexture(across), roughness: 1 });
  const top = new MeshStandardMaterial({ map: gutterTexture(spineAtLeft), roughness: 1 });
  /* BoxGeometry 의 면 순서는 +x, -x, +y, -y, +z, -z 다. */
  const block = new Mesh(new BoxGeometry(page.width, page.height, BLOCK_THICKNESS), [
    edge(true), edge(true), edge(false), edge(false), top, edge(false),
  ]);
  block.position.set((spineAtLeft ? 1 : -1) * (page.width / 2), 0, BLOCK_THICKNESS / 2);
  block.castShadow = true;
  block.receiveShadow = true;
  return block;
}

function board(page: Size, faces: { outside: Texture; inside: Texture }): Mesh {
  const cloth = new MeshStandardMaterial({ color: BOARD_EDGE, roughness: 1 });
  const width = page.width + OVERHANG;
  const height = page.height + OVERHANG * 2;
  const mesh = new Mesh(new BoxGeometry(width, height, BOARD_THICKNESS), [
    cloth, cloth, cloth, cloth,
    new MeshStandardMaterial({ map: faces.outside, roughness: 1 }),
    new MeshStandardMaterial({ map: faces.inside, roughness: 1 }),
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
  /** 표지 색을 바꾸면 그림만 갈아 끼운다. 책을 다시 만들면 펼쳐 둔 자리를 잃는다. */
  setCover: (outside: Texture) => void;
  /** 오른쪽 묶음 위, 넘길 낱장들이 쌓이기 시작하는 높이. */
  readonly restZ: number;
  /** 열린 표지 안쪽 면의 높이. 넘긴 낱장이 여기서부터 쌓인다. */
  readonly leftZ: number;
  dispose: () => void;
};

/**
 * 표지는 휘지 않는다. 책등을 축으로 통째로 돌아 왼쪽에 눕는다. 첫 장을 펼친 책의
 * 왼쪽은 표지 안쪽뿐이라 왼쪽에는 속지 묶음을 두지 않는다. 넘긴 낱장이 그 위에 쌓인다.
 */
export function createBook(page: Size, cover: { outside: Texture; inside: Texture }, leaves: number): Book {
  const group = new Group();

  const desk = new Mesh(new PlaneGeometry(8, 8), new ShadowMaterial({ opacity: 0.1 }));
  desk.position.z = -BOARD_THICKNESS;
  desk.receiveShadow = true;

  const backBoard = board(page, { outside: cover.inside, inside: cover.inside });
  backBoard.position.z = -BOARD_THICKNESS / 2;

  const right = pageBlock(page, true);

  const front = board(page, cover);
  const outsideFace = (front.material as MeshStandardMaterial[])[4];
  const hinge = new Group();
  hinge.add(front);

  group.add(desk, backBoard, right, hinge);

  const closedZ = BLOCK_THICKNESS + (leaves + 1) * LEAF_GAP + BOARD_THICKNESS / 2;
  const openZ = -BOARD_THICKNESS / 2;

  const openCover: Book['openCover'] = (progress) => {
    hinge.rotation.y = -Math.PI * progress;
    hinge.position.z = closedZ + (openZ - closedZ) * progress + Math.sin(Math.PI * progress) * 0.12;
  };
  openCover(0);

  return {
    group,
    openCover,
    setCover: (outside) => {
      outsideFace.map = outside;
      outsideFace.needsUpdate = true;
    },
    restZ: BLOCK_THICKNESS,
    leftZ: 0,
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
