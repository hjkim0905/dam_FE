import {
  CanvasTexture,
  DoubleSide,
  LinearMipmapLinearFilter,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector4,
  WebGLRenderer,
} from 'three';
import type { DiaryItem } from '@/lib/api/diary';
import { bend, curlAt } from '@/lib/curl';
import { spring, type Spring } from '@/lib/motion';
import { cutoutReady, drawItem, itemBounds, PAGE_PX, type Images } from '../page-art';
import { stickerReady } from '../stickers';

const FOV = 30;
const MAX_PIXEL_RATIO = 2;
const SEGMENTS = 24;
/* 다이컷 흰 테두리 두께. 화면 픽셀 기준이다. */
const BORDER = 5;
const CURL_RADIUS = 18;
/* 집었을 때 들리는 높이와 모서리가 감기는 각도. 크면 반으로 접힌 덮개처럼 보인다. */
const HELD = { lift: 14, peel: 0.9 };
const FRESH = { lift: 70, peel: 2.2 };

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* 빛은 들린 모서리를 읽히게 할 만큼만 준다. 평평한 스티커는 그림 그대로다. */
/* 종이 밖으로 나간 부분은 그리지 않는다. 진짜 다이어리처럼 페이지 끝에서 잘린다. */
const clipToPage = /* glsl */ `
  uniform vec4 page;
  void clipToPage() {
    if (gl_FragCoord.x < page.x || gl_FragCoord.x > page.z || gl_FragCoord.y < page.y || gl_FragCoord.y > page.w) discard;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;
  varying vec3 vNormal;
  ${clipToPage}

  void main() {
    clipToPage();
    vec4 tex = texture2D(map, vUv);
    if (tex.a < 0.02) discard;
    vec3 n = normalize(gl_FrontFacing ? vNormal : -vNormal);
    float shade = 0.82 + 0.18 * max(dot(n, normalize(vec3(-0.3, 0.4, 1.0))), 0.0) / 0.93;
    vec3 color = gl_FrontFacing ? tex.rgb : vec3(0.95, 0.94, 0.92);
    gl_FragColor = vec4(color * min(shade, 1.0), tex.a);
  }
`;

/* 그림자는 들린 높이만큼 오른쪽 아래로 밀리고 흐려진다. 흐림은 밉맵을 끌어다 쓴다. */
const shadowVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vHeight;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vHeight = world.z;
    world.xy += vec2(0.18, -0.28) * world.z + vec2(0.8, -1.4);
    world.z = 0.0;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const shadowFragment = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;
  varying float vHeight;
  ${clipToPage}
  void main() {
    clipToPage();
    float alpha = texture2D(map, vUv, 0.5 + min(vHeight, 60.0) * 0.03).a;
    gl_FragColor = vec4(0.22, 0.16, 0.12, alpha * (0.2 - min(vHeight, 60.0) * 0.0015));
  }
`;

type Sprite = {
  item: DiaryItem;
  key: string;
  mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  shadow: Mesh<PlaneGeometry, ShaderMaterial>;
  flat: Float32Array;
  half: { x: number; y: number };
  /** 들리는 쪽. 스티커 가운데에서 잡은 점을 향하는 단위 벡터, 스티커 자기 좌표다. */
  toward: { x: number; y: number };
  lift: Spring;
  peel: Spring;
  held: boolean;
};

export type Layout = { left: number; top: number; view: number };

export type StickerStage = {
  sync: (items: readonly DiaryItem[], layout: Layout, images: Images, font: string, fresh: number | null) => void;
  /** 잡은 스티커와, 페이지 비율 좌표로 잡은 점. null 이면 내려놓는다. */
  hold: (id: number | null, at?: { x: number; y: number }) => void;
  dispose: () => void;
};

/** 오린 모양 바깥으로 흰 테두리를 두르고, 그 바깥에 아주 옅은 선을 두른다. */
function dieCut(art: HTMLCanvasElement, border: number): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = art.width + border * 2;
  out.height = art.height + border * 2;
  const silhouette = document.createElement('canvas');
  silhouette.width = art.width;
  silhouette.height = art.height;
  const shape = silhouette.getContext('2d');
  const paint = out.getContext('2d');
  if (!shape || !paint) return art;
  const ring = (radius: number, color: string) => {
    shape.globalCompositeOperation = 'source-over';
    shape.clearRect(0, 0, art.width, art.height);
    shape.drawImage(art, 0, 0);
    shape.globalCompositeOperation = 'source-in';
    shape.fillStyle = color;
    shape.fillRect(0, 0, art.width, art.height);
    for (let i = 0; i < 24; i += 1) {
      const angle = (i / 24) * Math.PI * 2;
      paint.drawImage(silhouette, border + Math.cos(angle) * radius, border + Math.sin(angle) * radius);
    }
  };
  ring(border, 'rgba(90, 77, 68, 0.18)');
  ring(border - 1, '#ffffff');
  paint.drawImage(art, border, border);
  return out;
}

function artOf(item: DiaryItem, images: Images, font: string, view: number, ratio: number) {
  const scale = view * ratio;
  const { width, height } = itemBounds(item, font);
  const art = document.createElement('canvas');
  art.width = Math.ceil(width * scale);
  art.height = Math.ceil(height * scale);
  const paint = art.getContext('2d');
  if (paint) {
    paint.imageSmoothingEnabled = false;
    paint.setTransform(scale, 0, 0, scale, art.width / 2, art.height / 2);
    drawItem(paint, item, images, font);
  }
  const border = Math.round(BORDER * ratio);
  return { canvas: dieCut(art, border), border };
}

const keyOf = (item: DiaryItem, images: Images, view: number) => [
  item.kind, item.sticker, item.text, item.frame, item.color, item.date,
  Math.round(item.scale * 20), Math.round(view * 100),
  item.entryId !== null && images.has(item.entryId),
  item.sticker !== null && stickerReady(item.sticker),
  cutoutReady(item),
].join('|');

export function createStickerStage(canvas: HTMLCanvasElement): StickerStage {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: false });
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  renderer.setPixelRatio(ratio);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 1, 10000);
  const sprites = new Map<number, Sprite>();
  let layout: Layout = { left: 0, top: 0, view: 1 };
  /* 멈춘 스티커를 매 프레임 다시 그릴 이유가 없다. 움직이거나 바뀐 프레임만 그린다. */
  let dirty = true;
  /* 모든 재질이 같은 값을 본다. 화면 픽셀(아래가 0)로 잰 종이의 왼쪽, 아래, 오른쪽, 위. */
  const page = { value: new Vector4(0, 0, 1e5, 1e5) };
  const clipPage = () => {
    const { left, top, view } = layout;
    const height = canvas.clientHeight;
    page.value.set(
      left * ratio,
      (height - top - PAGE_PX.height * view) * ratio,
      (left + PAGE_PX.width * view) * ratio,
      (height - top) * ratio,
    );
  };

  const fit = () => {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (width === 0 || height === 0) return;
    dirty = true;
    clipPage();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(0, 0, height / 2 / Math.tan((FOV * Math.PI) / 360));
    camera.updateProjectionMatrix();
  };
  fit();
  const observer = new ResizeObserver(fit);
  observer.observe(canvas);

  const build = (item: DiaryItem, images: Images, font: string, view: number) => {
    const { canvas: art, border } = artOf(item, images, font, view, ratio);
    const texture = new CanvasTexture(art);
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    const width = art.width / ratio;
    const height = art.height / ratio;
    const geometry = new PlaneGeometry(width, height, SEGMENTS, SEGMENTS);
    const material = new ShaderMaterial({
      uniforms: { map: { value: texture }, page },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
    });
    const shadowMaterial = new ShaderMaterial({
      uniforms: { map: { value: texture }, page },
      vertexShader: shadowVertex,
      fragmentShader: shadowFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    return {
      mesh: new Mesh(geometry, material),
      shadow: new Mesh(geometry, shadowMaterial),
      flat: Float32Array.from(geometry.attributes.position.array),
      half: { x: width / 2 - border / ratio, y: height / 2 - border / ratio },
    };
  };

  const release = (sprite: Sprite) => {
    scene.remove(sprite.mesh, sprite.shadow);
    sprite.mesh.geometry.dispose();
    sprite.mesh.material.uniforms.map.value.dispose();
    sprite.mesh.material.dispose();
    sprite.shadow.material.dispose();
  };

  const place = (sprite: Sprite) => {
    const { item, mesh } = sprite;
    const { left, top, view } = layout;
    /* 들린 만큼 카메라에 가까워져 화면 가운데에서 멀어진다. 그만큼 당겨 손가락 밑에 둔다. */
    const toward = 1 - sprite.lift.value / camera.position.z;
    const x = (left + item.x * PAGE_PX.width * view - canvas.clientWidth / 2) * toward;
    const y = (canvas.clientHeight / 2 - (top + item.y * PAGE_PX.height * view)) * toward;
    mesh.position.set(x, y, sprite.lift.value);
    mesh.rotation.z = -item.rotation;
    sprite.shadow.position.copy(mesh.position);
    sprite.shadow.rotation.z = mesh.rotation.z;
  };

  /* 잡은 쪽 가장자리를 원통에 감는다. 스티커는 평평할 때가 대부분이라 그때는 건너뛴다. */
  const curl = (sprite: Sprite) => {
    const { geometry } = sprite.mesh;
    const position = geometry.attributes.position;
    const sweep = Math.max(0, sprite.peel.value);
    if (sweep < 0.001) {
      if (geometry.userData.curled) {
        (position.array as Float32Array).set(sprite.flat);
        geometry.userData.curled = false;
        position.needsUpdate = true;
        geometry.computeVertexNormals();
      }
      return;
    }
    const { toward, half } = sprite;
    const reach = Math.abs(toward.x) * half.x + Math.abs(toward.y) * half.y;
    const fold = curlAt({ x: toward.x * reach, y: toward.y * reach }, toward, CURL_RADIUS, Math.min(sweep, Math.PI * 0.9));
    const out = position.array as Float32Array;
    for (let i = 0; i < out.length; i += 3) {
      const [x, y, z] = bend(sprite.flat[i], sprite.flat[i + 1], fold);
      out[i] = x;
      out[i + 1] = y;
      out[i + 2] = z;
    }
    geometry.userData.curled = true;
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  const settled = (state: Spring, target: number) => Math.abs(state.value - target) < 0.01 && Math.abs(state.velocity) < 0.01;

  let previous = performance.now();
  let handle = 0;
  const tick = (now: number) => {
    const seconds = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    sprites.forEach((sprite) => {
      const lift = sprite.held ? HELD.lift : 0;
      const peel = sprite.held ? HELD.peel : 0;
      if (settled(sprite.lift, lift) && settled(sprite.peel, peel) && !dirty) return;
      sprite.lift = spring(sprite.lift, lift, seconds);
      sprite.peel = spring(sprite.peel, peel, seconds);
      curl(sprite);
      dirty = true;
    });
    if (dirty) {
      sprites.forEach(place);
      renderer.render(scene, camera);
      dirty = false;
    }
    handle = requestAnimationFrame(tick);
  };
  handle = requestAnimationFrame(tick);

  const order = () => {
    [...sprites.values()]
      .sort((a, b) => Number(a.held) - Number(b.held) || a.item.layer - b.item.layer || a.item.id - b.item.id)
      .forEach((sprite, index) => {
        sprite.shadow.renderOrder = index * 2;
        sprite.mesh.renderOrder = index * 2 + 1;
      });
  };

  return {
    sync: (items, next, images, font, fresh) => {
      layout = next;
      clipPage();
      const alive = new Set(items.map((item) => item.id));
      sprites.forEach((sprite, id) => {
        if (!alive.has(id)) {
          release(sprite);
          sprites.delete(id);
        }
      });
      items.forEach((item) => {
        const key = keyOf(item, images, next.view);
        const known = sprites.get(item.id);
        if (known && known.key === key) {
          known.item = item;
          return;
        }
        if (known) release(known);
        const built = build(item, images, font, next.view);
        const isFresh = !known && fresh === item.id;
        const sprite: Sprite = {
          item,
          key,
          ...built,
          toward: known?.toward ?? { x: Math.SQRT1_2, y: Math.SQRT1_2 },
          lift: known?.lift ?? { value: isFresh ? FRESH.lift : 0, velocity: 0 },
          peel: known?.peel ?? { value: isFresh ? FRESH.peel : 0, velocity: 0 },
          held: known?.held ?? false,
        };
        scene.add(sprite.shadow, sprite.mesh);
        sprites.set(item.id, sprite);
      });
      order();
      dirty = true;
    },
    hold: (id, at) => {
      sprites.forEach((sprite) => {
        const held = sprite.item.id === id;
        if (held && at && !sprite.held) {
          const dx = (at.x - sprite.item.x) * PAGE_PX.width;
          const dy = -(at.y - sprite.item.y) * PAGE_PX.height;
          const cos = Math.cos(sprite.item.rotation);
          const sin = Math.sin(sprite.item.rotation);
          const lx = dx * cos - dy * sin;
          const ly = dx * sin + dy * cos;
          const length = Math.hypot(lx, ly);
          if (length > 1e-6) sprite.toward = { x: lx / length, y: ly / length };
        }
        sprite.held = held;
      });
      order();
      dirty = true;
    },
    dispose: () => {
      cancelAnimationFrame(handle);
      observer.disconnect();
      sprites.forEach(release);
      renderer.dispose();
    },
  };
}
