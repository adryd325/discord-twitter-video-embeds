const { Permissions, GuildChannel } = require("discord.js");
const discord = require("../discord");
const { MAX_DISCORD_UPLOAD } = require("../util/Constants");
const { notifyPermissions, safeReply } = require("../util/Utils");

const REQUIRED_PERMISSIONS = new Permissions([Permissions.FLAGS.EMBED_LINKS, Permissions.FLAGS.ATTACH_FILES]);

module.exports = async function videoReply(message, posts, fallback = false) {
  if (
    message.channel instanceof GuildChannel &&
    !message.channel.permissionsFor(discord.user.id).has(REQUIRED_PERMISSIONS)
  ) {
    notifyPermissions(message, REQUIRED_PERMISSIONS, "VIDEO_REPLY");
    return;
  }

  const attachmentPromises = [];
  let content = "";
  posts.forEach(async (post) => {
    if (!post) return;
    if (post.attachment && !fallback) {
      attachmentPromises.push(post.attachment);
      return null;
    }
    if (post.videoUrl) {
      if (post.spoiler) content += ` || ${post.videoUrl} ||`;
      else content += " " + post.videoUrl;
    }
  });

  // Download all attachments and check for oversize attachments
  let attachments;
  if (attachmentPromises.length !== 0) {
    attachments = await Promise.all(attachmentPromises);
    let attachmentTotal = 0;
    attachments = attachments.filter((attachment) => {
      // We have no easy way to check
      if (!attachment.attachment.length) return true;

      // If this attachment is greater than the Discord upload limit
      if (attachment.attachment.length > MAX_DISCORD_UPLOAD) {
        return false;
      }
      // If this attachment would send the message over the Discord upload limit
      if (attachmentTotal + attachment.attachment.length > MAX_DISCORD_UPLOAD) {
        return false;
      }
      // Add to the current attachment limit
      attachmentTotal += attachment.attachment.length;
      return true;
    });
  }

  // If there's no content, don't send an empty string
  if (content.trim() === "") content = undefined;

  // If both of these are empty, we can do nothing
  if (!content && (attachments === undefined || attachments.length == 0)) return null;

  // Reply to the message
  return [safeReply(message, { files: attachments, content }), { mode: "VIDEO_REPLY" }];
};

module.exports.REQUIRED_PERMISSIONS = REQUIRED_PERMISSIONS;
