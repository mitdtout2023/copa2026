# Figurinhas Copa 2026 — Web/PWA

Aplicativo web local para controle de figurinhas do álbum.

## Funcionalidades

- Países do álbum e números 1 a 20.
- Controle de quantidade por figurinha.
- Na aba Álbum, tocar em uma figurinha sempre soma +1. Se ela já existir, ela vira repetida ou aumenta a repetida.
- A remoção de repetidas acontece somente na aba Repetidas, tocando na repetida desejada.
- Faltantes automáticas: quantidade 0.
- Repetidas automáticas: quantidade maior que 1.
- Importação por texto, por exemplo: `BRA 12`, `ARG 1, 4, 7` ou `AUS 8, AUS 13, AUS 13`.
- Leitura de foto com OpenAI/ChatGPT usando uma API Key informada pelo usuário.
- Ao ler uma foto, o app compara cada código identificado com o álbum atual:
  - se ainda não tem, adiciona;
  - se já tem 1, vira repetida;
  - se já era repetida, aumenta a quantidade.
- Atualização automática opcional após a leitura.
- Exportação em PDF com quantidade por país, faltantes e repetidas.
- Backup e importação por JSON.
- Funciona como PWA: pode ser adicionado à Tela de Início do iPhone.

## Como usar no iPhone

O iPhone não abre arquivos HTML locais como PWA instalado de forma confiável. Publique a pasta em um serviço estático e abra o link no Safari.

Opções simples:

1. GitHub Pages
2. Netlify Drop
3. Vercel

Depois de publicar:

1. Abra o link no Safari do iPhone.
2. Toque em Compartilhar.
3. Toque em Adicionar à Tela de Início.
4. Abra o ícone criado.

## Como marcar e remover repetidas

- Na aba **Álbum**, toque em uma figurinha para adicionar +1.
- Se a quantidade passar de 1, ela aparece automaticamente como repetida.
- Na aba **Repetidas**, toque na repetida para remover apenas uma cópia extra.
- O app nunca remove a figurinha principal do álbum pela tela de repetidas; ele reduz a quantidade até 1.

## Como ler foto e atualizar o álbum

1. Vá para a aba **ChatGPT / IA**.
2. Informe sua **OpenAI API Key**.
3. Toque em **Foto das figurinhas** e tire/envie a foto.
4. Mantenha marcada a opção **Atualizar álbum automaticamente após a leitura**.
5. Toque em **Ler foto com ChatGPT e atualizar**.

O app vai tentar identificar códigos como `BRA 12`, `ARG 4`, `AUS 13`, verificar a quantidade atual e atualizar o álbum.

## Exportar PDF

1. Vá para **Backup / PDF**.
2. Toque em **Exportar PDF**.
3. O relatório será baixado com:
   - quantidade por país;
   - total físico;
   - repetidas extras;
   - figurinhas faltantes;
   - lista de repetidas.

## Segurança da API Key

A chave da OpenAI é usada apenas quando você toca em **Ler foto com ChatGPT e atualizar**. Em uma publicação pública, não coloque a chave no código. Digite a chave no campo do app ou use um backend/proxy.


## Versão texto apenas
Esta versão remove o envio de foto e a necessidade de OpenAI API Key.

Como usar:
1. Abra a aba **Importar texto**.
2. Cole uma lista como:
   - `BRA 12`
   - `ARG 1, 4, 7`
   - `AUS 8, AUS 13, AUS 13`
3. Toque em **Ler texto e atualizar**.
4. O app atualiza automaticamente:
   - 0 para 1 = figurinha adicionada ao álbum;
   - 1 para 2 = vira repetida;
   - 2 ou mais = aumenta a quantidade repetida.

Também é possível importar um arquivo `.txt`.


## Ajuste para iPhone
- Adicionados ícones Apple Touch em múltiplos tamanhos na raiz do site e na pasta `icons/`.
- Incluídos `apple-touch-icon`, `apple-touch-icon-precomposed` e `favicon` no `index.html`.
- Cache do Service Worker atualizado para forçar o refresh da versão no Safari.


## Busca por país
Na aba **Álbum**, use o campo **Buscar país** para localizar rapidamente pelo código ou nome:
- `BRA` ou `Brasil`
- `ARG` ou `Argentina`
- `USA` ou `Estados Unidos`


## Atualização visual
- Título atualizado para **Copa do mundo 2026**.
- Cores dos status:
  - faltante: vermelho;
  - tenho: verde;
  - repetida: laranja escuro.
- Rodapé atualizado com: **criado por Marcelo Ferreira**.


## Atualização
- Campo **Buscar país** removido da aba Álbum.
- Mantido apenas o seletor de país.


## Correção de cores da legenda
- Ícone **faltante** corrigido para vermelho sólido.
- Ícone **tenho** corrigido para verde sólido.
- Ícone **repetida** corrigido para laranja escuro sólido.


## Atualização de título
- Texto principal do cabeçalho atualizado para **Copa 2026**.
- Metadados do PWA atualizados para **Copa 2026**.


## Atualização: remoção com senha e PDF A4
- Adicionado botão **Remover figurinha** na aba Álbum.
- A remoção exige a senha `talita10`.
- Enquanto o modo remover estiver ativo, tocar em uma figurinha subtrai 1 unidade.
- Remoção de repetidas, limpeza de país e limpeza geral também exigem senha.
- Exportação em PDF atualizada para formato A4.
- PDF contém bandeira, nome do país e figurinhas de 01 a 20, exemplo: `BRA 01` até `BRA 20`.


## Atualização visual
- Removido o card **Repetidas extras** da tela principal.
- Incluído o ícone `apple-touch-icon.png` ao lado do título **Copa 2026**.


## Atualização visual
- Removido o texto “Álbum, faltantes, repetidas e importação por texto.”
- Ícone do app reposicionado no canto superior direito, na linha do título **Copa 2026**.
- Legenda alterada de **tenho** para **Total no álbum**.
- Rodapé atualizado com **Criado por Marcelo Ferreira** e logo M@rstech.


## Correção da contagem por importação
- Corrigida leitura de códigos com zero à esquerda, como `BRA 01`.
- Corrigida importação de arquivo `.txt` para substituir o texto anterior, evitando contagem duplicada.
- Bloqueada reaplicação acidental do mesmo resultado importado.
- Adicionado suporte a formatos como `BRA 12 x2` e `BRA 12 qtd 2`.
- Mantida a contagem correta de duplicadas, por exemplo `AUS 13, AUS 13` soma 2 unidades.


## Atualização: botão Limpar
- Adicionado botão **Limpar** na aba **Importar texto**.
- O botão apaga o texto colado/importado, limpa o resultado analisado e permite colar uma nova lista manualmente.


## Atualização do PDF
- A exportação em PDF agora inclui a coluna **Álbum**.
- Cada país aparece com:
  - bandeira;
  - nome do país;
  - intervalo do álbum, exemplo: `BRA 01 até BRA 20`;
  - figurinhas de 01 a 20 com quantidade e status.


## Correção do PDF em branco
- Substituída a rotina de PDF baseada em canvas/imagem por uma rotina A4 com texto vetorial.
- Mantém bandeira como sigla visual, nome do país e intervalo do álbum, exemplo `BRA 01 ate BRA 20`.
- Mantém células 01 a 20 com quantidade e status por cor.


## Atualização do PDF
- A coluna **Bandeira** agora tenta renderizar o ícone visual da bandeira no PDF.
- Adicionada opção **PDF repetidas** para exportar somente as figurinhas repetidas.
- O PDF de repetidas mostra bandeira, país, figurinha, quantidade total e quantidade extra.


## Correção das bandeiras no PDF
- Substituída a renderização por emoji por bandeiras desenhadas diretamente no canvas.
- A coluna **Bandeira** agora aparece no PDF do álbum e no PDF de repetidas, mesmo quando o navegador não renderiza emojis de bandeira no PDF.


## Atualização dos backups em PDF
- Removida a coluna **Bandeira** dos PDFs.
- O PDF do álbum agora mostra apenas **País**, **Álbum** e **Figurinhas 01 a 20**.
- O PDF de repetidas agora mostra apenas **País**, **Figurinha**, **Quantidade** e **Repetidas extras**.


## Correção definitiva da exportação
- A exportação não gera mais PDF binário diretamente.
- Agora abre um relatório A4 em nova aba e usa a impressão do navegador.
- No iPhone/Safari, escolha compartilhar/imprimir e salve como PDF.
- Isso evita o problema de página branca em exportações via canvas/PDF.


## Atualização Backup / PDF
- Botões de backup compactados para caberem em uma linha no iPhone 17 Pro Max.
- O botão **Relatório álbum** abre a opção de impressão/salvamento do navegador.
- No relatório de repetidas, removida a coluna **Quantidade**.
- Coluna **Repetidas extras** renomeada para **Repetidas**.


## Ajuste no Relatório Repetidas
- Removido o resumo `Tipos repetidos | Repetidas`.
- Removido `Criado por Marcelo Ferreira` do cabeçalho do relatório repetidas.
- Removida a legenda de cores do relatório repetidas.
- Mantido o título, data/hora de geração e a tabela de repetidas.


## Atualização dos relatórios
- O botão **Relatório álbum** agora salva um arquivo de relatório diretamente, sem abrir impressão.
- O botão **Relatório repetidas** agora salva um arquivo de relatório diretamente, sem abrir impressão.
- No relatório álbum, removida a coluna **Álbum**.
- No relatório álbum, removido o item **Tipos repetidos** do resumo.


## Atualização: Ler figurinha por foto
- O botão **Ler figurinha** agora abre câmera/upload de imagem.
- O app tenta identificar códigos como `JPN 10`, `JPN 15`, `BRA 01`.
- Se a figurinha ainda não existir, atualiza o álbum.
- Se já existir, soma como repetida automaticamente.
- Se a leitura automática falhar, o app pede o código manualmente.


## Correção da leitura por foto
- O botão **Ler figurinha** agora usa leitura estrita para fotos.
- Apenas códigos completos como `JPN 10` e `JPN 15` são aceitos.
- Números soltos da imagem, como `2026`, lote, licença ou textos da embalagem, são ignorados.
- Antes de atualizar o álbum, o app mostra uma confirmação com os códigos encontrados.


## Correção da leitura JPN 10 e JPN 15
- O leitor de foto agora faz OCR em múltiplas regiões da imagem.
- Inclui foco em faixa superior, lado direito superior e regiões de código.
- Isso melhora a leitura quando aparecem duas figurinhas parcialmente sobrepostas, como `JPN 10` e `JPN 15`.
- Continua ignorando números soltos que não estejam junto de um código de país.
