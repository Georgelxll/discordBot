const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection
} = require("@discordjs/voice");
const ytdl = require("@distube/ytdl-core");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const players = new Map();
const filaMap = new Map();

client.once("ready", () => {
  console.log(`✅ Bot logado como ${client.user.tag}`);
});

client.on("guildCreate", async (guild) => {
  const embed = new EmbedBuilder()
    .setTitle("🎉 Olá! Obrigado por me adicionar!")
    .setDescription("Aqui estão os comandos disponíveis para usar o bot de música:")
    .addFields(
      { name: "!play <link_do_youtube>", value: "▶️ Toca uma música a partir do link do YouTube." },
      { name: "!fila", value: "📃 Mostra a fila de músicas." },
      { name: "!skip", value: "⏭️ Pula a música atual." },
      { name: "!pause", value: "⏸️ Pausa a música atual." },
      { name: "!resume", value: "▶️ Retoma a música pausada." },
      { name: "!stop", value: "⏹️ Para a música e remove o bot do canal de voz." },
      { name: "!nowplaying", value: "🎧 Mostra a música que está tocando agora." },
      { name: "!codLista", value: "📋 Lista todos os comandos do bot." }
    )
    .setColor("Blue")
    .setFooter({ text: "Bot de Música by George" });

  try {
    const defaultChannel = guild.channels.cache
      .filter(channel => channel.isTextBased() && channel.permissionsFor(guild.members.me).has("SendMessages"))
      .sort((a, b) => a.position - b.position)
      .first();

    if (defaultChannel) {
      defaultChannel.send({ embeds: [embed] });
    } else {
      console.warn(`❌ Não foi possível encontrar um canal com permissão para enviar mensagens em ${guild.name}.`);
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem de boas-vindas:", error);
  }
});

async function playNext(guildId, message) {
  const queue = filaMap.get(guildId);
  if (!queue || queue.length === 0) {
    const info = players.get(guildId);
    if (info) info.connection.destroy();
    players.delete(guildId);
    return;
  }

  const next = queue.shift();
  try {
    const stream = ytdl(next.url, { filter: "audioonly", highWaterMark: 1 << 25 });
    const resource = createAudioResource(stream);
    const player = createAudioPlayer();

    const connection = joinVoiceChannel({
      channelId: next.voiceChannel.id,
      guildId: guildId,
      adapterCreator: next.voiceChannel.guild.voiceAdapterCreator
    });

    connection.subscribe(player);
    players.set(guildId, { player, connection, current: next });
    player.play(resource);

    player.on(AudioPlayerStatus.Idle, () => {
      playNext(guildId, message);
    });

    player.on("error", (err) => {
      console.error("Erro no player:", err);
      message.channel.send("❌ Erro ao tocar música.");
      playNext(guildId, message);
    });

    const embed = new EmbedBuilder()
      .setTitle("🎵 Tocando agora:")
      .setDescription(`[${next.title}](${next.url})`)
      .setColor("Green");

    message.channel.send({ embeds: [embed] });

  } catch (err) {
    console.error("Erro ao tocar:", err);
    message.channel.send("❌ Erro ao iniciar a próxima música.");
    playNext(guildId, message); // Tenta próxima
  }
}

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  const content = message.content.trim();

  // !play <url>
  if (content.startsWith(config.prefix)) {
    const args = content.slice(config.prefix.length).trim().split(" ");
    const url = args[0];
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel)
      return message.reply("⚠️ Você precisa estar em um canal de voz!");
    if (!url || !ytdl.validateURL(url))
      return message.reply("❌ Link inválido do YouTube.");

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;

    if (!filaMap.has(message.guild.id)) {
      filaMap.set(message.guild.id, []);
    }

    const queue = filaMap.get(message.guild.id);
    queue.push({ url, voiceChannel, title });

    if (!players.has(message.guild.id)) {
      playNext(message.guild.id, message);
    } else {
      const embed = new EmbedBuilder()
        .setTitle("🎶 Adicionado à fila")
        .setDescription(`[${title}](${url})`)
        .setColor("Blue");
      message.channel.send({ embeds: [embed] });
    }
  }

  // !fila
  else if (content === "!fila") {
    const fila = filaMap.get(message.guild.id);
    if (!fila || fila.length === 0) {
      return message.reply("📭 A fila está vazia.");
    }

    const current = players.get(message.guild.id)?.current;
    let desc = current ? `▶️ Tocando agora: **${current.title}**\n\n` : "";
    desc += queue.map((q, i) => `${i + 1}. ${q.title}`).join("\n");

    const embed = new EmbedBuilder()
      .setTitle("📜 Fila de músicas")
      .setDescription(desc)
      .setColor("Orange");

    message.channel.send({ embeds: [embed] });
  }

  // !nowplaying
  else if (content === "!nowplaying") {
    const playing = players.get(message.guild.id)?.current;
    if (!playing) return message.reply("🔇 Nenhuma música está tocando agora.");
    const embed = new EmbedBuilder()
      .setTitle("🎧 Tocando agora")
      .setDescription(`[${playing.title}](${playing.url})`)
      .setColor("Purple");

    message.channel.send({ embeds: [embed] });
  }

  // !skip
  else if (content === "!skip") {
    const player = players.get(message.guild.id)?.player;
    if (!player) return message.reply("❌ Nenhuma música tocando.");
    player.stop(); // O evento 'Idle' cuidará de tocar a próxima
    message.reply("⏭️ Música pulada!");
  }

  // !pause
  else if (content === "!pause") {
    const info = players.get(message.guild.id);
    if (info?.player) {
      info.player.pause();
      message.reply("⏸️ Música pausada.");
    } else {
      message.reply("❌ Nenhuma música tocando.");
    }
  }

  // !resume
  else if (content === "!resume") {
    const info = players.get(message.guild.id);
    if (info?.player) {
      info.player.unpause();
      message.reply("▶️ Música retomada.");
    } else {
      message.reply("❌ Nenhuma música para retomar.");
    }
  }

  // !stop
  else if (content === "!stop") {
    const info = players.get(message.guild.id);
    if (info) {
      info.player.stop();
      info.connection.destroy();
      players.delete(message.guild.id);
      filaMap.delete(message.guild.id);
      message.reply("⏹️ Bot parou e saiu do canal de voz.");
    }
    else {
      message.reply("❌ Nenhuma música tocando.");
    }
  }

  // !codLista
  else if (content === "!codLista") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Lista de Comandos do Bot de Música")
      .setDescription("Veja abaixo todos os comandos disponíveis:")
      .addFields(
        { name: "!play <link_do_youtube>", value: "▶️ Toca uma música a partir do link do YouTube." },
        { name: "!queue", value: "📃 Mostra a fila de músicas." },
        { name: "!skip", value: "⏭️ Pula a música atual." },
        { name: "!pause", value: "⏸️ Pausa a música atual." },
        { name: "!resume", value: "▶️ Retoma a música pausada." },
        { name: "!stop", value: "⏹️ Para a música e remove o bot do canal de voz." },
        { name: "!nowplaying", value: "🎧 Mostra a música que está tocando agora." },
        { name: "!codLista", value: "📋 Lista todos os comandos do bot." }
      )
      .setColor("Blue")
      .setFooter({ text: "Bot de Música by George" });

    message.channel.send({ embeds: [embed] });
  }
});

client.login(config.token);
