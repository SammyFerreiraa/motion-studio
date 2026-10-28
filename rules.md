# Regras do estúdio de motion

Origem: o `CLAUDE.md` mostrado no vídeo do Felipe Borges (parte visível na tela) + as "pegadinhas" do briefing dele, em PT-BR. O original completo é do vídeo do Lukas Margerie (artigo do @0xMovez); os complementos dele estão marcados abaixo e em `prompts.md`. Pode ser copiado para o `CLAUDE.md` de uma pasta de vídeo para valer mesmo sem a skill.

## Contrato de render
- Todo filme é uma função pura do tempo: `window.seek(t)` pinta o quadro `t`. Nada mais.
- Sem CSS transition, `setTimeout`, `requestAnimationFrame`, `Date.now` nem `Math.random` na renderização. Sem estado carregado entre quadros. Aleatoriedade só com semente (`mulberry32`).
- Molas em forma fechada. Um valor com vários alvos = soma de uma mola por mudança (`sv()` do template). Amortecimento ζ≈0,82 (~1% de rebote no máximo).
- Render com `scripts/render.mjs`: preview de desenvolvimento em **480p** (30 fps, sem blur); final em **4K** (2160p, 60 fps, 4 subquadros misturados = motion blur, H.264 `yuv420p`, CRF 16) **só depois que o usuário validar o preview**.
- Desenhe sempre em coordenadas lógicas (1920×1080); a resolução vem de `?res=`. Nada de tamanhos fixos em pixels de saída.
- Fontes e imagens carregadas em `window.READY`; nunca dependa de rede durante o render (salve em `assets/`).
- Primeiro quadro = último quadro, incluindo posição e velocidade do cursor.
- Nunca `will-change` em nada que a câmera aproxima (o texto fica borrado).

## Visual
- **Proibidos por padrão:** título centralizado sobre gradiente; tudo entrando com fade; rótulos de canto e bordas de moldura; brilho (glow) em elementos de interface; explosão de partículas genérica; easing quicando; tempo morto.
- Uma fonte de display, uma de interface. **Uma cor de destaque**, salvo se o briefing disser outra coisa. Fundo neutro e quente é o ponto de partida seguro.
- A cada 2–4 s algo novo acontece na tela; em vídeos com batida, algo acontece em toda batida.
- Um contêiner que nunca corta (estilo filme de produto): cada estado é o mesmo elemento mudando tamanho, raio e preenchimento; o conteúdo troca atrás de um desfoque curto, entrando **depois** que a transformação começa e saindo **antes** da próxima. Um cursor conduz cada mudança.
- **Nunca redesenhe a interface do produto de imaginação.** Recorte e anime capturas reais. Logo, cores e fontes vêm da marca real (`assets/`, `marca.md`).
- Formato: só 16:9 horizontal (PC), 1920×1080 lógico, entregue em 4K. 9:16 só se pedirem.

## Som
- Trilha e SFX são sintetizados em código (`scripts/audio.py`), salvo se uma trilha for fornecida.
- Os hits caem na grade de batidas (`beats.json`); o filme começa num tempo forte.
- Loudness -14 LUFS. Com voz: score e SFX abaixam sob a fala; a voz é a referência temporal.
- Troca de estado em batida; logo/CTA em tempo forte; click em todo clique do cursor, whoosh em todo morph, thud no logo. (Lukas)

## Loop antes de mostrar qualquer coisa
1. Renderize uma folha de contato (um quadro por batida ou a cada 2) e **olhe** para ela.
2. Nota 1–10: gancho nos 2 primeiros segundos, legibilidade em tela de celular, qualidade do movimento, variedade, fidelidade à marca, sincronia do som.
3. Corrija os 3 piores problemas. Repita até todas as notas ≥ 8 (máx. 4 rodadas).
4. Só então o render completo.
5. (Lukas) Também nota: composição, profundidade, acabamento; legibilidade medida a 360 px de largura. Registre os 3 maiores problemas com timestamp. Depois de cada render, `scripts/checks.sh`: tira de 12 quadros numa ação rápida, teste do celular, loop duas vezes seguidas, determinismo (mesmo t, mesmo arquivo).
6. Ritmo antes de polimento: acerte o tempo no preview 480p com som provisório; polimento e passada de som vêm depois.

## Direitos
Referência é para estudar gramática (ritmo, transição, tipografia). Não reproduza conteúdo, personagens, logos, texto ou música de terceiros.

## Aprendizados de um vídeo narrativo aprovado
- Duração padrão de vídeo narrativo: **24 s** (12 compassos a 120 BPM). Quadro 0 = quadro final (papel + tracejado); grão com módulo `24*duração` quadros.
- Sprites 32×32 sombreados; frase longa escrita ao longo do vídeo; cada cena começa e termina em corte seco em batida, a energia vem de whip/desfoque/flash dentro dos 0,3 s do corte.
- Não nomeie helpers de cena com nomes de `core.js`/`sprites.js`.
