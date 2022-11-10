import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from "@discordjs/voice";
import {
  Client,
  GatewayIntentBits,
  Guild,
  VoiceBasedChannel,
  VoiceState,
} from "discord.js";
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
import * as settings from "./bot-settings.json";
import path from "path";

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
  client.user?.setStatus("invisible");
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  const newChannel = newState.channel;
  if (oldState.member?.user.bot || newState.member?.user.bot) {
    return;
  } else if (newChannel?.joinable || newChannel?.viewable) {
    if (!newState.guild.members.me?.voice.channel) {
      joinRandomChannel(newState.guild);
    }
    // New User in same channel
    if (
      isChannel(newChannel?.id, newState) &&
      newState.member !== newState.guild.members.me
    ) {
      const randomTime = Math.floor(Math.random() * (1000 - 1 + 1) + 1);
      await sleep(randomTime);
      let resource = createAudioResource(
        path.join(__dirname, "../audio/boo.mp3")
      );
      const player = createAudioPlayer();
      const connection = joinVoiceChannel({
        channelId: newChannel.id,
        guildId: newChannel.guild.id,
        adapterCreator: newChannel.guild.voiceAdapterCreator,
      });
      connection.subscribe(player);
      player.play(resource);
      await sleep(1350);
      joinRandomChannel(newChannel.guild);
    }
  }
});

function isChannel(channel?: string, state?: VoiceState) {
  return Boolean(channel === state?.guild.members.me?.voice.channel?.id);
}

client.once("ready", () => {
  client.guilds.cache.forEach((guild) => {
    joinRandomChannel(guild);
  });
});

client.on("guildCreate", async (guild) => {
  joinRandomChannel(guild);
});

client.login(settings.bot.token);

function joinRandomChannel(guild: Guild) {
  let vc: VoiceBasedChannel[] = [];
  guild.members.me?.guild.channels.cache.forEach((channel) => {
    if (
      channel.isVoiceBased() &&
      channel.members.size == 0 &&
      channel.joinable &&
      channel.viewable
    ) {
      if (channel.userLimit == 0 || channel.userLimit > 1) vc.push(channel);
    }
  });
  if (vc.length === 0) {
    const channel = guild.members.me?.voice.channel?.id
      ? guild.members.me?.voice.channel?.id
      : "";
    disconnect(channel, guild);
  } else {
    let tempChannel = vc[Math.floor(Math.random() * vc.length)];
    joinVoiceChannel({
      channelId: tempChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });
    if (guild.members.me?.voice.selfMute) {
      while (guild.members.me?.voice.selfMute) {
        const channel = guild.members.me?.voice.channel?.id
          ? guild.members.me?.voice.channel?.id
          : "";
        disconnect(channel, guild);
        let tempChannel = vc[Math.floor(Math.random() * vc.length)];
        joinVoiceChannel({
          channelId: tempChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });
      }
    }
  }
}

function disconnect(channel: string, guild: Guild) {
  const connection = joinVoiceChannel({
    channelId: channel,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });
  connection.disconnect();
}

const sleep = async (milliseconds: number) => {
  await new Promise((resolve) => {
    return setTimeout(resolve, milliseconds);
  });
};

client.on("error", () => {});
