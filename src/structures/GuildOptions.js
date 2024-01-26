const { GuildChannel, Guild } = require("discord.js");
const GuildFlags = require("./GuildFlags");
const GuildOptionsDB = require("../database/GuildOptionsDB");
const PlatformFlags = require("./PlatformFlags");

class GuildOptions {
  constructor() {
    this.db = GuildOptionsDB;
  }

  _validateChannel(channel) {
    if (channel.isText() && channel instanceof GuildChannel) return true;
    return false;
  }

  _validateGuild(guild) {
    if (guild instanceof Guild) return true;
    return false;
  }

  async getOptions(guildID) {
    const dbEntry = await this.db.findOne({ where: { guildID } });
    if (dbEntry) {
      const mode = dbEntry.getDataValue("mode");
      // @ts-ignore
      const flags = new GuildFlags(dbEntry.getDataValue("flags") ?? 0);
      const platformsRawVal = dbEntry.getDataValue("platforms");
      let platforms;
      // DB Migration
      if (flags.has(GuildFlags.Flags.TWITTER_ONLY) && platformsRawVal != null) {
        // Only twitter
        platforms = new PlatformFlags();
        platforms.add(PlatformFlags.Flags.TWITTER);
        flags.remove(GuildFlags.Flags.TWITTER_ONLY);
        this.setOptions(guildID, { flags });
      } else {
        platforms = new PlatformFlags(platformsRawVal ?? (1 << 24) - 1);
      }
      const options = { mode, flags, platforms };
      return options;
    } else {
      return null;
    }
  }

  async setOptions(guildID, options) {
    const dbUpdate = {};
    if (options.flags) {
      dbUpdate.flags = options.flags;
      // @ts-ignore
      if (options.flags instanceof GuildFlags) {
        dbUpdate.flags = options.flags.valueOf();
      }
    }
    if (options.platforms) {
      dbUpdate.platforms = options.platforms;
      // @ts-ignore
      if (options.platforms instanceof PlatformFlags) {
        dbUpdate.platforms = options.platforms.valueOf();
      }
    }
    if (options.mode) {
      dbUpdate.mode = options.mode;
    }
    return this.db.findOne({ where: { guildID } }).then((currentEntry) => {
      if (currentEntry) {
        this.db.update(dbUpdate, { where: { guildID } });
      } else {
        this.db.create({ ...dbUpdate, guildID });
      }
    });
  }
}

module.exports = new GuildOptions();
