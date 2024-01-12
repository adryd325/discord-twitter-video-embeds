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
      this.isQuote = data.is_quote_status;
      if(this.isQuote){
        this.quote = {};
        this.quote.id = data.quote_data.id_str ?? data.quote_data.id;
        this.quote.createdAt = new Date(data.quote_data.created_at);
        this.quote.extendedEntities = data.quote_data.extended_entities;
        this.quote.userID = data.quote_data.user_id_str;
        this.quote.content = parseHtmlEntities(data.quote_data.full_text);
        this.quote.entities = data.quote_data.entities;
        this.quote.retweets = data.quote_data.retweet_count;
        this.quote.likes = data.quote_data.favorite_count;
        this.quote.imageUrls = this.quote.extendedEntities?.media
          .filter((media) => media.type === "photo")
          .map((photo) => photo.media_url_https);
        this.quote.videoUrl = this.quote.extendedEntities?.media
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
  }

  addUserData(data) {
    this.username = data.screen_name;
    this.displayName = data.name;
    this.avatar = data.profile_image_url_https;
    if(this.isQuote){
      this.quote.username = data.quote_data.screen_name;
      this.quote.displayName = data.quote_data.name;
      this.quote.avatar = data.quote_data.profile_image_url_https;
    }
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
    if(this.quote?.videoUrl){
      return [
        fetch(this.quote.videoUrl, {
          headers: {
            "User-Agent": USER_AGENT
          }
        })
          .then((response) => response.buffer())
          .then((videoResponse) => {
            return new AttachmentBuilder(videoResponse, { name: `${spoiler ? "SPOILER_" : ""}${this.quote.id}.mp4` });
          })
      ];
    } else if(this.quote?.imageUrls){
      return this.quote.imageUrls.map((url) => {
        return fetch(url, {
          headers: {
            "User-Agent": USER_AGENT
          }
        })
          .then((response) => response.buffer())
          .then((image) => {
            return new AttachmentBuilder(image, { name: `${spoiler ? "SPOILER_" : ""}${this.quote.id}.jpg` });
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
    if(this.isQuote){
      embed.addFields({ name: `Quote from:${this.quote.displayName} (@${this.quote.username})`, value: `[Original Tweet: ](https://twitter.com/i/status/${this.quote.id}) ${this.quote.content}`});
    }
    return embed;
  }
}

module.exports = TwitterPost;
