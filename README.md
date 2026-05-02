# Figurinhas Copa 2026 — Web/PWA

Aplicativo web local para controle de figurinhas do álbum:

- Países do álbum e números 1 a 20.
- Controle de quantidade por figurinha.
- Faltantes automáticas: quantidade 0.
- Repetidas automáticas: quantidade maior que 1.
- Importação por texto, por exemplo: `ARG 1, 4, 7`.
- Integração opcional com OpenAI/ChatGPT usando uma API Key informada pelo usuário.
- Backup e importação por JSON.
- Funciona como PWA: pode ser adicionado à Tela de Início do iPhone.

## Como usar localmente no iPhone

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

## Segurança da API Key

A chave da OpenAI é usada apenas quando você toca em "Analisar com ChatGPT". Em uma publicação pública, não coloque a chave no código. Digite a chave no campo do app ou use um backend/proxy.

## Formato aceito no importador local

Exemplos:

```txt
ARG 1, 4, 7, 8, 11, 17, 20
BRA 18
AUS 8, AUS 13, AUS 13
```

Quando a mesma figurinha aparece duas vezes, o app entende como repetida.
