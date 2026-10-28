# motion-studio

Skill para o [Claude Code](https://claude.com/claude-code) que faz motion graphics e vídeos de produto/lançamento **em código**. O Claude não gera vídeo: ele escreve um programa (um `film.html` com canvas e `window.seek(t)`) e o programa vira vídeo, quadro a quadro.

O prompt é uma parte pequena do resultado. O resto é método:

- **Referência vira gramática.** O vídeo de referência é baixado e estudado em folhas de quadros densas; dele sai um guia de estilo (paleta, tipografia, ritmo, transições), nunca o conteúdo.
- **Marca real do site.** `brand.mjs` captura telas, logo, cores, fontes e textos do site do produto com Playwright. A interface não é redesenhada de imaginação.
- **Tabela de batidas.** Antes de qualquer código, cada estado do filme é posto numa grade de BPM e compassos, com o som de cada momento.
- **Som no BPM.** Trilha e efeitos sonoros são sintetizados em código no BPM da tabela, então os hits caem exatos. Voz gravada (opcional) vira o relógio do filme.
- **Render 4K quadro a quadro** com Playwright + ffmpeg: 3840x2160, 60 fps, motion blur por subquadros. Preview em 480p para iterar barato.
- **Loop de crítica.** O Claude renderiza folhas de contato, dá notas por critério (gancho, legibilidade no celular, movimento, marca, som...) e corrige os piores problemas antes de mostrar qualquer coisa.

## Para quem

Quem faz conteúdo, produto ou marketing e quer vídeos de lançamento, explainers e criativos animados sem abrir um editor de vídeo, e topa iterar conversando com o Claude.

## Requisitos

- [Claude Code](https://claude.com/claude-code)
- ffmpeg
- Node.js 20+
- Python 3
- Playwright com Chromium (o `setup.sh` instala)
- Opcional: GPU NVIDIA, usada com `--gpu` no render (WebGL na GPU)

## Instalação

```bash
git clone https://github.com/SammyFerreiraa/motion-studio ~/.claude/skills/motion-studio
bash ~/.claude/skills/motion-studio/scripts/setup.sh        # --voice para sincronizar voz gravada
```

Depois abra o Claude Code numa pasta de trabalho e peça:

> faz um motion do meu produto com essa referência <url>

## Como funciona

O fluxo para nos pontos marcados com ⛔ e espera sua aprovação. Assim o que é barato (texto, tabela, preview) é decidido antes do que é caro (render 4K).

1. **Intake**: produto, URL, emoção, duração, BPM, voz, referência. O filme vira uma linha.
2. **Referência**: download, folhas de quadros, `guia-estilo.md` e `planos.md`. ⛔ Sem referência, o Claude sugere três. ⛔
3. **Marca real**: captura do site, `marca.md` com cor de destaque e componentes reais.
4. **Tabela de batidas** com contêineres e efeitos sonoros por tempo. ⛔
5. **Voz** (opcional): roteiro, você grava, a fala é transcrita palavra a palavra e a tabela se reajusta a ela. ⛔
6. **Código**: `film.html` monolítico, ou cenas separadas feitas por subagentes em paralelo para vídeos maiores.
7. **Som**: trilha + SFX no BPM, mixados a -14 LUFS.
8. **Crítica**: folhas, notas, correções, checagens (fantasmas de blur, leitura no celular, loop, determinismo) e preview 480p. ⛔ Você valida o preview.
9. **Render final 4K**, conferido com ffprobe e quadro a quadro.
10. **Memória da marca**: `marcas/<slug>/marca.md` para o próximo vídeo partir daí.

## Estrutura

```
SKILL.md          o método completo (o que o Claude lê)
rules.md          contrato de render, proibidos, som, loop de crítica
directions.md     direções de estilo para escolher
effects.md        catálogo de efeitos e a lição "a frase é o fio narrativo"
agentes.md        vídeo em cenas, uma por subagente
prompts.md        prompts prontos do método
scripts/
  setup.sh        instala dependências (venv, Playwright)
  render.mjs      renderiza film.html em MP4 ou folha de contato
  brand.mjs       captura a marca de um site
  ref.sh          baixa e fatia a referência; ref-dense.sh para 5 quadros/s
  audio.py        trilha + SFX no BPM; events.mjs extrai os eventos do filme
  voice_sync.py   timestamps por palavra da voz gravada
  checks.sh       checagens de qualidade do vídeo renderizado
templates/
  film.html       filme monolítico de exemplo
  scenes/         core.js, sprites.js, film-scenes.html, cena-modelo.js
  brief.md  brand.md  events.example.json  progresso.sh
```

Cada vídeo vive na sua pasta `videos/NN-nome/` (ignorada pelo git).

## Avisos

- **Render é caro.** O 4K leva da ordem de 30 a 50 s de máquina por segundo de vídeo. Por isso o fluxo itera em preview 480p e só renderiza o final depois da sua validação.
- **Memória.** Cada aba do Chromium em 4K usa cerca de 2 GB. O `render.mjs` escolhe o número de abas pela memória livre; feche apps pesados antes do render final. Em máquinas de 16 GB, use `--jobs 1` se travar.
- **Referência é só gramática.** A skill estuda ritmo, transições e tipografia da referência e nunca copia texto, personagens, logos, cenas ou música de terceiros. Os direitos do vídeo de referência continuam sendo de quem fez.
- Saída padrão: 16:9 horizontal. 9:16 é possível, mas precisa de layout próprio.

## Créditos

Método inspirado nos vídeos de motion graphics com Claude de Felipe Borges e Lukas Margerie.

## Licença

MIT. Veja [LICENSE](LICENSE).

Autor: Sammy Ferreira ([@caixadaia](https://instagram.com/caixadaia))

---

## English

**motion-studio** is a [Claude Code](https://claude.com/claude-code) skill for making motion graphics and product/launch videos **in code**. Claude does not generate video: it writes a program (a canvas `film.html` exposing `window.seek(t)`) and the program is rendered into video frame by frame.

The method: a reference video is studied for its *grammar* (pacing, transitions, typography), never its content; the real brand is captured from the product's website with Playwright; every state is planned on a beat grid (BPM and bars) before any code; music and sound effects are synthesized in code on that BPM; the film renders to 4K 60 fps with motion blur via Playwright + ffmpeg; and Claude critiques its own contact sheets with scores before showing you anything. The flow stops at approval gates (⛔) so cheap decisions happen before expensive renders. The skill's instructions are written in Portuguese.

**Requirements:** Claude Code, ffmpeg, Node.js 20+, Python 3, Playwright/Chromium (installed by `setup.sh`). Optional NVIDIA GPU via `--gpu`.

**Install:**

```bash
git clone https://github.com/SammyFerreiraa/motion-studio ~/.claude/skills/motion-studio
bash ~/.claude/skills/motion-studio/scripts/setup.sh
```

Then open Claude Code and ask: "make a motion video of my product with this reference <url>".

**Caveats:** 4K rendering is slow and memory-hungry (~2 GB per Chromium tab); iterate on the 480p preview. Reference videos are used for grammar only; never copy third-party content.

License: MIT. Author: Sammy Ferreira (@caixadaia).
