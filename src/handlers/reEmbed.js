const {
  Permissions,
  GuildChannel,
  ThreadChannel,
  DiscordAPIError,
  Constants: DiscordConstants
} = require("discord.js");
const { APIErrors } = DiscordConstants;
const videoReply = require("./videoReply");
const discord = require("../discord");
const { MAX_DISCORD_UPLOAD } = require("../util/Constants");
const { notifyPermissions, safeReply } = require("../util/Utils");

const REQUIRED_PERMISSIONS = new Permissions([
  Permissions.FLAGS.EMBED_LINKS,
  Permissions.FLAGS.ATTACH_FILES,
  Permissions.FLAGS.MANAGE_MESSAGES
]);

module.exports = async function reEmbed(message, posts) {
  if (
    (message.channel instanceof GuildChannel || message.channel instanceof ThreadChannel) &&
    !message.channel.permissionsFor(discord.user.id).has(REQUIRED_PERMISSIONS)
  ) {
    notifyPermissions(message, REQUIRED_PERMISSIONS, "RE_EMBED");
    return;
  }
  const embeds = [];
  const attachmentPromises = [];
  let content = "";
  posts.forEach(async (post) => {
    if (!post) return;
    if (post.embed) {
      embeds.push(post.embed);
    }
    if (post.attachment) {
      attachmentPromises.push(post.attachment);
    }
    if (post.spoiler) {
      content += ` || ${post.url} ||`;
    }
  });

  // Download all attachments and check for oversize attachments
  let attachments;
  if (attachmentPromises.length !== 0) {
    attachments = await Promise.all(attachmentPromises);
    let attachmentTotal = 0;

    // Get total attachment size
    attachments.forEach((attachment) => {
      if (attachment.attachment.length) attachmentTotal += attachment.attachment.length;
    });

    // If it's over the attachment limit, try VIDEO_REPLY for URLs
    // TODO: Add more advanced logic for deciding if VIDEO_REPLY will be able to do anything
    if (attachmentTotal > MAX_DISCORD_UPLOAD) {
      return videoReply(message, posts, true);
    }
  }

  if (content.trim() === "") content = undefined;
  try {
    return await safeReply(message, { files: attachments, embeds, content }).then(async (reply) => {
      await message.suppressEmbeds();
      return reply;
    });
  } catch (error) {
    if (error instanceof DiscordAPIError && error.code === APIErrors.REQUEST_ENTITY_TOO_LARGE) {
      return videoReply(message, posts, true);
    } else {
      throw error;
    }
  }
};

module.exports.REQUIRED_PERMISSIONS = REQUIRED_PERMISSIONS;
