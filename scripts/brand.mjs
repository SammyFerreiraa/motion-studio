#!/usr/bin/env node
// Captura a marca real de um site: telas, logo, cores, fontes, textos.
//   node brand.mjs https://site.com <pasta-de-saida>   → assets/ + brand-capture.json
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [url, dir = 'assets'] = process.argv.slice(2);
if (!url) { console.error('uso: brand.mjs <url> [pasta]'); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });

async function launch() {
  try { return await chromium.launch(); } catch (e) {
    const root = path.join(os.homedir(), '.cache/ms-playwright');
    const d = fs.existsSync(root) && fs.readdirSync(root).filter((x) => x.startsWith('chromium-')).sort().pop();
    const exe = d && path.join(root, d, 'chrome-linux64/chrome');
    if (exe && fs.existsSync(exe)) return chromium.launch({ executablePath: exe });
    throw e;
  }
}
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const abs = (u) => { try { return new URL(u, location.href).href; } catch { return null; } };
  const meta = (n) => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.content || null;
  const hex = (c) => { const m = c.match(/\d+(\.\d+)?/g); if (!m || (m[3] !== undefined && +m[3] === 0)) return null; return '#' + m.slice(0, 3).map((x) => (+x | 0).toString(16).padStart(2, '0')).join(''); };
  const area = {};
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const s = getComputedStyle(el), a = Math.min(r.width * r.height, 1e6);
    const bg = hex(s.backgroundColor), fg = el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) ? hex(s.color) : null;
    if (bg) area[bg] = (area[bg] || 0) + a; if (fg) area[fg] = (area[fg] || 0) + a * 0.15;
  }
  const colors = Object.entries(area).sort((x, y) => y[1] - x[1]).slice(0, 10).map(([c]) => c);
  const fam = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).fontFamily : null; };
  const faces = [];
  for (const ss of document.styleSheets) { try { for (const r of ss.cssRules) if (r instanceof CSSFontFaceRule) faces.push({ family: r.style.fontFamily, src: r.style.src.slice(0, 300) }); } catch {} }
  const logoEl = [...document.querySelectorAll('header img, nav img, a[href="/"] img, img[class*=logo i], img[alt*=logo i], img[src*=logo i]')][0];
  const logoSvg = [...document.querySelectorAll('header svg, nav svg, a[href="/"] svg, [class*=logo i] svg, svg[class*=logo i]')][0];
  return {
    title: document.title, h1: document.querySelector('h1')?.innerText || null,
    description: meta('description'), themeColor: meta('theme-color'), ogImage: abs(meta('og:image')),
    favicon: abs(document.querySelector('link[rel~=icon]')?.href || '/favicon.ico'),
    colors, fonts: { h1: fam('h1'), body: fam('body'), button: fam('button, a[class*=btn i], a[class*=button i]') }, fontFaces: faces.slice(0, 12),
    logoImg: logoEl ? abs(logoEl.currentSrc || logoEl.src) : null, logoSvg: logoSvg ? logoSvg.outerHTML : null,
    cta: [...document.querySelectorAll('a,button')].map((e) => e.innerText.trim()).filter((t) => t && t.length < 28).slice(0, 12),
  };
});

// SVG inline costuma vir com width/height 100% ou sem tamanho: no canvas (drawImage) isso não desenha. Fixa pelo viewBox.
if (info.logoSvg) {
  let svg = info.logoSvg; const vb = svg.match(/viewBox="[\d.\-]+[ ,]+[\d.\-]+[ ,]+([\d.]+)[ ,]+([\d.]+)"/);
  if (vb) svg = svg.replace(/<svg([^>]*)>/, (m, at) => `<svg${at.replace(/\s(width|height)="[^"]*"/g, '')} width="${vb[1]}" height="${vb[2]}">`);
  if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  fs.writeFileSync(path.join(dir, 'logo.svg'), svg);
}
for (const [name, u] of [['logo', info.logoImg], ['og', info.ogImage], ['favicon', info.favicon]]) {
  if (!u) continue;
  try { const r = await page.request.get(u); if (r.ok()) fs.writeFileSync(path.join(dir, `${name}${path.extname(new URL(u).pathname) || '.png'}`), await r.body()); } catch {}
}
const h = await page.evaluate(() => document.documentElement.scrollHeight);
await page.screenshot({ path: path.join(dir, 'hero.png') });
for (let i = 1; i <= 5 && i * 900 < h; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * 900); await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(dir, `sec-${i}.png`) });
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: path.join(dir, 'full.png'), fullPage: true }).catch(() => {});
delete info.logoSvg;
fs.writeFileSync(path.join(dir, 'brand-capture.json'), JSON.stringify({ url, ...info }, null, 2));
console.log(`ok → ${dir}/ (hero, sec-N, full, logo*, brand-capture.json)`);
console.log('cores:', info.colors.join(' '), '| fontes:', JSON.stringify(info.fonts));
await browser.close();
