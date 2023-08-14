const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
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
    // intentionally picking the watermarked video cause i feel like thats more moral
    // if videos get shared
    // FIXME: pass guild into here somehow for upload limit
    const chosenFile = data.formats
      .filter((media) => media.filesize < MAX_DISCORD_UPLOAD && media.format.includes("watermarked"))
      .sort((a, b) => b.quality - a.quality)?.[0];

    if (!chosenFile) {
      return;
    }

    if (chosenFile.http_headers) {
      this._headers = chosenFile.http_headers;
    } else {
      this._headers = {};
    }
    this._videoUrl = chosenFile.url;
  }

  getDiscordAttachment(spoiler) {
    if (this._videoUrl) {
      return fetch(this._videoUrl, {
        headers: this._headers
      })
        .then((response) => response.buffer())
        .then((videoResponse) => {
          return new AttachmentBuilder(videoResponse, { name: `${spoiler ? "SPOILER_" : ""}${this.id}.mp4` });
        });
    } else return;
  }

  getDiscordEmbed() {
    const embed = new EmbedBuilder();
    embed.setColor(Colors.TIKTOK);
    embed.setFooter({
      text: "TikTok",
      iconURL: Favicons.TIKTOK
    });
    embed.setURL(this.url);
    embed.setTimestamp(this.createdAt);
    if (this.content == "") {
      this.content = "...";
    }
    embed.setTitle(this.content.substring(0, 200));
    embed.setAuthor({
      name: `${this.displayName} (@${this.username})`,
      url: this.authorUrl
    });
    if (this.likes) {
      embed.addFields({ name: "Likes", value: this.likes.toString(), inline: true });
    }
    return embed;
  }
}

module.exports = TikTokPost;
