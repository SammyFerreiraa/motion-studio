// sprites.js — pixel art 32×32 sombreada (luz / base / sombra), contorno preto automático. Dono: agente de sprites.
// Cada sprite é desenhado em uma grade de caracteres (paleta por letra, '.' = vazio) por um mini-DSL e vira 32 strings de 32 chars.
const PAL = {
  K: '#10140F', W: '#FFFFFF', w: '#ECEADF', g: '#BFC3BA', G: '#8A9086', P: '#F5F4EC',
  L: '#C5F04A', l: '#8DB82A', C: '#FF5C39', c: '#C23A1C', o: '#FFA78F',
  Y: '#F2B705', y: '#B07A00', u: '#FFE37A',
  B: '#3F6BDA', b: '#27489F', e: '#8DAEF7',
  S: '#BFE3F2', s: '#7FC3DE', t: '#EAF8FD', I: '#4C93B5',
  D: '#2B2E2B', d: '#51564F', q: '#181B18',
  z: '#E6FF9A', M: '#D3D7D2', m: '#9EA59D', n: '#69706A', A: '#9ADAF0',
};
function mkGrid() { return Array.from({ length: 32 }, () => Array(32).fill('.')); }
function put(G, x, y, c) { if (c && x >= 0 && y >= 0 && x < 32 && y < 32) G[y][x] = c; }
function shape(G, inside, f) { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (inside(x + 0.5, y + 0.5)) put(G, x, y, typeof f === 'function' ? f(x, y) : f); }
const rc = (G, x, y, w, h, f) => shape(G, (px, py) => px >= x && px <= x + w && py >= y && py <= y + h, f);
const el = (G, cx, cy, rx, ry, f) => shape(G, (px, py) => ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1, f);
function rr(G, x, y, w, h, r, f) {
  shape(G, (px, py) => {
    if (px < x || px > x + w || py < y || py > y + h) return false;
    const dx = Math.max(x + r - px, px - (x + w - r), 0), dy = Math.max(y + r - py, py - (y + h - r), 0);
    return dx * dx + dy * dy <= r * r;
  }, f);
}
function poly(G, pts, f) {
  shape(G, (px, py) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c; } return c; }, f);
}
function st(G, x, y, rows) { rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') put(G, x + i, y + j, ch === '_' ? '.' : ch); })); }
const hl = (G, x, y, w, c) => rc(G, x, y, w - 0.01, 0.99, c);
const vl = (G, x, y, h, c) => rc(G, x, y, 0.99, h - 0.01, c);

const DRAW = {
  mouse(G) {
    const body = (x, y) => (x <= 10 && y > 5 && y < 25 ? 'W' : x >= 20 || y >= 27 ? 'g' : x >= 18 ? 'M' : 'w');
    el(G, 15.5, 16.5, 8.6, 13.6, body);
    vl(G, 15, 4.5, 8.5, 'K'); hl(G, 8, 13, 16, 'K');
    // botões: realce esquerdo/direito
    rc(G, 9, 5, 4, 1, 'W'); rc(G, 9, 6, 2, 3, 'W'); rc(G, 18, 5, 3, 1, 'M');
    // roda lima
    rr(G, 13.2, 6, 5, 8, 1.4, 'K'); rr(G, 14, 6.8, 3.4, 6.2, 1, 'L'); vl(G, 16, 7, 6, 'l'); hl(G, 14, 7, 2, 'z'); hl(G, 14, 9, 3, 'l'); hl(G, 14, 11, 3, 'l');
    // logo + faixa lima
    el(G, 15.5, 21.5, 2.4, 2.4, 'K'); el(G, 15.5, 21.5, 1.5, 1.5, 'L'); put(G, 15, 21, 'z');
    hl(G, 9, 26, 3, 'G'); hl(G, 20, 26, 2, 'G');
    put(G, 9, 15, 'W'); put(G, 9, 16, 'W'); put(G, 9, 17, 'W');
  },
  fryer(G) {
    // corpo
    rr(G, 3.5, 6, 25, 23, 5, (x, y) => (x <= 6 ? 'd' : x >= 25 ? 'q' : 'D'));
    // tampa
    rr(G, 3.5, 2.5, 25, 8, 3.5, (x, y) => (y <= 3 ? 'n' : x <= 6 ? 'm' : x >= 25 ? 'd' : 'd'));
    hl(G, 5, 3, 22, 'm'); hl(G, 6, 4, 12, 'n');
    // painel: display lima + botões
    rr(G, 7.5, 5.5, 7, 3, 1, 'K'); hl(G, 8, 6, 2, 'L'); hl(G, 11, 6, 1, 'L'); hl(G, 13, 6, 1, 'l'); hl(G, 9, 7, 5, 'l');
    el(G, 21, 7, 2, 2, 'K'); el(G, 21, 7, 1.2, 1.2, 'm'); el(G, 26, 7, 1.4, 1.4, 'K'); put(G, 25, 6, 'L');
    // janela
    rr(G, 6.5, 12, 19, 11, 3, 'K');
    rr(G, 7.5, 13, 17, 9, 2.4, (x, y) => (y >= 20 ? 'I' : 'A'));
    // cesta/ comida dourada visível
    el(G, 12.5, 21.5, 3.6, 2.2, 'Y'); el(G, 18.5, 21.5, 3.2, 2.0, 'Y'); hl(G, 10, 21, 3, 'u'); hl(G, 17, 21, 3, 'u'); hl(G, 14, 22, 5, 'y');
    // reflexo
    st(G, 9, 14, ['..tt', '.tt.', 'tt..']); st(G, 14, 14, ['.t', 't.']);
    // gaveta
    hl(G, 7, 24, 18, 'q'); rr(G, 9.5, 25.2, 13, 2.6, 1.2, 'K'); hl(G, 10, 25.8, 12, 'm'); hl(G, 10, 26.8, 12, 'n');
    // pés
    rc(G, 6, 29, 4, 1, 'K'); rc(G, 22, 29, 4, 1, 'K');
    put(G, 4, 14, 'd'); vl(G, 4, 12, 9, 'd'); vl(G, 4, 20, 4, 'n');
  },
  shoe(G) {
    const CO = (x, y) => (y >= 19 ? 'c' : 'C');
    // cabedal
    poly(G, [[3, 23], [2.5, 11], [5, 7.5], [9, 8], [12, 11], [14, 13], [19, 15], [24, 16], [28, 18.5], [30.5, 21.5], [30.5, 24]], CO);
    // gola do tornozelo (interior escuro)
    poly(G, [[5, 8.5], [8.5, 9], [11, 11.5], [13, 14], [9, 14], [5, 12]], 'q');
    poly(G, [[5, 9], [8, 9.5], [10.5, 12], [7, 12.5], [5, 11]], 'D');
    // língua
    poly(G, [[11, 5.5], [15, 5], [18, 9], [17, 15], [13, 14], [11.5, 11]], (x, y) => (x <= 13 ? 'o' : 'C'));
    hl(G, 12, 5, 3, 'K');
    // biqueira clara
    el(G, 26.5, 21, 4.2, 3, (x, y) => (y <= 19 ? 'o' : y >= 22 ? 'c' : 'C'));
    // cadarços
    st(G, 13, 11, ['W_W_', '_WW_']); st(G, 14, 13, ['.WWW']); st(G, 17, 15, ['WWW']); st(G, 20, 17, ['WW']);
    // swoosh lateral
    st(G, 6, 17, ['WW', '_WWW', '__WWWW', '___WWWWW', '____WWWWWW']);
    st(G, 12, 22, ['WWWW']);
    // calcanhar escuro
    rc(G, 2.5, 13, 2, 7, (x, y) => 'c'); put(G, 3, 12, 'c');
    // entressola/sola branca
    poly(G, [[1.5, 23], [29, 23], [31, 22], [31.5, 25], [30, 28], [3, 28], [1.5, 26]], (x, y) => (y >= 27 ? 'G' : y >= 26 ? 'g' : y <= 23 ? 'P' : 'W'));
    hl(G, 2, 23, 28, 'K'); hl(G, 3, 25, 26, 'g');
    for (let x = 5; x < 29; x += 3) put(G, x, 27, 'm');
    put(G, 3, 24, 'W'); put(G, 4, 24, 'W');
  },
  whey(G) {
    // tampa
    rr(G, 6.5, 2.5, 19, 5, 1.6, (x, y) => (y <= 3 ? 'd' : y >= 6 ? 'q' : 'D'));
    for (let x = 8; x < 24; x += 2) vl(G, x, 4, 2, 'q'); hl(G, 7, 3, 6, 'n');
    // corpo
    rr(G, 4.5, 7.5, 23, 22, 3.5, (x, y) => (x <= 7 ? 'u' : x >= 24 ? 'y' : y >= 27 ? 'y' : 'Y'));
    hl(G, 5, 8, 22, 'y');
    // rótulo
    rr(G, 6.5, 12.5, 19, 13, 1.4, 'K'); rr(G, 7.4, 13.4, 17.2, 11.2, 1, (x, y) => (y >= 23 ? 'g' : 'W'));
    st(G, 11, 15, ['KKK.KK..KKK', 'K.K.K.K.K.K', 'KKK.KK..K.K', 'K...K.K.K.K', 'K...K.K.KKK']);
    hl(G, 8, 20, 16, 'L'); hl(G, 8, 21, 16, 'l'); hl(G, 9, 22, 9, 'G');
    // biceps pixel
    // brilho do pote
    vl(G, 5, 11, 12, 'W'); put(G, 6, 9, 'u');
  },
  diaper(G) {
    // pacote com topo serrilhado
    rr(G, 3.5, 6.5, 25, 22, 3.5, (x, y) => (x >= 25 ? 's' : y >= 26 ? 's' : x <= 6 ? 't' : 'S'));
    rr(G, 3.5, 3.5, 25, 6, 2, (x, y) => (y >= 8 ? 's' : 'W'));
    for (let x = 4; x < 28; x += 3) { put(G, x, 3, '.'); put(G, x + 1, 2, '.'); }
    // alça vazada
    rr(G, 11.5, 5.5, 9, 3, 1.4, 'K'); rr(G, 12.5, 6.3, 7, 1.4, 0.7, 'D');
    // ilustração: fralda branca com tiras lima
    poly(G, [[8, 12.5], [24, 12.5], [23, 17], [19.5, 22.5], [17, 24], [15, 24], [12.5, 22.5], [9, 17]], (x, y) => (y >= 21 ? 'g' : 'W'));
    hl(G, 8, 12, 17, 'K');
    rc(G, 6.5, 13, 3.4, 3, 'K'); rc(G, 7.2, 13.6, 2, 1.8, 'L'); rc(G, 22.5, 13, 3.4, 3, 'K'); rc(G, 23.2, 13.6, 2, 1.8, 'L');
    hl(G, 12, 14, 8, 's'); hl(G, 12, 16, 8, 's'); hl(G, 13, 18, 6, 's');
    // gotinha azul
    st(G, 15, 19, ['.s.', 'sss', 'sIs']);
    hl(G, 7, 26, 10, 'I'); hl(G, 7, 27, 6, 'I');
    vl(G, 4, 10, 15, 'W');
  },
  pad(G) {
    const body = (x, y) => (y >= 21 ? 'b' : y <= 10 ? 'e' : 'B');
    // gatilhos/bumpers
    rr(G, 5, 4.5, 6.5, 4, 1.8, (x, y) => (y <= 5 ? 'M' : 'm')); rr(G, 20.5, 4.5, 6.5, 4, 1.8, (x, y) => (y <= 5 ? 'M' : 'm'));
    // corpo + manoplas
    rr(G, 1.5, 7.5, 29, 12, 5.5, body);
    poly(G, [[1.5, 15], [9, 17], [10, 24], [8, 27.5], [4.5, 28], [1.8, 24]], (x, y) => (y >= 23 ? 'b' : 'B'));
    poly(G, [[30.5, 15], [23, 17], [22, 24], [24, 27.5], [27.5, 28], [30.2, 24]], (x, y) => (y >= 23 ? 'b' : 'B'));
    hl(G, 8, 9, 16, 'e'); hl(G, 4, 10, 2, 'e');
    // d-pad
    st(G, 6, 10, ['.KKK.', 'KDDDK', 'KDDDK'.replace(/D/g, 'D')]); rc(G, 5, 12, 7, 3, 'K'); rc(G, 7, 10, 3, 7, 'K'); rc(G, 8, 11, 1, 5, 'D'); rc(G, 6, 13, 5, 1, 'D'); put(G, 8, 13, 'd'); put(G, 8, 11, 'd');
    // botões ABXY
    const bt = (cx, cy, c) => { el(G, cx, cy, 1.9, 1.9, 'K'); el(G, cx, cy, 1.2, 1.2, c); };
    bt(24, 10.5, 'Y'); bt(21.2, 13.3, 'L'); bt(26.8, 13.3, 'W'); bt(24, 16.2, 'g');
    // sticks
    el(G, 11.5, 20.5, 3.2, 3.2, 'K'); el(G, 11.5, 20.5, 2.2, 2.2, 'd'); put(G, 10, 19, 'm');
    el(G, 20.5, 20.5, 3.2, 3.2, 'K'); el(G, 20.5, 20.5, 2.2, 2.2, 'd'); put(G, 19, 19, 'm');
    // centro
    el(G, 16, 13, 1.2, 1.2, 'K'); hl(G, 13, 11, 2, 'K'); hl(G, 17, 11, 2, 'K'); put(G, 16, 13, 'L');
    vl(G, 3, 17, 7, 'e');
  },
  pot(G) {
    // alças laterais
    rr(G, 0.8, 16, 6, 4, 1.6, (x, y) => (y <= 17 ? 'd' : 'q')); rr(G, 25.2, 16, 6, 4, 1.6, (x, y) => (y <= 17 ? 'd' : 'q'));
    // corpo
    rr(G, 4.5, 13.5, 23, 15, 3.5, (x, y) => (x <= 8 ? 'M' : x >= 24 ? 'n' : y >= 26 ? 'n' : x >= 21 ? 'm' : 'G'));
    vl(G, 6, 17, 8, 'W'); vl(G, 9, 16, 9, 'M');
    // tampa abaulada
    rr(G, 3.5, 8, 25, 7, 3.2, (x, y) => (y <= 9 ? 'W' : x >= 24 ? 'm' : y >= 13 ? 'G' : x <= 9 ? 'M' : 'g'));
    hl(G, 4, 14, 24, 'n');
    // grampos
    rc(G, 5, 12, 2, 5, 'D'); rc(G, 25, 12, 2, 5, 'D'); put(G, 5, 12, 'd'); put(G, 25, 12, 'd');
    // alça superior
    rr(G, 9, 5, 14, 4, 1.8, (x, y) => (y <= 6 ? 'd' : 'q')); hl(G, 10, 5, 8, 'n');
    // válvula + manômetro
    rc(G, 14, 2, 4, 4, 'K'); rc(G, 15, 3, 2, 3, 'D'); put(G, 15, 3, 'm');
    el(G, 22.5, 6.2, 1.8, 1.6, 'K'); put(G, 22, 6, 'L');
    // painel frontal: marca lima e visor
    el(G, 16, 21, 3.4, 3.4, 'K'); el(G, 16, 21, 2.4, 2.4, 'P'); put(G, 16, 21, 'K'); put(G, 17, 20, 'K'); put(G, 15, 22, 'K');
    put(G, 13, 27, 'D'); hl(G, 12, 26, 8, 'n');
  },
  shirt(G) {
    const sh = (x, y) => (x <= 9 && y > 12 ? 'e' : x >= 22 && y > 12 ? 'b' : y >= 27 ? 'b' : 'B');
    poly(G, [[10.5, 3], [14, 5.5], [18, 5.5], [21.5, 3], [30, 8.5], [27, 15.5], [22.5, 13.5], [22.5, 28.5], [9.5, 28.5], [9.5, 13.5], [5, 15.5], [2, 8.5]], sh);
    // mangas: luz/sombra
    poly(G, [[2.5, 9], [10, 4], [10.5, 7.5], [5.5, 14.5], [3, 12]], (x, y) => (x <= 4 ? 'B' : 'e'));
    poly(G, [[29.5, 9], [21.5, 4], [21, 7.5], [26.5, 14.5], [29, 12]], (x, y) => (y >= 12 ? 'b' : 'B'));
    // gola
    poly(G, [[10.5, 3], [14, 5.5], [18, 5.5], [21.5, 3], [19, 3.2], [16, 4.2], [13, 3.2]], 'b');
    poly(G, [[13, 3.5], [16, 4.6], [19, 3.5], [18, 6.5], [14, 6.5]], 'q');
    poly(G, [[14, 4], [16, 5], [18, 4], [17.4, 5.8], [14.6, 5.8]], 'D');
    // dobras
    vl(G, 13, 17, 8, 'b'); vl(G, 19, 19, 7, 'b'); hl(G, 10, 27, 12, 'b');
    st(G, 6, 10, ['__e', '_e', 'e']);
    // estampa: raio branco
    st(G, 14, 11, ['__WWW', '_WWW', 'WWWWWW', '_WWW_', '_WW__', '_W___'].map(r => r.replace(/_/g, '.')));
    vl(G, 10, 14, 13, 'e');
  },
  coupon(G) {
    // ticket com entalhes
    shape(G, (px, py) => {
      if (px < 1 || px > 31 || py < 6 || py > 26) return false;
      const n = (cx, cy) => (px - cx) ** 2 + (py - cy) ** 2 <= 2.6 * 2.6;
      return !(n(22, 6) || n(22, 26) || n(1, 16) || n(31, 16));
    }, (x, y) => (y >= 24 ? 'g' : x >= 23 ? 'w' : 'W'));
    hl(G, 3, 7, 17, 'W');
    // borda picotada coral (esquerda)
    for (let x = 4; x < 19; x += 2) { put(G, x, 8, 'C'); put(G, x, 24, 'C'); }
    for (let y = 8; y <= 24; y += 2) { put(G, 3, y, 'C'); put(G, 19, y, 'C'); }
    // grande %
    el(G, 8, 12.5, 2.7, 2.7, 'C'); el(G, 8, 12.5, 1.3, 1.3, 'P'); el(G, 14.5, 19.5, 2.7, 2.7, 'C'); el(G, 14.5, 19.5, 1.3, 1.3, 'P');
    poly(G, [[15.5, 9.2], [17.6, 10.2], [7, 22.8], [4.9, 21.8]], (x, y) => 'C');
    el(G, 8, 12.5, 2.7, 2.7, (x, y) => (x * 0 + y > 13 ? 'c' : 'C')); el(G, 8, 12.5, 1.3, 1.3, 'P'); el(G, 14.5, 19.5, 1.3, 1.3, 'P');
    // picote
    for (let y = 10; y <= 22; y += 2) put(G, 22, y, 'K');
    // canhoto: código de barras
    for (const x of [24, 26, 28]) vl(G, x, 11, 8, 'K');
    hl(G, 24, 20, 6, 'G'); hl(G, 24, 22, 4, 'G');
    hl(G, 9, 8, 6, 'g');
  },
  fone(G) {
    // arco
    const cx = 15.5, cy = 15;
    shape(G, (px, py) => { const d = Math.hypot(px - cx, py - cy); return py <= cy + 2 && d <= 13.2 && d >= 9.8 && !(py > cy && Math.abs(px - cx) < 9.5); }, (x, y) => (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) >= 12.2 ? 'D' : Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= 10.8 ? 'q' : 'd'));
    shape(G, (px, py) => { const d = Math.hypot(px - cx, py - cy); return py <= cy - 5 && d <= 12.8 && d >= 11.4; }, (x, y) => (x < 15 ? 'm' : 'd'));
    // almofada do topo
    rr(G, 9, 1.8, 14, 3.4, 1.6, 'D'); hl(G, 10, 2, 8, 'n');
    // hastes
    rc(G, 3, 13, 3, 4, 'M'); rc(G, 3, 13, 1, 4, 'W'); rc(G, 26, 13, 3, 4, 'n');
    // conchas coral
    const cup = (x0, side) => {
      rr(G, x0, 16, 7.2, 12.5, 3, (x, y) => { const lx = side < 0 ? x - x0 : 6 - (x - x0); return y >= 26 ? 'c' : lx <= 1 ? 'o' : lx >= 5 ? 'c' : 'C'; });
      rr(G, side < 0 ? x0 + 6.4 : x0 - 3.2, 18, 3.8, 9, 1.6, (x, y) => (y <= 19 ? 'd' : 'q'));
      hl(G, x0 + 1.5, 18, 2, 'o'); vl(G, x0 + 1, 19, 6, 'o');
    };
    cup(1.8, -1); cup(23, 1);
    el(G, 5.4, 22, 1.2, 1.2, 'c'); el(G, 26.6, 22, 1.2, 1.2, 'c');
  },
};

const ORDER = ['mouse', 'fryer', 'shoe', 'whey', 'diaper', 'pad', 'pot', 'shirt', 'coupon', 'fone'];
const SPR = {};
for (const n of ORDER) { const G = mkGrid(); DRAW[n](G); SPR[n] = G.map((r) => r.join('')); } // 32 strings de 32 chars
const SP = {};
function buildSprite(rows) {
  const N = 34, mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; };
  const base = mk(), bg = base.getContext('2d'), fillm = new Uint8Array(N * N);
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { bg.fillStyle = PAL[ch] || '#f0f'; bg.fillRect(x + 1, y + 1, 1, 1); fillm[(y + 1) * N + x + 1] = 1; } }));
  const fill = (x, y) => x >= 0 && y >= 0 && x < N && y < N && fillm[y * N + x];
  const edge = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!fill(x, y) && (fill(x - 1, y) || fill(x + 1, y) || fill(x, y - 1) || fill(x, y + 1))) edge.push([x, y]);
  const tint = (body, line) => {
    const c = mk(), x = c.getContext('2d');
    if (body) { x.fillStyle = body; for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) if (fill(xx, yy)) x.fillRect(xx, yy, 1, 1); } else x.drawImage(base, 0, 0);
    x.fillStyle = line; for (const [xx, yy] of edge) x.fillRect(xx, yy, 1, 1); return c;
  };
  const colorC = tint(null, INK);
  const gray = mk(), gx = gray.getContext('2d'); gx.filter = 'grayscale(1) brightness(1.55) contrast(0.55)'; gx.drawImage(colorC, 0, 0);
  return { color: colorC, gray, ink: tint(INK, INK), inv: tint('#2A2D2A', '#FFFFFF') };
}
// spr: cell = px de tela por pixel do sprite. sprFit: largura total em px (independe da resolução do sprite; USE ESTE nas cenas).
function spr(name, kind, cx, cy, cell, rot = 0, alpha = 1) {
  if (alpha <= 0.003 || cell <= 0.1) return;
  const c = SP[name][kind], N = c.width;
  g.save(); g.translate(cx, cy); g.rotate(rot); g.globalAlpha *= alpha; g.imageSmoothingEnabled = false;
  g.drawImage(c, -N / 2 * cell, -N / 2 * cell, N * cell, N * cell); g.restore();
}
function sprFit(name, kind, cx, cy, px, rot = 0, alpha = 1) { spr(name, kind, cx, cy, px / SP[name][kind].width, rot, alpha); }
function initSprites() { for (const n of ORDER) SP[n] = buildSprite(SPR[n]); }
