# Catálogo de efeitos (aprovado num vídeo de produto de 24 s, 5 cenas)

Origem: estudo denso (5 quadros/s) do vídeo de lançamento no X "how do you communicate that you're going through a change?" (pixel art + tipografia + silhueta térmica), adaptado a um produto cuja marca é uma gota. Aprovado em preview 480p. Ponto de partida: `templates/scenes/cena-modelo.js` + `core.js` + `sprites.js`.

## A lição principal: a FRASE é o fio narrativo
Um vídeo de motion que parece "slides" (palavra solta + ícone) é o erro. O vídeo bom escreve **uma frase longa, palavra por palavra**, atravessando várias cenas, e o resto (objetos, tinta, estrela, silhueta) reage a ela.
1. Comece com 2–3 palavras **gigantes** (≈ 300 px, cortadas pela borda) trocando de posição, uma delas com **traço de caneta desenhado** em volta; linhas tracejadas quebram em morse.
2. As mesmas palavras **encolhem** (≈ 34 px) e a frase **continua a escrever** até o fim, com rabiscos, círculo desenhado em volta de uma palavra-chave, acentinhos sobre palavras.
3. A frase é cortada por cenas ("você não ouve." → "você só ouve o que importa.") e termina em UMA palavra por objeto ("o produto." "o preço." "na hora.") e depois na marca.
4. Escreva a frase em pt-BR **antes** da tabela de batidas; ela dita as cenas. Frase curta demais = vídeo de slides.

## Efeitos (nome → como fazer)
- **Whip + desfoque direcional**: objeto entra com `filter: blur()` alto e streaks diagonais finos, escala X comprimida (3D falso), firma com mola ζ≈0,82. Nada fica parado.
- **Foco puxando**: entrada desfocada (blur 20→0) com ghosts de cor (vermelho/roxo) que se fundem.
- **Flash de cor chapada** de 0,25 s no 1º plano (cor da marca) e **cortes de fundo** papel/preto/cor chapada de 0,4–0,5 s, em batida.
- **Traço à mão**: caixa/círculo desenhado por stroke progressivo (`setLineDash` + dashOffset ou amostragem do caminho até p); rabiscos/assinaturas desfocados ao fundo.
- **Estrela côncava gigante**: `quadraticCurveTo` com controle no centro, 4 pontas, cor da marca + borda cromática fina (ciano/branco), varre da esquerda por cima do texto; vinheta escurece quente; **uma palavra acende** (creme) e o resto vai a cinza.
- **Silhueta térmica**: forma da marca (a gota) em degradê térmico (escuro→cor→branco quente no núcleo), borda rugosa tipo recorte (ruído de valor + posterização), **órbita branca** (elipse inclinada de linha que afina nas pontas, passando atrás e à frente), poeira de pontos, ondas concêntricas em batida; fundo escuro→malva/musgo→papel enquanto a forma vira cinza posterizado.
- **Anel-corrente de sprites grandes (≈ 250 px) sobrepostos**: elipse inclinada, ordem por profundidade (frente maior), trilhas de cor da marca, ponto de spray preto no centro que respira, contador mono subindo.
- **Acende e vira tinta**: flash da cor da marca + estilhaços de pixel, depois silhueta `ink` com blur, spatter (pontos), escorrido, **pincelada preta** em arco (várias, com thud). Colapso do anel em linha + riscos horizontais + zoom num objeto que fica ENORME.
- **Fita diagonal** de cor da marca (130 px, grão) cortando o quadro, objeto girando em 3D por cima; palavra-chave pequena creme ao lado + caret.
- **Espirais/rabiscos brancos** em volta do objeto, popups de pixel (moedas, %), órbita de linha, relógio mono.
- **Objetos se espalham**: sprites flutuando em papel, alguns `ink` (silhueta preta), alguns `inv` (cinza com contorno branco), ponto de spray no centro.
- **Palavra final espaçada** (`m   a   r   c   a`) com um sprite no vão a cada corte (≈ 0,5 s) e fundo trocando; depois **letras soltas giram com laço** (laço = polilinha do caminho amostrado em t−k·δ, lima 9 px + fio de tinta 1,8 px) e se montam; wordmark + ícone, a **gota é o único quique** do filme, URL mono, **volta ao papel tracejado = quadro 0 (loop)**.
- **Textura**: grão (padrão 256², reposicionado por `floor(t*24) % (24*duração)` para o loop fechar), vinheta por cena. Sem glow em UI.

## Pixel art (sprites.js)
- **32×32**, contorno preto automático, 3 tons (luz/base/sombra) + brilho pontual, formas reconhecíveis do nicho do produto. Variantes: `color`, `gray` (dessaturada clara), `ink` (silhueta toda tinta), `inv` (cinza escuro com contorno branco). Mesmo tamanho de canvas em todas.
- Use `sprFit(name, kind, cx, cy, larguraPx, rot, alpha)` (independe da resolução do sprite).
- Defeitos que apareceram: objetos de forma achatada (fralda) e conteúdo ambíguo (comida na air fryer) não leem bem; teste cada sprite a 300 px antes de usar.

## Armadilhas de implementação
- `sprites.js` e `core.js` definem nomes globais (`rr`, `text`, `word`…): helpers de cena sempre com prefixo (`s3…`), nunca redefina os globais (um agente quebrou `iconSq` assim).
- `ink` em sprites quadrados vira bloco preto: aplique blur 3–8 px + spatter, e prefira máscara por contorno em objetos grandes.
- Estrela e sprites competem pelo mesmo canto: reserve a região do texto.
- Pontos de contato entre cenas (handoff) devem ser **especificados em pixels** no briefing (fundo, posição, tamanho, rotação, fita) e conferidos no quadro t−0,01 / t.
