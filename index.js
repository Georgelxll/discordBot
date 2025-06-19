const { Client, GatewayIntentBits } = require("discord.js");
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

client.once("ready", () => {
  console.log(`✅ Bot logado como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  const content = message.content.trim();

  // !onPlay
  if (content.startsWith(config.prefix)) {
    const args = content.slice(config.prefix.length).trim().split(" ");
    const url = args[0];
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel)
      return message.reply("⚠️ Você precisa estar em um canal de voz!");
    if (!url || !ytdl.validateURL(url))
      return message.reply("❌ Link inválido do YouTube.");

    try {
      const stream = ytdl(url, { filter: "audioonly", highWaterMark: 1 << 25 });
      const resource = createAudioResource(stream);
      const player = createAudioPlayer();

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
      });

      connection.subscribe(player);
      players.set(message.guild.id, { player, connection });
      player.play(resource);

      player.on(AudioPlayerStatus.Playing, () => {
        message.reply("🎵 Tocando música!");
      });

      player.on("error", (err) => {
        console.error("Erro ao tocar:", err);
        message.reply("❌ Erro ao tocar música.");
      });

    } catch (err) {
      console.error("Erro ao criar stream:", err);
      message.reply("❌ Não consegui tocar a música.");
    }
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
      message.reply("⏹️ Bot parou e saiu do canal de voz.");
    } else {
      message.reply("❌ Nenhuma música tocando.");
    }
  }
});

client.login(config.token);
