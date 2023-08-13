const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const fetch = require("node-fetch");
const { USER_AGENT, Colors, Favicons } = require("../util/Constants");
const { parseHtmlEntities } = require("../util/Utils");

class TwitterPost {
  constructor(data) {
    this.id = data.id_str ?? data.id;
    this.createdAt = new Date(data.created_at);
    this.extendedEntities = data.extended_entities;
    this.userID = data.user_id_str;
    this.content = parseHtmlEntities(data.full_text);
    this.entities = data.entities;
    this.retweets = data.retweet_count;
    this.likes = data.favorite_count;
    this.imageUrls = this.extendedEntities?.media
      .filter((media) => media.type === "photo")
      .map((photo) => photo.media_url_https);
    this.videoUrl = this.extendedEntities?.media
      // Make sure it's actually a video
      .filter((media) => media.type === "video" || media.type === "animated_gif")
      .flatMap(
        (entity) =>
          entity.video_info.variants
            // Make sure it's a valid video
            .filter((video) => video.bitrate != null)
            // Get the highest quality
            .sort((a, b) => b.bitrate - a.bitrate)?.[0]
      )[0]?.url;
  }

  addUserData(data) {
    this.username = data.screen_name;
    this.displayName = data.name;
    this.avatar = data.profile_image_url_https;
  }

  get url() {
    return `https://twitter.com/i/status/${this.id}`;
  }

  get authorUrl() {
    // Permanent URL, even if the author changes their @
    return `https://twitter.com/i/user/${this.userID}`;
  }

  getDiscordAttachments(spoiler) {
    if (this.videoUrl) {
      return [
        fetch(this.videoUrl, {
          headers: {
            "User-Agent": USER_AGENT
          }
        })
          .then((response) => response.buffer())
          .then((videoResponse) => {
            return new AttachmentBuilder(videoResponse, { name: `${spoiler ? "SPOILER_" : ""}${this.id}.mp4` });
          })
      ];
    } else if (this.imageUrls) {
      return this.imageUrls.map((url) => {
        return fetch(url, {
          headers: {
            "User-Agent": USER_AGENT
          }
        })
          .then((response) => response.buffer())
          .then((image) => {
            return new AttachmentBuilder(image, { name: `${spoiler ? "SPOILER_" : ""}${this.id}.jpg` });
          });
      });
    }
  }

  getDiscordEmbed() {
    const embed = new EmbedBuilder();
    embed.setColor(Colors.TWITTER);
    embed.setFooter({
      text: "Twitter",
      iconURL: Favicons.TWITTER
    });
    embed.setURL(this.url);
    embed.setTimestamp(this.createdAt);
    embed.setDescription(this.content);
    embed.setAuthor({
      name: `${this.displayName} (@${this.username})`,
      iconURL: this.avatar,
      url: this.authorUrl
    });
    if (this.retweets && this.retweets > 0) {
      embed.addFields({ name: "Retweets", value: this.retweets.toString(), inline: true });
    }
    if (this.likes && this.likes > 0) {
      embed.addFields({ name: "Likes", value: this.likes.toString(), inline: true });
    }
    return embed;
  }
}

module.exports = TwitterPost;
