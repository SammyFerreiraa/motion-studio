#!/usr/bin/env node
// Gera events.json a partir de window.SFX() do film.html (SFX derivados dos tempos do filme).
//   node events.mjs film.html [events.json] [--voice-t0 0.0]
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const [html, out = 'events.json'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const i = process.argv.indexOf('--voice-t0');
const b = await chromium.launch(); const p = await b.newPage();
await p.goto(pathToFileURL(path.resolve(html)).href);
await p.waitForFunction(() => typeof window.SFX === 'function');
await p.evaluate(() => window.READY);
const ev = await p.evaluate(() => window.SFX());
if (i > 0) ev.voice_t0 = +process.argv[i + 1];
fs.writeFileSync(out, JSON.stringify(ev, null, 1));
console.log(`ok → ${out}: ${ev.events.length} eventos, ${ev.dur}s`);
await b.close();
