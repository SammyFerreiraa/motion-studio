# Trabalhar cena por cena com subagentes (aprovado num vídeo de 24 s com 5 cenas)

Quando usar: vídeo ≥ 20 s ou estilo rico (efeitos do `effects.md`). Um `film.html` único vira conflito e raso; arquivos por cena deixam cada agente focar. Vídeo curto/simples: monolito de `templates/film.html`.

## Arquitetura
`templates/scenes/` → copie para `videos/NN/`: `core.js` (helpers, grão, vinheta), `sprites.js` (pixel art), `film-scenes.html` como `film.html` (despacha `SCENES`), `cena-modelo.js` → `scenes/sN-nome.js`. Contrato: `SCENES.push({id,t0,t1,init,draw(t),sfx})`, t global, cada cena pinta o fundo inteiro; `film.html` agrega `sfx` em `window.SFX` (use `events.mjs` → `audio.py`).

## Passo a passo
1. Antes: guia de estilo (a partir de **folhas densas**: `scripts/ref-dense.sh ref.mp4 ref/dense`), frase narrativa, `plano-vN.md` com decisões, tabela de cenas (t0–t1 em batidas), **handoffs em pixels**, contrato técnico e catálogo de efeitos. Salve em `plano-v2.md` (registro).
2. Smoke test: stub de cena renderiza uma folha (`render.mjs film.html --sheet … --times 1`).
3. Spawn em paralelo: 1 agente de sprites (só `sprites.js`) + 1 por cena (só o arquivo da cena). Cada prompt: caminho da pasta, o que ler (`plano-v2.md`, `marca.md`, `core.js`, `sprites.js`, `film.html`, `film.v1` se houver, quais folhas da referência olhar), descrição da gramática da referência **e** a versão do produto com tempos em segundos e 120 BPM, handoffs exatos, nomes válidos de sfx, comando de teste, "≥ 4 rodadas de crítica contra a referência", "NÃO renderize mp4", resposta ≤ 150 palavras com o estado do último quadro.
4. Quando todos voltarem: junte (`SCENES.sort`), folhas de 9 quadros a cada ~0,8 s cobrindo cortes, confira handoffs e quadro 24 = quadro 0, `events.mjs` → `audio.py` → preview 480p.
5. Só então mostre ao usuário. Nota honesta: avaliado em folhas, não assistido.

## Lições operacionais
- Agentes: só `--sheet`, nunca mp4 em paralelo (pouca RAM; load alto faz o Playwright estourar timeout de 30 s: repetir o comando resolve).
- Se a sessão do Claude Code cair, os agentes param: reabra com `SendMessage` pelo `agentId` ("releia seu arquivo e as folhas, continue"). Os arquivos de cena e as folhas em `crit/` preservam o progresso.
- Peça sempre o **estado do último quadro** de cada cena: é o que o orquestrador usa para checar o corte.
- Agentes sem 4 rodadas por sobrecarga: registre quais cenas ficaram com menos rodadas e ofereça mais uma.
