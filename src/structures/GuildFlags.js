const { BitField } = require("discord.js");

class GuildFlags extends BitField {}

GuildFlags.FLAGS = {
  MANUALLY_SET_MODE: 0 << 1, // DB entry was manually made and mode was set to RE_EMBED or VIDEO_REPLY depending on permissions
  PARSE_TWITFIX: 1 << 1, // For Cyn
  TWITTER_ONLY: 1 << 2 // Only parse Twitter links
};

module.exports = GuildFlags;
