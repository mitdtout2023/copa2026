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
