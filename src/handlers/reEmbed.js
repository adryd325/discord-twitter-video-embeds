const { Permissions, GuildChannel } = require("discord.js");
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
    message.channel instanceof GuildChannel &&
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
      return videoReply(message, posts);
    }
  }

  if (content.trim() === "") content = undefined;

  const [_suppressedMessage, reply] = await Promise.all([
    message.suppressEmbeds(),
    safeReply(message, { files: attachments, embeds, content })
  ]);

  return reply;
};

module.exports.REQUIRED_PERMISSIONS = REQUIRED_PERMISSIONS;
