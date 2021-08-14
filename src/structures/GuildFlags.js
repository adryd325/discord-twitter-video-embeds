const { BitField } = require("discord.js");

class GuildFlags extends BitField {}

GuildFlags.FLAGS = {
  FOLLOW_QRT: 1 << 0,
  PARSE_TWITFIX: 1 << 1 // for cyn
};

module.exports = GuildFlags;
