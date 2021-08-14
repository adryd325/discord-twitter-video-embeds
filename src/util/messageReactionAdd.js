const { DiscordAPIError, Constants: DiscordConstants } = require("discord.js");
const { APIErrors } = DiscordConstants;
const { DELETE_EMOJIS } = require("./Constants");
const MessageOwners = require("../structures/MessageOwners");

module.exports = async function handleReactionAdd(messageReaction, user) {
  // If the user reacts with one of the delete message emojis
  if (!DELETE_EMOJIS.includes(messageReaction.emoji.name)) return;
  const messageOwner = await MessageOwners.getOwner(messageReaction.message.id);

  // If we got nothing
  if (!messageOwner) return;

  // If the message owner is the one who reacted, delete
  if (messageOwner === user.id) {
    try {
      await messageReaction.message.delete();
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
