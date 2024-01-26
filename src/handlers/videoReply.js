const { PermissionsBitField, GuildChannel, PermissionFlagsBits, DiscordAPIError } = require("discord.js");
const discord = require("../discord");
const { notifyPermissions, safeReply, getUploadLimit } = require("../util/Utils");
const log = require("../util/log");

const REQUIRED_PERMISSIONS = new PermissionsBitField([PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]);

module.exports = async function videoReply(message, posts, fallback = false) {
  if (
    message.channel instanceof GuildChannel &&
    !message.channel.permissionsFor(discord.user.id).has(REQUIRED_PERMISSIONS)
  ) {
    notifyPermissions(message, REQUIRED_PERMISSIONS, "VIDEO_REPLY");
    return null;
  }

  let attachmentPromises = [];
  let content = "";

  for (const post of posts) {
    if (!post) continue;

    if (post.attachment && !fallback) {
      log.verbose("videoReply", "added attchment");
      post.attachment.forEach((attachment) => attachmentPromises.push(attachment));
      continue;
    }
    if (post.videoUrl) {
      log.verbose("videoReply", "added video url");
      if (post.spoiler) content += ` || ${post.videoUrl} ||`;
      else content += " " + post.videoUrl;
    }
  }

  attachmentPromises = attachmentPromises.slice(0, 10);

  // Download all attachments and check for oversize attachments
  let attachments;
  if (attachmentPromises.length !== 0) {
    attachments = (await Promise.all(attachmentPromises)).filter((attachment) => attachment != undefined);
    log.verbose("videoReply", "downloaded attachments");
    let attachmentTotal = 0;
    attachments = attachments.filter((attachment) => {
      // We have no easy way to check
      if (!attachment.attachment.length) return true;

      // If this attachment is greater than the Discord upload limit
      if (attachment.attachment.length > getUploadLimit(message.guild)) {
        return false;
      }
      // If this attachment would send the message over the Discord upload limit
      if (attachmentTotal + attachment.attachment.length > getUploadLimit(message.guild)) {
        return false;
      }
      // Add to the current attachment limit
      attachmentTotal += attachment.attachment.length;
      return true;
    });
  }

  // trim content so we have no prepending spaces or anything funky
  content = content.trim();

  // If there's no content, don't send an empty string
  if (content === "") content = undefined;

  // If both of these are empty, we can do nothing
  if (!content && (attachments === undefined || attachments.length == 0)) {
    log.verbose("videoReply", "we have no attachments or content, doing nothing");
    return null;
  }

  let response;
  try {
    response = await safeReply(message, { files: attachments, content });
  } catch (e) {
    if (e instanceof DiscordAPIError) {
      //noop
    } else {
      throw e;
    }
  }

  if (!response) return null;

  // Reply to the message
  return [response, { mode: "VIDEO_REPLY", fallback }];
};

module.exports.REQUIRED_PERMISSIONS = REQUIRED_PERMISSIONS;
