import {
  DirectionalLight,
  HemisphereLight,
  PCFShadowMap,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

/* 화면 배율이 3 인 기기에서 3 으로 그리면 픽셀이 2.25 배가 되는데, 종이 질감에서는
   2 와 3 의 차이가 눈에 안 띈다. 프레임을 지키는 쪽을 고른다. */
const MAX_PIXEL_RATIO = 2;
const FOV = 30;

export type Stage = {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  /** 화면 좌표를 책상 면(z = 0) 위의 점으로 바꾼다. */
  toTable: (clientX: number, clientY: number) => Vector3 | null;
  pick: (clientX: number, clientY: number, targets: Parameters<Raycaster['intersectObjects']>[0]) => ReturnType<Raycaster['intersectObjects']>;
  /** 화면 가운데에 둘 x 와 꽉 채울 크기. 닫힌 책과 펼친 책은 가운데가 다르다. */
  frame: (view: { x: number; width: number; height: number }) => void;
  /** frame 이 false 를 돌려주면 그 프레임은 그리지 않는다. 멈춘 책을 매번 다시 그릴 이유가 없다. */
  run: (frame: (seconds: number) => boolean) => void;
  dispose: () => void;
};

/**
 * 장면을 view 크기가 화면에 꼭 맞도록 비춘다. 카메라를 살짝 아래에서 기울여야
 * 종이가 들릴 때 높이가 보인다. 정면에서 보면 휘는 것이 그냥 줄어드는 것처럼 보인다.
 */
export function createStage(
  canvas: HTMLCanvasElement,
  view: { width: number; height: number },
  { tilt = 0.18 }: { tilt?: number } = {}
): Stage {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new Scene();
  scene.add(new HemisphereLight(0xffffff, 0xfff1e6, 3));
  const sun = new DirectionalLight(0xffffff, 0.7);
  sun.position.set(-1.2, 1.8, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -1.6;
  sun.shadow.camera.right = 1.6;
  sun.shadow.camera.top = 1.6;
  sun.shadow.camera.bottom = -1.6;
  /* 낱장 사이 간격이 0.0025 라 기본 바이어스로는 종이가 자기 그림자로 얼룩진다. */
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.015;
  scene.add(sun);

  const camera = new PerspectiveCamera(FOV, 1, 0.01, 100);
  const raycaster = new Raycaster();
  const table = new Plane(new Vector3(0, 0, 1), 0);

  let framed = { x: 0, ...view };
  let dirty = true;

  const aim = () => {
    const half = Math.tan((FOV * Math.PI) / 360);
    const distance = Math.max(framed.height / 2 / half, framed.width / 2 / (half * camera.aspect));
    camera.position.set(framed.x, -distance * tilt, distance);
    camera.lookAt(framed.x, 0, 0);
  };

  const fit = () => {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    aim();
    dirty = true;
  };
  fit();
  const observer = new ResizeObserver(fit);
  observer.observe(canvas);

  const pointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(
      new Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1),
      camera
    );
  };

  let handle = 0;
  return {
    scene,
    camera,
    toTable: (clientX, clientY) => {
      pointer(clientX, clientY);
      return raycaster.ray.intersectPlane(table, new Vector3());
    },
    pick: (clientX, clientY, targets) => {
      pointer(clientX, clientY);
      return raycaster.intersectObjects(targets, false);
    },
    frame: (next) => {
      framed = next;
      aim();
    },
    run: (frame) => {
      let last = performance.now();
      const tick = (now: number) => {
        const moved = frame(Math.min(0.05, (now - last) / 1000));
        last = now;
        if (moved || dirty) {
          renderer.shadowMap.needsUpdate = true;
          renderer.render(scene, camera);
          dirty = false;
        }
        handle = requestAnimationFrame(tick);
      };
      handle = requestAnimationFrame(tick);
    },
    dispose: () => {
      cancelAnimationFrame(handle);
      observer.disconnect();
      renderer.dispose();
    },
  };
}

