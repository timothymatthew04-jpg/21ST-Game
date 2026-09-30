// The night sky: deep blue gradient, a cratered moon (the only real light), drifting storm clouds
// silvered where they pass the moon, and the hand-shaped lightning that lights them from inside.
import * as THREE from 'three';
import { lightningHand } from './textures.js';

const vert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform float uTime;
  uniform float uFlash;
  uniform vec3 uMoonDir;
  uniform vec3 uFlashDir;
  uniform float uLoop;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) { s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
    return s;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, 0.0, 1.0);

    // gradient: a faint bruised glow on the horizon up to near-black blue
    vec3 zenith = vec3(0.003, 0.005, 0.02);
    vec3 mid = vec3(0.01, 0.019, 0.058);
    vec3 horizon = vec3(0.028, 0.045, 0.1);
    vec3 col = mix(horizon, mid, smoothstep(0.0, 0.18, h));
    col = mix(col, zenith, smoothstep(0.18, 0.75, h));

    // moon halo
    float md = dot(d, uMoonDir);
    float ang = acos(clamp(md, -1.0, 1.0));
    col += vec3(0.30, 0.38, 0.62) * exp(-ang * 5.0) * 0.16;
    col += vec3(0.55, 0.65, 0.9) * exp(-ang * 26.0) * 0.28;

    // stars, few and faint, only where the sky is clear
    vec3 sd = d * 420.0;
    vec3 cell = floor(sd);
    float star = hash(cell);
    float sb = step(0.9965, star) * smoothstep(0.08, 0.3, h);
    vec3 sp = fract(sd) - 0.5;
    col += vec3(0.7, 0.75, 1.0) * sb * smoothstep(0.35, 0.0, length(sp)) * 0.9;

    // the moon: limb-darkened disc with maria and craters
    float moonR = 0.036;
    vec3 up = abs(uMoonDir.y) > 0.99 ? vec3(1,0,0) : vec3(0,1,0);
    vec3 mx = normalize(cross(up, uMoonDir));
    vec3 my = cross(uMoonDir, mx);
    vec2 mp = vec2(dot(d, mx), dot(d, my)) / moonR;
    float mr = length(mp);
    if (mr < 1.0 && md > 0.0) {
      float z = sqrt(1.0 - mr * mr);
      vec3 sph = vec3(mp, z);
      float maria = smoothstep(0.45, 0.7, fbm(sph * 2.2 + 4.0));
      float crater = fbm(sph * 9.0);
      float lum = mix(1.0, 0.62, maria) * (0.85 + 0.3 * crater);
      lum *= mix(0.55, 1.0, pow(z, 0.45));
      vec3 moonCol = vec3(0.93, 0.95, 1.0) * lum * 1.9;
      col = mix(col, moonCol, smoothstep(1.0, 0.97, mr));
    }

    // clouds on a plane above the world, drifting on a loop so the video repeats seamlessly
    float ph = 6.2831853 * uTime / uLoop;
    vec2 cuv = d.xz / (d.y + 0.09);
    vec2 drift = vec2(uTime / uLoop * 1.6, 0.0);
    vec3 cp = vec3(cuv * 0.8 + drift, 0.0);
    vec3 wob = vec3(cos(ph), sin(ph), 0.0) * 0.12;
    float n = fbm(cp + wob);
    float n2 = fbm(cp * 2.1 + vec3(5.0, 1.0, 0.0) - wob * 1.5);
    float dens = n * 0.75 + n2 * 0.25;
    float cov = smoothstep(0.4, 0.66, dens);
    cov *= smoothstep(-0.02, 0.1, d.y);
    // thin cloud near the moon glows, thick cloud stays dark
    float moonGlow = exp(-ang * 4.2);
    float edge = smoothstep(0.44, 0.56, dens) * (1.0 - smoothstep(0.56, 0.74, dens));
    vec3 cloudCol = vec3(0.022, 0.03, 0.062) * (1.0 + 1.2 * (1.0 - cov));
    cloudCol += vec3(0.45, 0.52, 0.72) * moonGlow * (0.18 + 1.1 * edge);
    cloudCol += vec3(0.06, 0.075, 0.13) * exp(-ang * 1.2) * (0.3 + 0.9 * edge);

    // lightning lights the clouds from within
    float fd = acos(clamp(dot(d, uFlashDir), -1.0, 1.0));
    float fl = uFlash * exp(-fd * 5.0);
    cloudCol += vec3(0.5, 0.56, 1.0) * fl * (0.25 + 1.1 * dens);
    col += vec3(0.04, 0.05, 0.12) * uFlash * exp(-fd * 1.6);

    col = mix(col, cloudCol, cov * 0.94);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createSky({ moonDir, flashDir, loop }) {
  const uniforms = {
    uTime: { value: 0 },
    uFlash: { value: 0 },
    uMoonDir: { value: moonDir.clone().normalize() },
    uFlashDir: { value: flashDir.clone().normalize() },
    uLoop: { value: loop },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: vert, fragmentShader: frag,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 64, 32), mat);
  sky.renderOrder = -10;
  sky.frustumCulled = false;

  // The hand is a glowing card far out in the sky, facing the camera.
  const handMat = new THREE.MeshBasicMaterial({
    map: lightningHand(), transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false, opacity: 0, toneMapped: false,
  });
  const hand = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), handMat);
  hand.renderOrder = -5;
  return { sky, hand, uniforms, handMat };
}
