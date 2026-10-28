// core.js — helpers compartilhados. NÃO editar sem avisar o orquestrador.
// Contrato: o filme é uma função pura do tempo. window.seek(t) pinta o quadro t, nada mais.
const Q = new URLSearchParams(location.search);
const W = 1920, H = 1080;
const cv = document.getElementById('c');
const RES = +Q.get('res') || 1080;
const even = (x) => Math.round(x / 2) * 2;
const OW = even(W * RES / H), OH = even(RES), KX = OW / W, KY = OH / H, KS = (KX + KY) / 2;
cv.width = OW; cv.height = OH;
const g = cv.getContext('2d');
if (KS !== 1) { // blur e sombra do canvas ignoram a transformação: escalar à mão
  const P = CanvasRenderingContext2D.prototype, d = (p) => Object.getOwnPropertyDescriptor(P, p);
  for (const p of ['shadowBlur', 'shadowOffsetX', 'shadowOffsetY']) { const D = d(p); Object.defineProperty(g, p, { get: () => D.get.call(g) / KS, set: (v) => D.set.call(g, v * KS) }); }
  const F = d('filter'); Object.defineProperty(g, 'filter', { get: () => F.get.call(g), set: (v) => F.set.call(g, String(v).replace(/blur\(([\d.]+)px\)/g, (_, n) => `blur(${(n * KS).toFixed(2)}px)`)) });
}
const CX = W / 2, CY = H / 2;
const BPM = 120, B = 60 / BPM;
window.DURATION = 48 * B; // 24 s: 12 compassos a 120 BPM

// ---------- marca ----------
const INK = '#10140F', INK2 = '#1C2219', PAPER = '#F5F4EC', LIME = '#C5F04A', LIMED = '#3F6B00', CORAL = '#FF5C39', MUSGO = '#6B7068', CREAM = '#F5F4EC';
const DISPLAY = 'Bricolage', UI = 'Inter', MONO = 'JBMono';
const DROP = new Path2D('M353.603 102.4c-66.264 10.918-198.792 106.387-198.792 201.125 0 59.908 48.171 106.224 108.079 106.224 61.945 0 108.242-49.985 108.242-105.653 0-64.881-50.288-92.342-50.288-130.822 0-24.946 25.84-61.146 32.759-70.874Z');
const FONTS = [
  [DISPLAY, 'bricolage-grotesque-latin-800-normal', '800'],
  [UI, 'inter-latin-500-normal', '500'], [UI, 'inter-latin-600-normal', '600'],
  [MONO, 'jetbrains-mono-latin-500-normal', '500'], [MONO, 'jetbrains-mono-latin-700-normal', '700'],
];

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mulberry32 = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function step(dt, z = 0.82, w = 14) {
  if (dt <= 0) return 0;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + (z * w / wd) * Math.sin(wd * dt));
}
function sv(t, start, changes, z, w) { let v = start, prev = start; for (const c of changes) { v += (c.to - prev) * step(t - c.t, z, w); prev = c.to; } return v; }
const ramp = (t, t0, d) => clamp((t - t0) / d);
const eDrop = (x) => 1 - Math.pow(1 - clamp(x), 4);
const lerp = (a, b, x) => a + (b - a) * x;

// ---------- textura ----------
let GRAIN;
function buildGrain() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), im = x.createImageData(256, 256), r = mulberry32(11);
  for (let i = 0; i < im.data.length; i += 4) { const v = r() < 0.5 ? 0 : 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 14 + r() * 22; }
  x.putImageData(im, 0, 0); return c;
}
function texture(t, vig) {
  const gr = g.createRadialGradient(CX, CY, 300, CX, CY, 1150); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, vig);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const f = Math.floor(t * 24) % 576, r = mulberry32(f + 3), ox = r() * 256, oy = r() * 256;
  g.save(); g.globalAlpha = 0.55; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.translate(-ox, -oy); g.fillRect(ox, oy, W, H); g.restore();
}

// ---------- helpers de desenho ----------
function font(fam, wt, size) { g.font = `${wt} ${size}px ${fam}`; }
function tw(txt, fam, wt, size) { font(fam, wt, size); return g.measureText(txt).width; }
function fx(alpha, blur, fn) { if (alpha <= 0.003) return; g.save(); g.globalAlpha *= alpha; if (blur > 0.2) g.filter = `blur(${blur.toFixed(1)}px)`; fn(); g.restore(); }
function text(txt, x, y, fam, wt, size, color, align = 'left', alpha = 1, blur = 0) {
  fx(alpha, blur, () => { font(fam, wt, size); g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillStyle = color; g.fillText(txt, x, y); });
}
function word(txt, x, y, fam, wt, size, color, tIn, t, tOut = 1e9) {
  const p = eDrop(ramp(t, tIn, 0.2)), o = ramp(t, tOut, 0.25);
  text(txt, x, y + 10 * (1 - p), fam, wt, size, color, 'left', p * (1 - o), 10 * (1 - p) + 14 * o);
}
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function dropShape(cx, cy, s, color, sx = 1, sy = 1) { // base apoiada em cy
  g.save(); g.translate(cx, cy); g.scale(sx * s / 512, sy * s / 512); g.translate(-263, -410); g.fillStyle = color; g.fill(DROP); g.restore();
}
function iconSq(cx, cy, s, a = 1) {
  g.save(); g.globalAlpha *= a; g.translate(cx - s / 2, cy - s / 2); g.scale(s / 512, s / 512);
  g.fillStyle = INK; rr(0, 0, 512, 512, 115.2); g.fill(); g.fillStyle = '#C9FF3A'; g.fill(DROP); g.restore();
}
function sparkle(cx, cy, s, color) {
  g.save(); g.translate(cx, cy); g.fillStyle = color; g.beginPath(); g.moveTo(0, -s);
  g.quadraticCurveTo(0, 0, s, 0); g.quadraticCurveTo(0, 0, 0, s); g.quadraticCurveTo(0, 0, -s, 0); g.quadraticCurveTo(0, 0, 0, -s); g.fill(); g.restore();
}
function blob(x, y, r, a) { // spray: mancha macia
  if (a <= 0.003 || r <= 0.5) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(16,20,15,${a})`); gr.addColorStop(0.6, `rgba(16,20,15,${a * 0.85})`); gr.addColorStop(1, 'rgba(16,20,15,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}

