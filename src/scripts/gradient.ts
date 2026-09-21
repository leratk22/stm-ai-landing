/**
 * Анимированный градиентный фон на WebGL2.
 *
 * На референсе (atlasdesign.framer.ai) фон героя — не картинка и не CSS-градиент,
 * а полноэкранный шейдер на <canvas>. Повторяем тем же приёмом, без библиотек:
 * один fullscreen-quad и фрагментный шейдер с домен-варпом fBm, диагональными
 * лучами и зерном.
 *
 * Деградация: нет WebGL2 или включён prefers-reduced-motion — канвас не
 * поднимаем, остаётся статичная CSS-подложка под ним.
 */

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec3  uAccent;   // основной красный
uniform vec3  uDeep;     // тёмная база
uniform float uIntensity;

out vec4 fragColor;

// ── value noise + fBm ─────────────────────────────────────────
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return v;
}

// Диагональные лучи — светлые полосы, идущие из левого нижнего угла
float beams(vec2 uv, float t) {
  float angle = -0.62;
  vec2 r = vec2(
    uv.x * cos(angle) - uv.y * sin(angle),
    uv.x * sin(angle) + uv.y * cos(angle)
  );
  float warp = fbm(r * 1.6 + t * 0.04) * 0.55;
  float band = sin((r.x + warp) * 7.5 + t * 0.12);
  return pow(max(band, 0.0), 6.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  // сохраняем пропорции, чтобы узор не растягивало на широких экранах
  vec2 p = uv;
  p.x *= uResolution.x / uResolution.y;

  float t = uTime * 0.16;

  // Домен-варп: сдвигаем координаты вторым слоем шума — даёт «жидкое» перетекание
  vec2 q = vec2(fbm(p + t * 0.10), fbm(p + vec2(3.7, 1.2) - t * 0.08));
  vec2 w = vec2(
    fbm(p + 2.2 * q + vec2(1.7, 9.2) + t * 0.06),
    fbm(p + 2.2 * q + vec2(8.3, 2.8) - t * 0.05)
  );
  float n = fbm(p + 2.6 * w);

  // Геометрия снята пиксельным замером экспортированного градиента из макета:
  // красный держится вдоль всего правого края и гаснет к центру (на x=0.5 уже
  // #600000, на x=0.25 — чёрный). Это полоса, а не круглое пятно.
  float ar = uResolution.x / uResolution.y;
  float nx = p.x / ar;                 // 0 слева, 1 справа

  float edge = pow(smoothstep(0.34, 1.06, nx), 1.35);

  // Тёплый клин в левом нижнем углу — в замере там самый яркий тон, #ff6d1c
  float ember = 1.0 - smoothstep(0.0, 0.58, distance(vec2(nx, uv.y), vec2(0.0)));
  float glow = max(edge, pow(ember, 2.2) * 0.78);

  // Смешиваем: чёрная база → красный → раскалённый тон.
  // Шум держим приглушённым, иначе красный уходит в грязь.
  float mask = clamp(glow * 1.26 + n * 0.17 - 0.10, 0.0, 1.0);
  vec3 col = mix(uDeep, uAccent, smoothstep(0.06, 0.86, mask));
  // #ff6d1c — самый светлый тон замера, только в пике
  col = mix(col, vec3(1.0, 0.427, 0.110), smoothstep(0.84, 1.0, mask) * 0.65);

  // Лучи поверх — «дыхание», которого нет у статичного PNG
  col += uAccent * beams(p, uTime) * 0.38 * glow;

  // Зерно — убирает бандинг на больших плавных заливках
  float grain = (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.035;
  col += grain;

  fragColor = vec4(max(col, 0.0), 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("[gradient] shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16) / 255,
    parseInt(v.slice(2, 4), 16) / 255,
    parseInt(v.slice(4, 6), 16) / 255,
  ];
}

export function initGradient(canvas: HTMLCanvasElement): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return false;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return false;

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("[gradient] link:", gl.getProgramInfoLog(program));
    return false;
  }
  gl.useProgram(program);

  // Fullscreen quad
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uTime = gl.getUniformLocation(program, "uTime");

  const accent = canvas.dataset.accent ?? "#ff1e00";
  const deep = canvas.dataset.deep ?? "#000000";
  const intensity = Number(canvas.dataset.intensity ?? "1");
  gl.uniform3fv(gl.getUniformLocation(program, "uAccent"), hexToRgb(accent));
  gl.uniform3fv(gl.getUniformLocation(program, "uDeep"), hexToRgb(deep));
  gl.uniform1f(gl.getUniformLocation(program, "uIntensity"), intensity);

  // Плотность пикселей режем до 1.5 — на 4К шейдер иначе съедает кадр
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uResolution, w, h);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  // Рисуем только пока канвас в зоне видимости — не греем батарею впустую
  let visible = false;
  let running = false;
  const start = performance.now();

  function frame(now: number) {
    if (!visible) {
      running = false;
      return;
    }
    gl!.uniform1f(uTime, (now - start) / 1000);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }

  // Один цикл за раз: без этого возврат во вьюпорт плодит параллельные RAF
  function ensureRunning() {
    if (running || !visible) return;
    running = true;
    requestAnimationFrame(frame);
  }

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      ensureRunning();
    },
    { threshold: 0 },
  ).observe(canvas);

  return true;
}
