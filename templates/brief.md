# Briefing de diretor (preencha e passe ao Claude, ou deixe a skill preencher)

<entradas>
Produto: <nome> (<url>). Use como frase do produto o título principal do site.
Pegue o logo real, as cores da marca, as fontes e as capturas de interface do site com Playwright (brand.mjs). Escolha uma cor de destaque da marca.
Música e SFX: sintetizados em código a <120> BPM. Voz: <sim/não>.
Formato: 16:9 horizontal (PC), 1920x1080 lógico, final em 4K. Duração: <16> s.
Referência (opcional): <link/arquivo>. Use só a gramática (ritmo, transição, tipografia), nunca o conteúdo.
</entradas>

<direcao>
<escolha em directions.md e descreva em 4-6 frases: emoção, ritmo, movimento, paleta, o que é proibido>
</direcao>

<estrutura>
<120> BPM, <8> compassos, algo acontece em toda batida.
<estado 1> → <estado 2> → ... → logo.
</estrutura>

<construcao>
1 arquivo HTML, 1 canvas, window.seek(t). Sem transições CSS, timers ou estado carregado.
Molas em forma fechada (um valor com vários alvos = soma de uma mola por mudança).
Texto dentro de contêiner que se transforma entra depois que a transformação começa e sai antes da próxima.
Grade de batidas = beats.json do audio.py. Começa num tempo forte.
Render: scripts/render.mjs. Preview 480p para validar; final 4K, 60 fps, 4 subquadros (motion blur). Layout próprio por orientação.
</construcao>

<pegadinhas>
Nunca will-change em nada que a câmera aproxima (o texto fica borrado).
O último quadro tem que ser igual ao primeiro, incluindo a posição e a velocidade do cursor.
Nunca redesenhar a interface do produto de imaginação.
</pegadinhas>

<comeco>
Me mostra a lista de estados na grade de batidas, em tabela, antes de escrever código.
Quando eu aprovar a tabela, mostra o preview 480p. Quando eu validar o preview, renderiza o final 4K em resultados/NN-nome-16x9.mp4.
</comeco>
