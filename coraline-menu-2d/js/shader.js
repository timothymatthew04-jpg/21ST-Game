// One full-screen pass that brings the painting to life. Every motion is periodic in the loop phase
// uU (0..1), so frame 0 follows the last frame without a seam.
export const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uBase;   // the cleaned painting
uniform sampler2D uMaskA;  // r sky, g window glow, b wind flex, a title
uniform sampler2D uMaskB;  // r window core, g window id, b hair, a title glow
uniform sampler2D uMaskC;  // r land, g house, b Coraline, a moon
uniform sampler2D uStrike; // the current lightning strike
uniform sampler2D uWeb;    // cobwebs
uniform sampler2D uApp;    // the Other Mother in the attic window
uniform sampler2D uNoise;  // 256x256 tileable value noise
uniform float uU, uFlash, uBolt, uScare, uZoom, uGlint, uPulse, uWinAvg, uBreath;
uniform vec2 uShake, uFlashPos;
uniform vec3 uMoon;
uniform float uWin[16];
out vec4 outColor;

const vec2 RES = vec2(1920.0, 1080.0);
const float TAU = 6.2831853;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
// noise from a texture: one fetch per octave keeps the shader quick to compile and to run
float noise(vec2 p) { return texture(uNoise, (p + 0.5) / 256.0).r; }
float fbm(vec2 p) {
  const mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  float s = noise(p) * 0.5;
  p = rot * p * 2.03 + vec2(1.7, 9.2); s += noise(p) * 0.25;
  p = rot * p * 2.03 + vec2(1.7, 9.2); s += noise(p) * 0.125;
  p = rot * p * 2.03 + vec2(1.7, 9.2); s += noise(p) * 0.0625;
  return s / 0.9375;
}
// noise drifting by 'span' over one loop, cross-faded so the end meets the start
float loopFbm(vec2 p, vec2 span) {
  float a = fbm(p + span * uU), b = fbm(p + span * (uU - 1.0));
  float m = mix(a, b, uU);
  return 0.5 + (m - 0.5) / sqrt(uU * uU + (1.0 - uU) * (1.0 - uU));
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, RES.y - gl_FragCoord.y);
  // the scene breathes in and out once a loop, and shakes on the big strike
  vec2 q = (px - RES * 0.5) / uZoom + RES * 0.5 + uShake;
  vec2 uv = q / RES;
  vec4 mA = texture(uMaskA, uv);
  vec4 mB = texture(uMaskB, uv);
  vec4 mC = texture(uMaskC, uv);

  // wind: a slow swell through the branches, quicker flutter in the weeds, hair stirring
  float ph = q.x * 0.0045 + q.y * 0.0021;
  vec2 wind = vec2(sin(TAU * 3.0 * uU + ph * 3.8) * 0.65 + sin(TAU * 7.0 * uU + ph * 8.2) * 0.35,
                   sin(TAU * 5.0 * uU + ph * 5.6) * 0.3);
  float gust = 0.75 + 0.25 * sin(TAU * 2.0 * uU + 1.3);
  vec2 disp = wind * mA.b * 5.5 * gust
            + vec2(sin(TAU * 13.0 * uU + q.x * 0.05 + q.y * 0.02), 0.0) * mA.b * 1.1
            + vec2(sin(TAU * 4.0 * uU + q.y * 0.07), sin(TAU * 3.0 * uU + q.x * 0.05) * 0.4) * mB.b * 2.0;
  vec2 suv = (q - disp) / RES;
  vec3 col = texture(uBase, suv).rgb;
  float sky = texture(uMaskA, suv).r;

  // the moon breathes, and beams of moonlight turn slowly through the sky
  float md = length(q - uMoon.xy);
  float moonHalo = exp(-md / 260.0);
  col += vec3(0.45, 0.55, 0.85) * moonHalo * (0.05 + 0.03 * sin(TAU * 2.0 * uU)) * sky;
  if (sky > 0.01) {
    float ang = atan(q.y - uMoon.y, q.x - uMoon.x);
    float rays = pow(noise(vec2(ang * 7.0 + 0.25 * sin(TAU * uU), 1.3)), 3.0);
    float fall = exp(-md / 700.0) * smoothstep(uMoon.z * 1.1, uMoon.z * 2.6, md);
    col += vec3(0.5, 0.6, 0.85) * rays * fall * sky * (0.16 + uFlash * 0.2);

    // clouds drifting across the sky and over the moon
    vec2 cp = q * vec2(0.0019, 0.0034);
    float n = loopFbm(cp, vec2(1.25, 0.12));
    float n2 = loopFbm(cp * 2.3 + vec2(3.1, 7.7), vec2(2.4, 0.2));
    float dens = n * 0.68 + n2 * 0.32;
    float wisp = smoothstep(0.5, 0.8, dens);
    float lit = exp(-md / 480.0);
    vec3 cloudCol = vec3(0.09, 0.12, 0.22) + vec3(0.42, 0.5, 0.68) * lit;
    cloudCol += vec3(0.35, 0.55, 0.9) * uFlash * exp(-length(q - uFlashPos) / 520.0) * 1.4;
    col = mix(col, cloudCol + col * 0.35, wisp * 0.5 * sky);
    col *= 1.0 - 0.2 * smoothstep(0.45, 0.72, n) * sky * (1.0 - lit * 0.6);
  }

  // the moon shows a button's four holes for a moment on the big strike
  if (uScare > 0.0 && md < uMoon.z * 1.05) {
    vec2 m = (q - uMoon.xy) / uMoon.z;
    float holes = 0.0;
    for (int i = 0; i < 4; i++) {
      vec2 o = vec2(i == 0 || i == 2 ? -0.27 : 0.27, i < 2 ? -0.27 : 0.27);
      holes = max(holes, smoothstep(0.16, 0.11, length(m - o)));
    }
    col = mix(col, col * 0.2, holes * 0.85 * uScare);
  }

  // the house lights: each window flickers on its own; the glow spills on walls and sky
  int wid = int(mB.g * 32.0 + 0.5);
  float flick = (wid > 0 && wid < 16) ? uWin[wid] : uWinAvg;
  col *= 1.0 + (flick - 1.0) * mB.r * 1.1;
  col += vec3(1.0, 0.6, 0.22) * mA.g * 0.2 * uWinAvg;

  // the title: a slow candle glow, a glint sweeping across, lit up by the lightning
  col += vec3(0.85, 0.78, 0.3) * mB.a * (0.05 + 0.06 * uPulse);
  float band = exp(-pow((q.x - uGlint + (q.y - 360.0) * 0.45) / 24.0, 2.0));
  col += vec3(1.0, 0.95, 0.72) * mA.a * band * 0.75;
  col += vec3(0.55, 0.7, 0.9) * mA.a * uFlash * 0.55;

  // lightning, only where there is open sky, so it passes behind tree, title and house
  vec3 bolt = texture(uStrike, uv).rgb;
  vec3 halo = textureLod(uStrike, uv, 3.0).rgb * 1.6 + textureLod(uStrike, uv, 5.0).rgb * 3.5 + textureLod(uStrike, uv, 7.0).rgb * 6.0;
  col += (bolt * 1.3 * smoothstep(0.2, 0.6, sky) + halo * vec3(0.45, 0.8, 1.0) * smoothstep(0.05, 0.7, sky)) * uBolt;
  col += vec3(0.3, 0.55, 1.0) * uFlash * exp(-length(q - uFlashPos) / 420.0) * sky * 0.7;

  // the flash lights everything a cold blue for an instant
  float near = exp(-length(q - uFlashPos) / 900.0);
  col = col * (1.0 + uFlash * (0.25 + 0.4 * near) * vec3(0.7, 0.9, 1.2)) + vec3(0.02, 0.045, 0.1) * uFlash * (0.3 + sky);

  // cobwebs strung between the branches, invisible until the lightning catches them
  float web = texture(uWeb, suv).a;
  col += vec3(0.75, 0.88, 1.0) * web * (0.02 + uFlash * 0.4);

  // rain, seen only in the flashes
  vec2 rp = vec2(q.x + q.y * 0.22, q.y);
  float cid = floor(rp.x / 6.0);
  float rnd = hash(vec2(cid, 3.1));
  if (rnd < 0.42) {
    float k = 18.0 + floor(rnd * 20.0);
    float yy = fract(rp.y / 320.0 - uU * k + rnd * 7.0);
    float streak = smoothstep(0.0, 0.02, yy) * smoothstep(0.14, 0.03, yy);
    float line = smoothstep(0.5, 0.15, abs(fract(rp.x / 6.0) - 0.5) * 6.0);
    col += vec3(0.7, 0.85, 1.0) * streak * line * (uFlash * 0.5 + 0.015);
  }

  // fog creeping along the hill, the stairs and the foot of the frame
  float fz = clamp(mC.r * 0.9 + smoothstep(560.0, 780.0, q.y) * 0.5, 0.0, 1.0) * (1.0 - mC.g * 0.7) * (1.0 - mC.b * 0.6);
  if (fz > 0.01) {
    vec2 fp = q * vec2(0.0021, 0.0058);
    float f = loopFbm(fp, vec2(-1.4, 0.0)) * 0.6 + loopFbm(fp * 1.9 + vec2(5.0, 2.0), vec2(-2.6, 0.1)) * 0.4;
    float fog = smoothstep(0.42, 0.86, f) * fz;
    col = mix(col, vec3(0.3, 0.36, 0.52) * (0.75 + 0.6 * uFlash + 0.15 * uWinAvg), fog * 0.45);
  }

  // the Other Mother in the attic window
  vec4 app = texture(uApp, uv);
  col = mix(col, app.rgb, app.a * uScare);

  // grade: cold shadows, a heavy vignette that breathes with the scene
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, col * vec3(0.86, 0.95, 1.14), (1.0 - smoothstep(0.0, 0.4, l)) * 0.5);
  vec2 vc = (px / RES - 0.5) * vec2(1.0, 0.92);
  float vig = smoothstep(0.85 + 0.03 * uBreath, 0.28, length(vc));
  col *= mix(0.22, 1.0, vig);
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
