const { Client, Intents } = require("discord.js");

module.exports = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_WEBHOOKS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES
  ],
  allowedMentions: {
    parse: [],
    repliedUser: false
  },
  partials: ["MESSAGE", "CHANNEL", "USER", "REACTION"],
  http: {
    api: "https://canary.discord.com/api"
  }
});
