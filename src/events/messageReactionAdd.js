const {
  DiscordAPIError,
  PermissionFlagsBits,
  BaseGuildTextChannel,
  RESTJSONErrorCodes
} = require("discord.js");
const discord = require("../discord");
const MessageOwners = require("../structures/MessageOwners");
const { DELETE_EMOJIS } = require("../util/Constants");
const log = require("../util/log");

module.exports = async function handleReactionAdd(messageReaction, user) {
  // If the user reacts with one of the delete message emojis
  if (!DELETE_EMOJIS.includes(messageReaction.emoji.name)) return;
  const dbData = await MessageOwners.getData(messageReaction.message.id);

  // If we got nothing
  if (!dbData) return;

  // If the message owner is the one who reacted, delete
  if (dbData.user === user.id) {
    try {
      log.info("Handled delete request");
      try {
        await messageReaction.message.delete();
      } catch (ignoed) {
        // ignored
      }
      // Experiment: Restore embeds on suppressed messages
      if (process.env.INSTANCE === "staging") {
        // get channel
        const channel = discord.channels.cache.get(dbData.channel);
        // make sure we're in a valid channel
        // technically if someone runs this on a bot old enough to get added to group dms we have problems
        // do i care? no.
        // @ts-ignore UGH i hate types
        if (channel instanceof BaseGuildTextChannel) {
          // check permissions
          // @ts-ignore
          if (!channel.permissionsFor(discord.user.id).has(PermissionFlagsBits.ManageMessages)) return;
          const originalMessage = await channel.messages.fetch(dbData.originalMessage);
          await originalMessage.suppressEmbeds(false);
        }
      }
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        switch (error.code) {
          case RESTJSONErrorCodes.UnknownMessage:
          case RESTJSONErrorCodes.MissingPermissions:
            break;
          default:
            throw error;
        }
      }
    }
  }
};
