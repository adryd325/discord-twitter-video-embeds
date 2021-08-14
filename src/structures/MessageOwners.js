const { GuildChannel, Guild, Message, Channel, User } = require("discord.js");
const MessageOwnersDB = require("../database/MessageOwnersDB");

class GuildOptions {
  constructor() {
    this.db = MessageOwnersDB;
  }

  _validateChannel(channel) {
    if (channel.isText() && channel instanceof GuildChannel) return true;
    return false;
  }

  _validateGuild(guild) {
    if (guild instanceof Guild) return true;
    return false;
  }

  _validateMessage(message) {
    if (!(message instanceof Message)) return false;
    if (!(message.channel instanceof Channel)) return false;
    if (!(message.author instanceof User)) return false;
    return true;
  }

  async getOwner(messageID) {
    const dbEntry = await this.db.findOne({ where: { messageID } });
    if (dbEntry) {
      return dbEntry.getDataValue("userID");
    } else {
      return null;
    }
  }

  setOwner(originalMessage, message) {
    if (!this._validateMessage(message) || !this._validateMessage(originalMessage)) return null;
    let guildID = null;
    if (message.channel.guild) guildID = message.channel.guild.id;
    return this.db.create({
      messageID: message.id,
      originalMessageID: originalMessage.id,
      userID: originalMessage.author.id,
      channelID: message.channel.id,
      guildID
    });
  }

  _import(messageID, originalMessageID, userID, channelID, guildID) {
    if (guildID === "null") guildID = null;
    this.db.create({ messageID, originalMessageID, userID, channelID, guildID });
  }
}

module.exports = new GuildOptions();
