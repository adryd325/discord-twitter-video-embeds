const { Permissions, GuildChannel, DiscordAPIError, Constants: DiscordConstants } = require("discord.js");
const { APIErrors } = DiscordConstants;
const videoReply = require("./videoReply");
const discord = require("../discord");
const { notifyPermissions, getUploadLimit } = require("../util/Utils");
const { getWebhook, resetWebhook } = require("../util/getWebhook");

const REQUIRED_PERMISSIONS = new Permissions([
  Permissions.FLAGS.EMBED_LINKS,
  Permissions.FLAGS.ATTACH_FILES,
  Permissions.FLAGS.MANAGE_MESSAGES,
  Permissions.FLAGS.MANAGE_WEBHOOKS
]);

module.exports = async function reEmbed(message, posts, retry = false) {
  // To suppress TS errors, even though we already handled that.
  if (!(message.channel instanceof GuildChannel)) return null;
  if (!message.channel.permissionsFor(discord.user.id).has(REQUIRED_PERMISSIONS)) {
    notifyPermissions(message, REQUIRED_PERMISSIONS, "RE_COMPOSE");
    return null;
  }

  const webhook = await getWebhook(message.channel);
  if (!webhook) return null;

  const embeds = [];
  const attachmentPromises = [];

  posts.forEach((post) => {
    if (!post) return;
    if (post.embed) {
      embeds.push(post.embed);
    }
    if (post.attachment) {
      post.attachment.forEach(attachment => (attachmentPromises.push(attachment)));
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
    if (attachmentTotal > getUploadLimit(message.guild)) {
      return videoReply(message, posts, true);
    }
  }

  let content = message.content;

  // If there's no content, don't send an empty string
  if (content.trim() === "") content = undefined;

  // If both of these are empty, we can do nothing
  if (!content && attachments.length == 0) return null;

  try {
    return await webhook
      .send({
        content,
        embeds,
        files: attachments,
        username: message.author.username,
        avatarURL: message.author.avatarURL({ format: "webp", size: 256 }),
        allowed_mentions: { parse: ["users"] }
      })
      .then((reply) => {
        message.delete();
        return reply;
      });
  } catch (error) {
    if (error instanceof DiscordAPIError && error.code === APIErrors.UNKNOWN_WEBHOOK) {
      await resetWebhook(message.channel);
      if (retry === false) {
        return reEmbed(message, posts, true);
      }
    } else if (error instanceof DiscordAPIError && error.code === APIErrors.REQUEST_ENTITY_TOO_LARGE) {
      return videoReply(message, posts, true);
    } else {
      throw error;
    }
  }
};

module.exports.REQUIRED_PERMISSIONS = REQUIRED_PERMISSIONS;
