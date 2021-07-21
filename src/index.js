import { Client, Intents } from "discord.js";

const discord = new Client({
  ws: {
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_WEBHOOKS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ],
  },
  disableMentions: "all",
});
