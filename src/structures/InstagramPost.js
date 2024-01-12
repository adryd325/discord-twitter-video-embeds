const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
// const { getUploadLimit } = require("../util/Utils");
const { INSTAGRAM_HOME, MAX_DISCORD_UPLOAD, USER_AGENT, Colors, Favicons } = require("../util/Constants");

class InstagramPost {
  constructor(data) {
    if (!data.scraper) {
      this.id = data.id;
      this.createdAt = new Date(parseInt(data.timestamp.toString() + "000"));
      this.content = data.description + '';
      this.displayName = data.creator;
      this.username = data.uploader;
      this.authorUrl = data.uploader_url;
      this.url = `${INSTAGRAM_HOME}/p/${data.id}`;
      this.likes = data.like_count;

      // filter best quality
      // intentionally picking the watermarked video cause i feel like thats more moral
      // if videos get shared
      // FIXME: pass guild into here somehow for upload limit
      const chosenFile = data.formats
        .filter((media) => media.ext.includes("mp4") && !media.format_id.includes("dash"))
        .sort((a, b) => b.format - a.format)?.[0];

      if (!chosenFile) {
        return;
      }

      if (chosenFile.http_headers) {
        this._headers = chosenFile.http_headers;
      } else {
        this._headers = {
          "User-Agent": USER_AGENT
        };
      }
      this._videoUrl = chosenFile.url;
    } else {
      this.id = data.original_url.substring(data.original_url.lastIndexOf('/', data.original_url.length-2)).replaceAll('/','');
      this.scraper = true;
      this.createdAt = new Date();
      this.url = data.original_url;
      this.videoUrl = data.scraping.url;
      this._videoUrl = data.scraping.url;
      this.thumbnail = data.scraping.thumbnail;
      this.content = data.original_url;
      this._headers = {
        "User-Agent": USER_AGENT
      };
    }

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

  // getDiscordAttachments(spoiler) {
  //   if (this.videoUrl) {
  //     return [
  //       fetch(this.videoUrl, {
  //         headers: {
  //           "User-Agent": USER_AGENT
  //         }
  //       })
  //         .then((response) => response.buffer())
  //         .then((videoResponse) => {
  //           return new AttachmentBuilder(videoResponse, { name: `${spoiler ? "SPOILER_" : ""}${this.id}.mp4` });
  //         })
  //     ];
  //   } else if (this.imageUrls) {
  //     return this.imageUrls.map((url) => {
  //       return fetch(url, {
  //         headers: {
  //           "User-Agent": USER_AGENT
  //         }
  //       })
  //         .then((response) => response.buffer())
  //         .then((image) => {
  //           return new AttachmentBuilder(image, { name: `${spoiler ? "SPOILER_" : ""}${this.id}.jpg` });
  //         });
  //     });
  //   }
  // }

  getDiscordEmbed() {
    const embed = new EmbedBuilder();
    embed.setColor(Colors.INSTAGRAM);
    embed.setFooter({
      text: "Instagram",
      iconURL: Favicons.INSTAGRAM
    });
    embed.setURL(this.url);
    embed.setTimestamp(this.createdAt);
    if (this.content == "") {
      this.content = "...";
    }
    embed.setTitle(this.content.substring(0, 200));
    if (!this.scraper) {    
      embed.setAuthor({
        name: `${this.displayName} (@${this.username})`,
        url: this.authorUrl
      });
    }
    if (this.likes) {
      embed.addFields({ name: "Likes", value: this.likes.toString(), inline: true });
    }
    return embed;
  }
}

module.exports = InstagramPost;
