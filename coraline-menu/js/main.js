// Coraline main menu background: builds the moonlit scene, runs the seamless loop and
// exposes window.__render(t) so the video renderer can capture any frame exactly.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import * as T from './textures.js';
import { createSky } from './sky.js';
import { PLATEAU, terrainHeight, createTerrain, createSteps, createBushes, createGrass, createForest, createFence } from './terrain.js';
import { createHouse } from './house.js';
import { createBigTree, createBareTree, createFallenLeaves, createFallingLeaves } from './tree.js';
import { createCoraline } from './coraline.js';
import { rng } from './util.js';

const params = new URLSearchParams(location.search);
const num = (k, d) => (params.has(k) ? parseFloat(params.get(k)) : d);
const off = new Set((params.get('off') || '').split(','));  // profiling switches
const vec = (k, d) => (params.has(k) ? new THREE.Vector3(...params.get(k).split(',').map(Number)) : d);

export const LOOP = 16;                  // seconds; every motion completes whole cycles in this time
// The storm's timeline: the hand reaches out of the cloud, later a bolt falls far behind the house,
// then the cloud there flickers once more without a bolt.
const STRIKES = [
  { t: 4.0, kind: 'hand', pulses: [[0, 1], [0.11, 0.55], [0.3, 0.95], [0.52, 0.4]] },
  { t: 10.6, kind: 'bolt', pulses: [[0, 1], [0.09, 0.5], [0.24, 0.8]] },
  { t: 13.3, kind: 'sheet', pulses: [[0, 0.35], [0.14, 0.2]] },
];
const W = 1920, H = 1080;

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = !off.has('shadow');
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = num('exposure', 1.15);
T.setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

await document.fonts.load('92px "Fell SC"');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a1328, num('fog', 0.0105));

const camera = new THREE.PerspectiveCamera(num('fov', 40), W / H, 0.1, 2500);
const CAM = vec('cam', new THREE.Vector3(0, terrainHeight(0, 10) + 1.25, 10));
// look 8 degrees right of straight ahead and tilt up so the hill sits in the lower right
const YAW = THREE.MathUtils.degToRad(num('yaw', 8)), PITCH = THREE.MathUtils.degToRad(num('pitch', 8.4));
const LOOK = CAM.clone().add(new THREE.Vector3(Math.sin(YAW), Math.tan(PITCH), -Math.cos(YAW)).multiplyScalar(50));
camera.position.copy(CAM);
camera.lookAt(LOOK);
camera.updateMatrixWorld();

// Sky directions are chosen by where they should sit on screen.
const dirAt = (nx, ny) => new THREE.Vector3(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
const moonDir = dirAt(num('moonx', 0.72), num('moony', 0.72));
const flashDir = dirAt(num('handx', -0.52), num('handy', 0.42));
const flash2Dir = dirAt(num('boltx', 0.86), num('bolty', 0.36));

// textures
const tx = {
  siding: T.siding(), fish: T.fishScale(), shingles: T.shingles(), bark: T.bark(),
  ground: T.ground(), stone: T.stone(),
};
const leafTex = T.leaf();

// sky, moon, lightning hand
const { sky, hand, uniforms: skyU, handMat, bolt, boltMat } = createSky({ moonDir, flashDir, flash2Dir, loop: LOOP });
scene.add(sky);
if (off.has('sky')) sky.material = new THREE.MeshBasicMaterial({ color: 0x050a1a, side: THREE.BackSide, depthWrite: false });
hand.position.copy(camera.position).addScaledVector(flashDir, 600);
const handSize = 2 * 600 * Math.tan(THREE.MathUtils.degToRad(num('handDeg', 27) / 2));
hand.scale.set(handSize, handSize, 1);
hand.lookAt(camera.position);
handMat.color.setScalar(2.4);
scene.add(hand);
bolt.position.copy(camera.position).addScaledVector(flash2Dir, 700);
const boltH = 2 * 700 * Math.tan(THREE.MathUtils.degToRad(num('boltDeg', 26) / 2));
bolt.scale.set(boltH, boltH, 1);
bolt.lookAt(camera.position);
boltMat.color.setScalar(2.2);
scene.add(bolt);

// land
scene.add(createTerrain(tx));
scene.add(createSteps(tx));
if (!off.has('bush')) scene.add(createBushes(leafTex));
if (!off.has('grass')) scene.add(createGrass());
scene.add(createForest([T.fir(1), T.fir(2), T.fir(3)], camera));
const fence = createFence(tx, T.sign());
scene.add(fence);

// the house on the hill
const { house, lights: houseLights } = createHouse(tx);
const HOUSE = new THREE.Vector3(PLATEAU.x, PLATEAU.height, PLATEAU.z);
house.position.copy(HOUSE);
house.rotation.y = num('houseYaw', 0.1);
house.scale.setScalar(0.85);
scene.add(house);
const houseLightBase = houseLights.map((l) => l.intensity);
if (off.has('lights')) houseLights.forEach((l) => l.removeFromParent());

for (const [x, z, s, seed] of [[16.5, -35.5, 1.6, 3], [33.5, -34, 1.9, 4], [35.5, -43, 2.2, 5], [9, -26, 1.3, 6], [42, -30, 1.7, 7]]) {
  const t = createBareTree(seed, s);
  t.position.set(x, terrainHeight(x, z), z);
  t.rotation.y = seed;
  scene.add(t);
}

// the old tree framing the left of the screen
const bigTree = createBigTree(tx, leafTex);
bigTree.position.copy(vec('tree', new THREE.Vector3(-2.8, 0, 4.3)));
bigTree.position.y = terrainHeight(bigTree.position.x, bigTree.position.z);
bigTree.rotation.y = num('treeYaw', 0.15);
scene.add(bigTree);
if (!off.has('fallen')) scene.add(createFallenLeaves(leafTex));
const falling = createFallingLeaves(leafTex, LOOP);
scene.add(falling.mesh);

// Coraline, looking up at the house
const { girl, headGroup } = createCoraline();
const GIRL = vec('girl', new THREE.Vector3(-1.13, 0, 2.9));
GIRL.y = terrainHeight(GIRL.x, GIRL.z);
girl.position.copy(GIRL);
const GIRL_SCALE = num('girlScale', 1.08);
const toHouse = HOUSE.clone().sub(GIRL);
girl.rotation.y = Math.atan2(-toHouse.x, -toHouse.z);
headGroup.rotation.x = 0.2;
scene.add(girl);
// the open sky behind the camera, a soft cool fill so her yellow coat reads in the dark
const girlFill = new THREE.SpotLight(0xd0d6ff, num('girlFill', 5), 10, 0.2, 0.7, 1.4);
girlFill.position.copy(GIRL).add(new THREE.Vector3(0.6, 2.4, 4.2));
girlFill.target.position.copy(GIRL).add(new THREE.Vector3(0, 0.7, 0));
scene.add(girlFill, girlFill.target);

// the black cat on the sign, eyes catching the porch light
const cat = new THREE.Group();
{
  const black = new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), black);
  body.scale.set(0.8, 1.15, 1);
  body.position.y = 0.16;
  cat.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12), black);
  head.position.set(0, 0.42, 0.02);
  cat.add(head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 4), black);
    ear.position.set(s * 0.055, 0.51, 0.01);
    ear.rotation.z = -s * 0.25;
    cat.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.4, 0.6) }));
    eye.position.set(s * 0.035, 0.43, 0.105);
    cat.add(eye);
  }
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 16, Math.PI * 1.1), black);
  tail.position.set(0.12, 0.08, -0.04);
  tail.rotation.set(0, 0.4, -1.2);
  cat.add(tail);
  cat.position.copy(fence.userData.signTop);
  cat.lookAt(camera.position.x, cat.position.y, camera.position.z);
  scene.add(cat);
}

// mist drifting along the foot of the hill and through the far trees
const mistTex = T.mist();
const mists = [];
{
  const r = rng(90);
  for (let i = 0; i < (off.has('mist') ? 0 : 9); i++) {
    const z = -10 - i * 5.5;
    const x = 12 + r.range(-8, 10);
    const tex = mistTex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(2, 1);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 4 + i * 0.6),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: r.range(0.05, 0.1) + i * 0.008, depthWrite: false, color: 0x9fb2da }),
    );
    m.position.set(x, terrainHeight(x, z) + r.range(0.4, 1.4), z);
    m.lookAt(camera.position.x, m.position.y, camera.position.z);
    m.userData = { tex, speed: r.pick([1, 1, 2]) * r.sign(), phase: r() };
    scene.add(m);
    mists.push(m);
  }
}

// lighting: the moon is the only real light; the sky's glow is moonlight scattered
const target = new THREE.Vector3(10, 3, -16);
const moon = new THREE.DirectionalLight(0xaebfff, num('moon', 2.4));
moon.position.copy(target).addScaledVector(moonDir, 150);
moon.target.position.copy(target);
moon.castShadow = true;
moon.shadow.mapSize.set(4096, 4096);
Object.assign(moon.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 60, far: 260 });
moon.shadow.bias = -0.0004;
moon.shadow.normalBias = 0.04;
scene.add(moon, moon.target);
const skyLight = new THREE.HemisphereLight(0x3b4f96, 0x0b0e14, num('hemi', 0.75));
scene.add(skyLight);
const flashLight = new THREE.DirectionalLight(0xc6d0ff, 0);
flashLight.position.copy(target).addScaledVector(flashDir, 150);
flashLight.target.position.copy(target);
const flash2Light = new THREE.DirectionalLight(0xc6d0ff, 0);
flash2Light.position.copy(target).addScaledVector(flash2Dir, 150);
flash2Light.target.position.copy(target);
scene.add(flashLight, flashLight.target, flash2Light, flash2Light.target);

// post-processing: bloom on the moon, windows and lightning; then grade, vignette and film grain
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: off.has('msaa') ? 0 : num('msaa', 2) }));
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), num('bloom', 0.55), 0.65, 1.0);
if (!off.has('bloom')) composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) }, uFlash: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; uniform float uFlash;
    varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 off = c * r2 * 0.006;
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, col * vec3(0.88, 0.96, 1.14), (1.0 - smoothstep(0.0, 0.45, l)) * 0.7);
      float vig = smoothstep(1.0, 0.3, length(c * vec2(1.0, 0.9)));
      col *= mix(0.28, 1.0, vig);
      col += (h(vUv * uRes + fract(uTime * 7.13) * 91.7) - 0.5) * 0.04;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
composer.addPass(grade);

// the lightning: each strike is a quick run of flickers
export function flashAt(t) {
  const out = { hand: 0, bolt: 0, sheet: 0 };
  for (const { t: s, kind, pulses } of STRIKES) {
    for (const [dt, amp] of pulses) {
      const x = (((t - s - dt) % LOOP) + LOOP) % LOOP;
      if (x < 1.2) out[kind] = Math.max(out[kind], amp * Math.exp(-x / 0.07));
    }
  }
  if (params.has('flash')) out.hand = num('flash', 0);
  if (params.has('flash2')) out.bolt = num('flash2', 0);
  return out;
}

function update(t) {
  const u = t / LOOP;
  const f = flashAt(t);
  const far = Math.max(f.bolt, f.sheet);
  skyU.uTime.value = t;
  skyU.uFlash.value = f.hand;
  skyU.uFlash2.value = far;
  handMat.opacity = Math.min(1, f.hand * 1.4);
  boltMat.opacity = Math.min(1, f.bolt * 1.4);
  flashLight.intensity = f.hand * 2.6;
  flash2Light.intensity = far * 1.6;
  skyLight.intensity = num('hemi', 0.75) * (1 + f.hand * 0.8 + far * 0.4);
  // the camera breathes: a slow drift that shows the depth between tree, girl and house
  camera.position.set(
    CAM.x + Math.sin(u * Math.PI * 2) * 0.2,
    CAM.y + Math.sin(u * Math.PI * 4) * 0.04,
    CAM.z + Math.cos(u * Math.PI * 2) * 0.15,
  );
  camera.lookAt(LOOK);
  sky.position.copy(camera.position);
  // Coraline breathes, and her head turns a little towards the lit windows and back
  girl.scale.set(GIRL_SCALE, GIRL_SCALE * (1 + 0.006 * Math.sin(u * Math.PI * 2 * 5)), GIRL_SCALE);
  headGroup.rotation.y = 0.12 * Math.sin(u * Math.PI * 2) - 0.04;
  headGroup.rotation.x = 0.2 + 0.03 * Math.sin(u * Math.PI * 2 * 2 + 1);
  // warm lights breathe a little, like old bulbs
  houseLights.forEach((l, i) => { l.intensity = houseLightBase[i] * (0.92 + 0.08 * Math.sin(u * Math.PI * 2 * (3 + i) + i)); });
  falling.update(t);
  for (const m of mists) m.userData.tex.offset.x = m.userData.phase + u * m.userData.speed;
  grade.uniforms.uTime.value = t;
  const root = document.documentElement.style;
  root.setProperty('--flash', Math.max(f.hand, far * 0.5).toFixed(3));
  root.setProperty('--u', u.toFixed(4));
  root.setProperty('--pulse', (0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 4)).toFixed(3));
}

window.__render = (t) => {
  update(t);
  composer.render();
  return true;
};
window.__loop = LOOP;

if (params.has('t') || params.has('still')) {
  window.__render(num('t', 0));
} else {
  const start = performance.now();
  const tick = () => {
    window.__render(((performance.now() - start) / 1000) % LOOP);
    requestAnimationFrame(tick);
  };
  tick();
}
window.__ready = true;
