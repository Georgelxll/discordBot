
# 🎵 Bot de Música para Discord

Um bot de música simples, poderoso e feito com Discord.js + @discordjs/voice, que permite tocar músicas do YouTube diretamente em canais de voz!

## 🚀 Funcionalidades

- 🔊 Toca músicas diretamente do YouTube
- 🎶 Suporte a fila de músicas
- ⏸️ Pausar e ▶️ retomar a música
- ⏭️ Pular músicas
- 🛑 Parar a música e sair do canal
- 🎧 Ver a música atual com `!nowplaying`
- 📋 Comando `!codLista` mostra todos os comandos disponíveis
- 📬 Envia automaticamente os comandos ao entrar em um novo servidor

---

## 🛠️ Instalação

1. Clone o repositório:

```bash
git clone https://github.com/georgelxll/discordBot.git
cd discordBot
```

2. Instale as dependências:

```bash
npm install
```

3. Crie o arquivo `config.json` com o seguinte conteúdo:

```json
{
  "token": "SEU_TOKEN_DO_BOT",
  "prefix": "!play "
}
```

> ⚠️ O prefixo deve terminar com espaço, pois o comando principal é seguido do link do YouTube.

4. Execute o bot:

```bash
node index.js
```

---

## 💡 Comandos disponíveis

| Comando                        | Descrição                                                |
|-------------------------------|------------------------------------------------------------|
| `!play <link_do_youtube>`     | Toca uma música diretamente do YouTube                    |
| `!fila`                       | Exibe a fila de músicas no servidor                       |
| `!skip`                       | Pula a música atual                                       |
| `!pause`                      | Pausa a música que está tocando                           |
| `!resume`                     | Retoma a música pausada                                   |
| `!stop`                       | Para a música e remove o bot do canal de voz              |
| `!nowplaying`                 | Mostra qual música está tocando no momento                |
| `!codLista`                   | Lista todos os comandos disponíveis                       |

---

## 📦 Dependências

- [discord.js](https://discord.js.org/)
- [@discordjs/voice](https://www.npmjs.com/package/@discordjs/voice)
- [@distube/ytdl-core](https://www.npmjs.com/package/@distube/ytdl-core)

---

## 🧠 Funcionamento

- Ao executar `!play <url>`, a música será tocada no canal de voz atual.
- Novas músicas são enfileiradas automaticamente.
- Quando uma música termina, a próxima da fila é tocada.
- O bot envia automaticamente os comandos disponíveis no primeiro canal de texto acessível ao ser adicionado em um servidor.

---

## 📌 Observações

- O bot precisa de permissões para:
  - Ler e enviar mensagens em canais de texto
  - Conectar e falar em canais de voz

---

## 👤 Autor

**George Dellangelica**

> Desenvolvido com ❤️ para a comunidade do Discord.

---

## 📃 Licença

Este projeto é licenciado sob a [MIT License](LICENSE).
