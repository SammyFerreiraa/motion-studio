#!/usr/bin/env node
// Renderiza um film.html (que expõe window.seek(t)) quadro a quadro.
//   Preview (dev):  node render.mjs film.html out.mp4 --preview            → 480p, 30 fps, sem blur
//   Final (Reels):  node render.mjs film.html out.mp4                      → 1080p (qualidade máxima do Instagram/Reels), 60 fps, 4 subquadros, JPEG q95, x264 CRF 16 slow (só após validação)
//   4K só se pedirem: --res 2160 (Instagram entrega no máximo 1080×1920; 4K é desperdício e derruba o Chromium por memória)
//   CRF 22 slow: 4K com grão ≈ 1/3 do CRF 16 fast, sem diferença visível a 100% (medido num vídeo de 27 s); x265 alisa o grão, não use
//   Opções:         --w 1920 --h 1080 (layout lógico; 9:16 = --w 1080 --h 1920) --res <lado curto> --fps --sub --dur
//                   --audio a.wav --crf --preset --jobs N (abas em paralelo) --sub N (subquadros de blur) --png (capturas sem perdas)
//                   --gpu (WebGL na NVIDIA) --nvenc (compressão na NVIDIA)
//   Folha:          node render.mjs film.html --sheet out.png (--times 0,0.5 | --beats beats.json [--step 2]) [--cols 3 --res 1080]
// O film.html desenha sempre em coordenadas lógicas W×H; ?res= escala o canvas para a resolução de saída.
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [html, ...rest] = process.argv.slice(2);
const A = {};
const pos = [];
for (let i = 0; i < rest.length; i++) {
  if (!rest[i].startsWith('--')) { pos.push(rest[i]); continue; }
  const k = rest[i].slice(2);
  A[k] = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
}
const out = pos[0];
const W = +A.w || 1920, H = +A.h || 1080;
const preview = !!A.preview;
const RES = +A.res || (A.sheet ? 1080 : preview ? 480 : 1080);   // final: 1080 no lado curto = máximo que o Instagram entrega
const even = (x) => Math.round(x / 2) * 2;
const OW = even(W * RES / Math.min(W, H)), OH = even(H * RES / Math.min(W, H)); // mesma conta do film.html
const fps = +A.fps || (preview ? 30 : 60);
const sub = +A.sub || (preview ? 1 : 4);   // 4 subquadros no final (blur sem fantasmas); em 1080p custa pouco. --sub 2 = metade do tempo
const JPEG = !A.png;                        // capturas JPEG q95 (rápido e leve); --png para PNG sem perdas (bem mais lento em 4K)
// Abas em paralelo: limitadas por CPU e pela memória livre (cada aba 4K + encoder x264 ≈ 2 GB).
const availGB = (() => { try { return +fs.readFileSync('/proc/meminfo', 'utf8').match(/MemAvailable:\s+(\d+)/)[1] / 1048576; } catch { return os.freemem() / 1073741824; } })();
const perJobGB = 0.5 + 1.0 * (OW * OH) / (3840 * 2160);
const cpus = os.cpus().length;
const jobs = A.sheet ? 1 : Math.max(1, +A.jobs || Math.min(4, Math.floor(cpus / 3), Math.floor(availGB * 0.7 / perJobGB)));
const x264threads = Math.max(2, Math.floor(cpus / jobs));
if (!html || !(out || A.sheet)) { console.error('uso: render.mjs film.html out.mp4 [--preview] | --sheet out.png --times ...'); process.exit(1); }

// --gpu: WebGL na NVIDIA (PRIME offload + ANGLE/EGL) em vez do SwiftShader na CPU. Sem a flag, nada muda.
const GPU_ENV = { __NV_PRIME_RENDER_OFFLOAD: '1', __GLX_VENDOR_LIBRARY_NAME: 'nvidia', __EGL_VENDOR_LIBRARY_FILENAMES: '/usr/share/glvnd/egl_vendor.d/10_nvidia.json' };
async function launch() {
  const args = ['--hide-scrollbars', '--force-color-profile=srgb', ...(A.gpu ? ['--use-angle=gl-egl', '--ignore-gpu-blocklist'] : [])];
  const env = A.gpu ? { ...process.env, ...GPU_ENV } : undefined;
  try { return await chromium.launch({ args, env }); }
  catch (e) {
    const root = path.join(os.homedir(), '.cache/ms-playwright');
    const dir = fs.existsSync(root) && fs.readdirSync(root).filter((d) => d.startsWith('chromium-')).sort().pop();
    const exe = dir && path.join(root, dir, 'chrome-linux64/chrome');
    if (exe && fs.existsSync(exe)) return chromium.launch({ executablePath: exe, args, env });
    throw new Error('Sem Chromium. Rode scripts/setup.sh. ' + e.message);
  }
}
const browser = await launch();
async function openPage() {
  const page = await browser.newPage({ viewport: { width: OW, height: OH }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { console.error('erro na página:', e.message); process.exit(2); });
  await page.goto(pathToFileURL(path.resolve(html)).href + `?w=${W}&h=${H}&res=${RES}`);
  await page.waitForFunction(() => typeof window.seek === 'function');
  await page.evaluate(() => window.READY); // fontes/imagens da composição
  if (A.gpu) { const r = await page.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'desconhecido'; });
    if (!/NVIDIA/.test(r)) { console.error('--gpu pedido, mas o WebGL está em: ' + r); process.exit(3); } }
  return page;
}
const page0 = await openPage();
const dur = +A.dur || (await page0.evaluate(() => window.DURATION));
if (!dur) { console.error('defina window.DURATION no film.html ou passe --dur'); process.exit(1); }
const shot = async (page, t) => { await page.evaluate((x) => window.seek(x), t); return JPEG ? page.screenshot({ type: 'jpeg', quality: 95 }) : page.screenshot({ type: 'png' }); };

if (A.sheet) {
  let times = [];
  if (A.times) times = String(A.times).split(',').map(Number);
  else if (A.beats) {
    const b = JSON.parse(fs.readFileSync(A.beats, 'utf8')).beats;
    times = b.filter((_, i) => i % (+A.step || 1) === 0).map((t) => t + 0.12); // 0,12s depois do hit
  } else { for (let t = 0; t < dur; t += 0.5) times.push(t); }
  times = times.filter((t) => t <= dur);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-'));
  const cols = +A.cols || 3, per = cols * 3;
  const sheet = typeof A.sheet === 'string' ? A.sheet : out;
  const outs = [];
  for (let s = 0; s * per < times.length; s++) {
    const chunk = times.slice(s * per, (s + 1) * per);
    for (let i = 0; i < chunk.length; i++) fs.writeFileSync(path.join(tmp, `${String(i).padStart(3, '0')}.${JPEG ? 'jpg' : 'png'}`), await shot(page0, chunk[i]));
    const o = sheet.replace(/\.png$/, `-${s + 1}.png`);
    const rows = Math.ceil(chunk.length / cols);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '1', '-i', path.join(tmp, `%03d.${JPEG ? 'jpg' : 'png'}`),
      '-vf', `scale=640:-1,tile=${cols}x${rows}`, '-frames:v', '1', o]);
    for (const f of fs.readdirSync(tmp)) fs.unlinkSync(path.join(tmp, f));
    outs.push(`${o}  (t = ${chunk.map((t) => t.toFixed(2)).join(', ')})`);
  }
  console.log(outs.join('\n'));
  await browser.close();
  process.exit(0);
}

// MP4: N abas renderizam faixas de quadros em segmentos; concat sem reencode + áudio no fim.
const total = Math.round(dur * fps);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'render-'));
const per = Math.ceil(total / jobs);
let done = 0;
const tick = setInterval(() => process.stdout.write(`\r${OW}x${OH} ${fps}fps ×${sub} · ${jobs} abas · ${done}/${total} quadros`), 2000);

async function segment(j, page) {
  const f0 = j * per, f1 = Math.min(total, f0 + per);
  const seg = path.join(tmp, `seg${j}.mp4`);
  const ff = ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps * sub), '-c:v', JPEG ? 'mjpeg' : 'png', '-i', '-'];
  // tmix por grupo de `sub` subquadros; o grupo sempre começa no início do segmento, então não vaza entre segmentos
  if (sub > 1) ff.push('-vf', `tmix=frames=${sub},select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/(${fps}*TB)`);
  // --nvenc: compressão na NVIDIA (libera a CPU); --crf vira -cq com a mesma escala aproximada. Medido: só ~20 % mais rápido e arquivo ~5× maior que o x264; não use no final.
  if (A.nvenc) ff.push('-r', String(fps), '-c:v', 'h264_nvenc', '-pix_fmt', 'yuv420p', '-preset', 'p7', '-tune', 'hq', '-rc', 'vbr',
    '-cq', String(A.crf || (preview ? 26 : 16)), '-b:v', '0', '-spatial-aq', '1', '-temporal-aq', '1', seg);
  else ff.push('-r', String(fps), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(A.crf || (preview ? 26 : 16)),
    '-preset', A.preset || (preview ? 'veryfast' : 'slow'), '-threads', String(x264threads), '-x264-params', 'rc-lookahead=20', seg);
  const enc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
  const closed = new Promise((res, rej) => { enc.on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res())); });
  enc.stdin.on('error', () => {});
  for (let f = f0; f < f1; f++) {
    for (let s = 0; s < sub; s++) {
      // obturador centrado no quadro f; quadro 0 não vai abaixo de t=0
      const t = Math.max(0, f / fps + (s / sub - (sub - 1) / (2 * sub)) / fps);
      if (!enc.stdin.write(await shot(page, t))) await new Promise((r) => enc.stdin.once('drain', r));
    }
    done++;
  }
  enc.stdin.end();
  await closed;
  return seg;
}
console.log(`${OW}x${OH} · ${jobs} aba(s) · ${availGB.toFixed(1)} GB livres (~${perJobGB.toFixed(1)} GB por aba)`);
let segs;
try {
  const pages = [page0, ...(await Promise.all(Array.from({ length: jobs - 1 }, openPage)))];
  segs = await Promise.all(pages.map((p, j) => segment(j, p)));
} catch (e) {
  clearInterval(tick);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.error(`\nfalhou em ${done}/${total} quadros: ${e.message}\nSe foi memória, rode de novo com --jobs 1 (ou feche outros processos).`);
  await browser.close().catch(() => {});
  process.exit(1);
}
clearInterval(tick);
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
const mux = ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list];
if (A.audio) mux.push('-i', A.audio);
mux.push('-c:v', 'copy');
if (A.audio) mux.push('-c:a', 'aac', '-b:a', '192k', '-t', String(dur));
mux.push('-movflags', '+faststart', out);
execFileSync('ffmpeg', mux);
fs.rmSync(tmp, { recursive: true, force: true });
await browser.close();
console.log(`\nok → ${out} (${OW}x${OH}, ${fps} fps)`);
