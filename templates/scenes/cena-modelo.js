// scenes/sN-nome.js — uma cena. Dono: um agente. Só edite este arquivo.
// Contrato: função pura do tempo; t é GLOBAL. draw pinta o fundo inteiro e chama texture() no fim.
// Helpers próprios com prefixo (sN...), nunca sobrescreva nomes de core.js/sprites.js (ex.: rr, text, word).
SCENES.push({
  id: 'sN', t0: 0, t1: 4,
  init() {},
  draw(t) {
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    // ... efeitos do catálogo (effects.md); sprites: sprFit('mouse','color',cx,cy,largura,rot,alpha)
    texture(t, 'rgba(70,58,38,0.2)');
  },
  sfx: [{ t: 0, sfx: 'tick' }],
});
