const { DiscordAPIError, Permissions, Constants: DiscordConstants } = require("discord.js");
const discord = require("../discord");
const { APIErrors, ChannelTypes } = DiscordConstants;
const MessageOwners = require("../structures/MessageOwners");
const { DELETE_EMOJIS } = require("../util/Constants");

module.exports = async function handleReactionAdd(messageReaction, user) {
  // If the user reacts with one of the delete message emojis
  if (!DELETE_EMOJIS.includes(messageReaction.emoji.name)) return;
  const dbData = await MessageOwners.getData(messageReaction.message.id);

  // If we got nothing
  if (!dbData) return;

  // If the message owner is the one who reacted, delete
  if (dbData.user === user.id) {
    try {
      await messageReaction.message.delete();
      // Experiment: Restore embeds on suppressed messages
      if (process.env.INSTANCE === "staging") {
        // get channel
        const channel = discord.channels.cache.get(dbData.channel);
        // make sure we're in a valid channel
        // @ts-ignore UGH i hate types
        if (channel.isText() && channel.type !== ChannelTypes.DM) {
          // check permissions
          // @ts-ignore
          if (!channel.permissionsFor(discord.user.id).has(Permissions.FLAGS.MANAGE_MESSAGES)) return;
          const originalMessage = await channel.messages.fetch(dbData.originalMessage);
          await originalMessage.suppressEmbeds(false);
        }
      }
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        switch (error.code) {
          case APIErrors.UNKNOWN_MESSAGE:
          case APIErrors.MISSING_PERMISSIONS:
            break;
          default:
            throw error;
        }
      }
    }
  }
};
