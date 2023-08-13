const { MessageEmbed, MessageAttachment } = require("discord.js");
const fetch = require("node-fetch");
const { USER_AGENT, Colors, Favicons } = require("../util/Constants");
const { parseHtmlEntities } = require("../util/Utils");

class TwitterSyndicatePost {
  constructor(data) {
    this.id = data.id_str ?? data.id;
    this.createdAt = new Date(data.created_at);
    this.extendedEntities = data.extended_entities;
    this.userID = data.user.id_str;
    this.username = data.user.screen_name;
    this.displayName = data.user.name;
    this.avatar = data.user.profile_image_url_https;
    this.content = parseHtmlEntities(data.text);
    this.retweets = data.retweet_count;
    this.likes = data.favorite_count;
    this.imageUrls = data.photos?.map((photo) => photo.url);
    this.videoUrl = data.video?.variants
      .reverse()
      // Make sure it's a valid video
      .filter((video) => video.type == "video/mp4")?.[0]?.src;
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
            return new MessageAttachment(videoResponse, `${spoiler ? "SPOILER_" : ""}${this.id}.mp4`);
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
            return new MessageAttachment(image, `${spoiler ? "SPOILER_" : ""}${this.id}.jpg`);
          });
      });
    }
  }

  getDiscordEmbed() {
    const embed = new MessageEmbed();
    embed.setColor(Colors.TWITTER);
    embed.setFooter("Twitter", Favicons.TWITTER);
    embed.setURL(this.url);
    embed.setTimestamp(this.createdAt);
    embed.setDescription(this.content);
    embed.setAuthor(`${this.displayName} (@${this.username})`, this.avatar, this.authorUrl);
    if (this.retweets && this.retweets > 0) {
      embed.addField("Retweets", this.retweets.toString(), true);
    }
    if (this.likes && this.likes > 0) {
      embed.addField("Likes", this.likes.toString(), true);
    }
    return embed;
  }
}

module.exports = TwitterSyndicatePost;
