const { MessageEmbed, MessageAttachment } = require("discord.js");
const fetch = require("node-fetch");
const { TIKTOK_HOME, MAX_DISCORD_UPLOAD, Colors, Favicons } = require("../util/Constants");

class TikTokPost {
  constructor(data) {
    this.id = data.id;
    this.createdAt = new Date(parseInt(data.timestamp.toString() + "000"));
    this.content = data.description;
    this.displayName = data.creator;
    this.username = data.uploader;
    this.authorUrl = data.uploader_url;
    this.url = `${TIKTOK_HOME}/@${data.uploader}/video/${data.id}`;
    this.likes = data.like_count;

    // filter best quality
    // FIXME: pass guild into here somehow for upload limit
    const chosenFile = data.formats
      .filter((media) => media.filesize < MAX_DISCORD_UPLOAD && media.format.includes("watermarked"))
      .sort((a, b) => b.quality - a.quality)?.[0];

    this._headers = chosenFile.http_headers;
    this._videoUrl = chosenFile.url;
  }

  getDiscordAttachment(spoiler) {
    return fetch(this._videoUrl, {
      headers: this._headers
    })
      .then((response) => response.buffer())
      .then((videoResponse) => {
        return new MessageAttachment(videoResponse, `${spoiler ? "SPOILER_" : ""}${this.id}.mp4`);
      });
  }

  getDiscordEmbed() {
    const embed = new MessageEmbed();
    embed.setColor(Colors.TIKTOK);
    embed.setFooter("TikTok", Favicons.TIKTOK);
    embed.setURL(this.url);
    embed.setTimestamp(this.createdAt);
    embed.setTitle(this.content);
    embed.setAuthor(`${this.displayName} (@${this.username})`, null, this.authorUrl);
    if (this.likes) {
      embed.addField("Likes", this.likes.toString(), true);
    }
    return embed;
  }
}

module.exports = TikTokPost;
