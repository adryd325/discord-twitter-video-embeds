const { BitField } = require("discord.js");

class PlatformFlags extends BitField {}

PlatformFlags.Flags = {
  TWITTER: 1,
  TIKTOK: 1 << 1,
  REDDIT: 1 << 2,
  INSTAGRAM_FACEBOOK: 1 << 3
};

module.exports = PlatformFlags;
