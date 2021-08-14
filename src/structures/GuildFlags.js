const { BitField } = require("discord.js");

class GuildFlags extends BitField {}

GuildFlags.FLAGS = {
  PARSE_TWITFIX: 1 << 1 // for cyn
};

module.exports = GuildFlags;
