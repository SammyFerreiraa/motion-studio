# Prompts do método (Lukas Margerie, "How to Make Insane Motion Graphics With Opus 5.5")

Origem: vídeo https://www.youtube.com/watch?v=747ZnEtsRbg, que é a fonte do vídeo do Felipe Borges (o dele é uma tradução). Os prompts abaixo foram lidos na tela (artigo do @0xMovez e posts no X) e adaptados ao nosso pipeline: `film.html` + `render.mjs` + `audio.py`, 16:9 em 4K, preview 480p, portões ⛔ do `SKILL.md`. Use como ponto de partida, nunca como substituto dos portões.

## 1. Prompt curto (uma linha) e por que funciona
> "Faz um vídeo de motion graphics dinâmico de 15 s que mostra o motion designer incrível que você é, como um showreel de portfólio. Vai com tudo."

- **"showreel de portfólio"** define um gênero com regras conhecidas.
- **"o motion designer incrível que você é"** dá ao modelo um papel. Ele passa a mostrar técnica em vez de explicar produto.
- **"15 s"**: curto o bastante para terminar numa passada e longo o bastante para 6–8 planos.
- **"vai com tudo"** multiplica o esforço, por cima do esforço alto/máximo.
- **Limite:** sem marca nem referência, sai na "paleta do Claude" (preto e laranja). Serve como teste cru (A/B), não como entrega.

## 2. Prompt de história de produto (5 batidas)
```
Faça um vídeo de motion graphics dinâmico de [DURAÇÃO] s para [PRODUTO] ([URL]), com a energia de um showreel de motion designer. Vá com tudo.

Assets
- Visite o site. Capturas reais (Playwright), logo real, cores e fontes reais. Salve em ./assets e liste o que achou antes de animar.
- Nunca redesenhe a interface de imaginação. Recorte e anime a coisa real.

História (uma batida cada, 2 a 4 segundos)
1. Gancho: o problema em 5 palavras de tipografia cinética enorme: "[...]".
2. O produto aparece: "[frase do site]". A interface se monta peça por peça.
3. Três recursos, cada um como um momento de interface com um cursor fazendo uma ação real: a. [...] b. [...] c. [...]
4. Um número que prova que funciona: [MÉTRICA].
5. Logo + [CTA].

Som
- Música original, 120 BPM, sintetizada em código. Cliques e whooshes de interface na batida.
- (opcional) Voz: um locutor curto e confiante por batida, sincronizado com os cortes; música por baixo.
```
O item 4 só entra com número real. Marca com lista "nunca" (ex.: "sem métrica inventada") troca o item por uma prova visual.

## 3. Pontuar na batida (quando o filme já existe sem som)
```
Pontue o filme na batida.
1. Sintetize uma trilha original de 120 BPM em código, na mesma linha do tempo da imagem. Mínima e limpa, sem pads genéricos.
2. Meça a trilha → beats.json com bpm, batidas, tempos fortes (a cada 4 batidas) e hits.
   Troca de estado cai em batida. Momento grande (logo, CTA) cai em tempo forte. SFX cai em hit.
3. SFX de interface: um click a cada clique do cursor, um whoosh a cada morph de contêiner, um thud no logo.
4. Reajuste a animação ao beats.json, mixe música + SFX, junte no MP4.
```
Aqui isso é `C` → `window.SFX()` → `events.mjs` → `audio.py`. `beats.json` traz `bars` (os tempos fortes). Para mudar o tempo, mude `C`, nunca o áudio.

## 4. Brief de diretor longo (multi-sessão)
Para vídeo grande (≥ 30 s, personagem, várias cenas). Foi a estrutura do vídeo de 12 h do Donald e do template do Movez. Complementa o `templates/brief.md` (formato XML), que segue sendo o padrão para filme de produto.
```
Você é o diretor, animador, designer de som e engenheiro de render de um filme de [DURAÇÃO] feito em código. Trate isto como uma produção em várias sessões. Não corra para o render final.

## O filme em uma linha
[LOGLINE. O que o espectador deve sentir no fim.]  ← toda decisão é checada contra esta linha

## Referências e entradas
- ./ref/ : [vídeo / quadros / banco de imagens]. Pegue a gramática, nunca o conteúdo.
- trilha: [arquivo, use sem mexer e meça as batidas antes | ou sintetize no audio.py]
- APIs/ferramentas: [ex.: Higgsfield, Fish Audio]. Orçamento: [créditos]. Seja econômico.

## Visual
[3–5 linhas: paleta, tipografia, textura, linguagem de câmera. Visuais proibidos.]

## Bíblia de personagem (se houver)
Proporções, paleta tirada de uma folha, expressões, uma trava de identidade que sobrevive a toda troca de estilo.

## Folha de batidas
0:00–0:02  gancho: [a imagem mais forte do filme]
0:02–0:10  [ato 1]
...        uma recompensa visual nova a cada 3–5 s
[FIM]      o último quadro prepara o primeiro (loop)

## Texto na tela
Quando a legenda/letra fica enorme e quando fica discreta, como legenda. A composição deixa espaço para ela.

## Fluxo com portões
1. guia-estilo.md e planos.md (cada plano: quadros, câmera, texto, SFX). Mostre a lista de planos.
2. Stills de cada plano. Folha de contato. Crítica.
3. Animatic em baixa resolução (aqui: preview 480p) com som provisório. Acerte o ritmo antes de polir.
4. Animação completa, passada de polimento, passada de som, render final.
5. Divida o trabalho em subagentes por capítulo. Escreva ANTES um guia de animação comum (aqui: core.js + agentes.md) para todos codarem no mesmo estilo.

## Loop de crítica (cada plano, no mínimo 3 rodadas)
Renderize 3–5 stills, nota 1–10 em: gancho, legibilidade a 360 px de largura, movimento, composição, profundidade, sincronia do som, acabamento. Registre as notas + os 3 maiores problemas em critica.md. Corrija. Repita até tudo ≥ 8.

## Entregas
resultados/NN-nome-16x9.mp4 · crit/loop_check.mp4 · resultados/NN-nome-poster.png · crit/contato.png · README do código
```
O original diz "continue sem esperar se eu não responder em 10 minutos". **Aqui não:** os portões ⛔ do `SKILL.md` valem (o usuário quer aprovar).

## 5. Passada de crítica (depois de cada render)
Rode `scripts/checks.sh <mp4> crit <t_ação_rápida> film.html` e depois:
```
Abra crit/crit-*.png (folha por batida), crit/strip.png e crit/phone.png e olhe de verdade.
Seja um diretor de motion exigente, não um autor orgulhoso.

Nota 1–10: gancho nos 2 primeiros s · legibilidade no celular (360 px) · qualidade do movimento (sem quadro morto)
· variedade (algo novo a cada 2–4 s) · composição · profundidade · marca · sincronia do som · acabamento.

Liste os 3 maiores problemas com timestamp. Procure especificamente: texto que troca sem transição, algo que
desliza linear em vez de ter curva, rótulo de canto e borda de moldura, plano chapado 2D, texto escalado borrado,
batida morta sem nada acontecendo, engasgo/salto, texto na tela por menos tempo do que dá para ler.

Corrija, re-renderize só os segundos afetados (--sheet --times), mostre a folha nova.
```
"O Opus lê imagens: olhar o que renderizou é o hábito que separa os vídeos que viralizam dos 'meio mid'." O curta de aquarela do @mablesjoseph levou 163 chamadas e ~7 h. Iterar é o método, não falha.

## 6. Embalar como skill (o que ele recomenda, e o que já fizemos)
Nome + entradas a coletar (produto + URL, duração, formato, cores/fontes, referência, música: arquivo ou "sintetizar") + pipeline (assets → guia de estilo → batidas → planos na grade ⛔ → film.html → folha → crítica → render → mix a -14 LUFS → entrega + "o que eu melhoraria") + regras duras (só interface real, sem Math.random/timers/transições CSS, proibidos de visual). É esta skill.
