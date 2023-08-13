const { Client, GatewayIntentBits, Partials } = require("discord.js");

module.exports = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  allowedMentions: {
    parse: [],
    repliedUser: false
  },
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.Reaction]
});
