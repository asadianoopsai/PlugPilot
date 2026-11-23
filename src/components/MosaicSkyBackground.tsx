import React, { useEffect, useRef, useState } from 'react';
import { ThemeMode } from '../utils/theme';

const VERT_SHADER = 'attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}';

const FRAG_SHADER = `precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uMix;
uniform vec2 uPtr;
uniform float uPtrOn;
uniform vec3 uAccent;
uniform float uLight;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }
vec3 spectrum(float x){ return 0.5 + 0.5 * cos(6.28318 * (x + vec3(0.0, 0.33, 0.67))); }

/* Top: a mosaic of soft light, quantized into rounded tiles. */
vec3 mosaic(vec2 frag){
  float cell = max(uRes.y / 30.0, 9.0);
  vec2 id = floor(frag / cell);
  vec2 f = fract(frag / cell);
  vec2 p = (id + 0.5) * cell / uRes.y;
  float ax = uRes.x / uRes.y;
  float t = uTime * 0.07;
  vec2 l1 = vec2(ax * 0.5 + 0.38 * sin(t * 2.1), 0.56 + 0.14 * cos(t * 1.7));
  vec2 l2 = vec2(ax * 0.5 - 0.55 * cos(t * 1.3), 0.2 + 0.1 * sin(t * 2.3));
  vec2 l3 = vec2(ax * 0.5 + 0.62 * cos(t * 0.9 + 2.0), 0.86 + 0.08 * sin(t * 1.1));
  float L = 0.62 * exp(-2.6 * dot(p - l1, p - l1)) + 0.42 * exp(-3.8 * dot(p - l2, p - l2)) + 0.3 * exp(-5.0 * dot(p - l3, p - l3));
  L += uPtrOn * 0.5 * exp(-14.0 * dot(p - uPtr, p - uPtr));
  float n = fbm(p * 3.0 + vec2(t * 1.6, -t * 1.1));
  L *= 0.45 + n;
  float h = hash(id);
  L *= 0.8 + 0.28 * sin(uTime * (0.5 + h * 1.4) + h * 40.0);
  L = clamp(L, 0.0, 1.0);
  L = floor(L * 8.0 + h * 0.6) / 8.0;
  vec2 q = abs(f - 0.5);
  float tile = smoothstep(0.47, 0.41, max(q.x, q.y));

  vec3 cool = vec3(0.60, 0.70, 0.86);
  vec3 warm = vec3(0.96, 0.88, 0.78);
  vec3 darkCol = mix(cool, warm, smoothstep(0.25, 0.75, n)) * L * 0.56;
  darkCol = mix(darkCol, uAccent * L * 0.75, 0.22 * L);
  darkCol *= tile * (0.82 + 0.36 * f.y);
  darkCol += vec3(0.010, 0.010, 0.014);

  vec3 lightBase = vec3(0.955, 0.972, 0.992);
  vec3 lightTint = mix(vec3(0.84, 0.91, 0.98), vec3(0.93, 0.96, 0.99), smoothstep(0.25, 0.75, n));
  vec3 lightCol = mix(lightBase, lightTint, L * 0.85 * tile);
  lightCol = mix(lightCol, vec3(0.91, 0.95, 0.99), (1.0 - tile) * 0.5);
  return mix(darkCol, lightCol, uLight);
}

/* Mid: diagonal prismatic facets on deep slate blue or bright architectural daylight. */
vec3 prism(vec2 frag){
  vec2 p = frag / uRes.y;
  float t = uTime * 0.05;
  vec3 col = mix(vec3(0.06, 0.08, 0.13), vec3(0.17, 0.22, 0.31), smoothstep(-0.2, 1.3, p.y + p.x * 0.15));
  float d = dot(p, normalize(vec2(1.0, -0.58)));
  float warp = fbm(vec2(d * 1.2 - t, p.y * 0.8 + t)) * 0.7;
  float bands = d * 2.6 + warp - t * 1.6;
  float s = fract(bands);
  float facet = smoothstep(0.0, 0.03, s) * (1.0 - smoothstep(0.03, 0.6, s));
  vec3 spec = spectrum(bands * 0.31 + p.y * 0.25 + t * 0.5);
  float beam = exp(-pow((d - (0.55 + 0.35 * sin(t * 2.0))) * 2.4, 2.0));
  col += spec * facet * (0.09 + 0.3 * beam);
  col += spec * beam * 0.06;
  float glint = pow(max(0.0, 1.0 - abs(s - 0.02) * 30.0), 3.0) * beam;
  col += vec3(0.9, 0.95, 1.0) * glint * 0.22;
  col += uAccent * 0.03;

  vec3 lightCol = mix(vec3(0.93, 0.96, 0.995), vec3(0.88, 0.935, 0.99), smoothstep(-0.2, 1.3, p.y + p.x * 0.15));
  lightCol -= (1.0 - spec * 0.25) * facet * (0.02 + 0.04 * beam);
  lightCol += vec3(0.02, 0.04, 0.06) * glint;
  return mix(col, lightCol, uLight);
}

/* Lower: flowing spectral silk waves. */
vec3 waves(vec2 frag){
  vec2 p = frag / uRes.y;
  float t = uTime * 0.11;
  vec3 col = mix(vec3(0.07, 0.04, 0.08), vec3(0.20, 0.11, 0.19), smoothstep(0.0, 1.1, p.y));
  vec3 lightCol = mix(vec3(0.95, 0.97, 0.995), vec3(0.90, 0.945, 0.99), smoothstep(0.0, 1.1, p.y));
  for (int i = 0; i < 5; i++){
    float fi = float(i);
    float y = 0.52 + (fi - 2.0) * 0.055
      + 0.16 * sin(p.x * (1.5 + fi * 0.3) + t * (1.0 + fi * 0.22) + fi * 1.7)
      + 0.05 * sin(p.x * 3.7 - t * 1.4 + fi * 2.3);
    float dist = abs(p.y - y);
    vec3 c = spectrum(fi * 0.16 + p.x * 0.12 - t * 0.25);
    col += c * (exp(-dist * 42.0) * 0.28 + exp(-dist * 7.0) * 0.05);
    lightCol = mix(lightCol, mix(vec3(0.82, 0.92, 0.99), c, 0.35), exp(-dist * 24.0) * 0.25);
  }
  col *= 0.88 + 0.24 * fbm(p * 2.2 + t);
  return mix(col, lightCol, uLight);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  float m = clamp(uMix, 0.0, 2.0);
  vec3 a; vec3 b = vec3(0.0); float k;
  if (m < 1.0) { k = m; a = mosaic(frag); if (k > 0.001) b = prism(frag); }
  else { k = m - 1.0; a = prism(frag); if (k > 0.001) b = waves(frag); }
  float cell = max(uRes.y / 30.0, 9.0);
  float thr = hash(floor(frag / cell) + 7.0) * 0.65 + (frag.y / uRes.y) * 0.35;
  float w = smoothstep(thr - 0.06, thr + 0.06, k * 1.12 - 0.06);
  vec3 col = mix(a, b, w);
  vec2 uv = frag / uRes;
  float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.0, 1.15)));
  col *= mix(0.55 + 0.45 * vig, 0.94 + 0.06 * vig, uLight);
  col += (hash(frag + fract(uTime)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

interface MosaicSkyBackgroundProps {
  theme?: ThemeMode;
}

export const MosaicSkyBackground: React.FC<MosaicSkyBackgroundProps> = ({ theme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const themeRef = useRef<ThemeMode>(theme);
  const dirtyRef = useRef(true);
  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    themeRef.current = theme;
    dirtyRef.current = true;
  }, [theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = mq.matches;

    const canvas = document.createElement('canvas');
    canvas.className =
      'absolute inset-0 h-full w-full transition-opacity duration-700 ' +
      (webglReady ? 'opacity-100' : 'opacity-0');
    container.prepend(canvas);

    const gl = canvas.getContext('webgl', {
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    });

    if (!gl) {
      canvas.remove();
      return;
    }

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERT_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAG_SHADER);
    const program = gl.createProgram();

    if (!vs || !fs || !program) {
      canvas.remove();
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      canvas.remove();
      return;
    }

    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      res: gl.getUniformLocation(program, 'uRes'),
      time: gl.getUniformLocation(program, 'uTime'),
      mix: gl.getUniformLocation(program, 'uMix'),
      ptr: gl.getUniformLocation(program, 'uPtr'),
      ptrOn: gl.getUniformLocation(program, 'uPtrOn'),
      accent: gl.getUniformLocation(program, 'uAccent'),
      light: gl.getUniformLocation(program, 'uLight'),
    };

    // Match Plug Pilot #38bdf8 electric sky accent (0.22, 0.74, 0.97)
    gl.uniform3f(uniforms.accent, 0.22, 0.74, 0.97);
    gl.uniform1f(uniforms.light, themeRef.current === 'light' ? 1.0 : 0.0);
    canvas.style.opacity = '1';
    setWebglReady(true);

    let width = 1;
    let height = 1;
    let mixTarget = 0;
    let mixCurrent = 0;
    let ptrX = 0.5;
    let ptrY = 0.5;
    let ptrTarget = 0;
    let ptrCurrent = 0;
    let lightCurrent = themeRef.current === 'light' ? 1.0 : 0.0;
    dirtyRef.current = true;

    const updateScrollMix = () => {
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      mixTarget = progress * 2.0;
      dirtyRef.current = true;
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;
      width = Math.max(1, Math.round(rect.width * scale));
      height = Math.max(1, Math.round(rect.height * scale));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      updateScrollMix();
      dirtyRef.current = true;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.height <= 0) return;
      ptrX = (e.clientX - rect.left) / rect.height;
      ptrY = (rect.bottom - e.clientY) / rect.height;
      ptrTarget = 1;
    };

    const onPointerLeave = () => {
      ptrTarget = 0;
    };

    const onMotionChange = () => {
      reduced = mq.matches;
      dirtyRef.current = true;
    };

    window.addEventListener('scroll', updateScrollMix, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    mq.addEventListener('change', onMotionChange);

    const startTime = performance.now();
    let rafId = 0;

    const renderFrame = (now: number) => {
      rafId = requestAnimationFrame(renderFrame);
      const lightTarget = themeRef.current === 'light' ? 1.0 : 0.0;
      if (reduced && !dirtyRef.current && Math.abs(lightTarget - lightCurrent) < 0.005) {
        return;
      }
      dirtyRef.current = false;

      if (reduced) {
        mixCurrent = mixTarget;
        ptrCurrent = 0;
        lightCurrent = lightTarget;
      } else {
        mixCurrent += (mixTarget - mixCurrent) * 0.08;
        ptrCurrent += (ptrTarget - ptrCurrent) * 0.08;
        lightCurrent += (lightTarget - lightCurrent) * 0.16;
      }

      gl.uniform2f(uniforms.res, width, height);
      gl.uniform1f(uniforms.time, reduced ? 12.0 : (now - startTime) / 1000);
      gl.uniform1f(uniforms.mix, mixCurrent);
      gl.uniform2f(uniforms.ptr, ptrX, ptrY);
      gl.uniform1f(uniforms.ptrOn, ptrCurrent);
      gl.uniform1f(uniforms.light, lightCurrent);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('scroll', updateScrollMix);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      mq.removeEventListener('change', onMotionChange);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, []);

  const isLight = theme === 'light';

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-colors duration-300"
      style={{
        background: isLight
          ? 'radial-gradient(60% 50% at 50% 45%, #e0f2fe, transparent 72%), radial-gradient(80% 60% at 80% 110%, #e2e8f0, transparent 70%), #f4f7fb'
          : 'radial-gradient(60% 50% at 50% 55%, #242936, transparent 70%), radial-gradient(80% 60% at 80% 120%, #1d2233, transparent 70%), #050506',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: isLight
            ? 'linear-gradient(180deg, rgba(248,250,252,0.52) 0%, transparent 18%, transparent 74%, rgba(248,250,252,0.58) 100%)'
            : 'linear-gradient(180deg, rgba(5,5,6,0.58) 0%, transparent 18%, transparent 72%, rgba(5,5,6,0.65) 100%)',
        }}
      />
    </div>
  );
};
