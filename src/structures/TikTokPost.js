const { MessageEmbed, MessageAttachment } = require("discord.js");
const fetch = require("node-fetch");
const { TIKTOK_HOME, GENERIC_USER_AGENT, Colors, Favicons } = require("../util/Constants.js");

class TikTokPost {
  constructor(data, cookies) {
    this.id = data.id;
    this.createdAt = new Date(parseInt(data.createTime.toString() + "000"));
    this.cookies = cookies;
    this.content = data.desc.split("#").join(" #").trim();
    this.displayName = data.author.nickname;
    this.username = data.author.uniqueId;
    this.avatar = data.author.avatarThumb;
    this.authorUrl = `${TIKTOK_HOME}/@${data.author.uniqueId}`;
    this.url = `${TIKTOK_HOME}/@${data.author.uniqueId}/video/${data.id}`;
    this.videoUrl = data.video.downloadAddr;
    this.likes = data.stats.diggCount;
  }

  getDiscordAttachment(spoiler) {
    return fetch(this.videoUrl, {
      headers: {
        Cookie: this.cookies,
        Referer: `${TIKTOK_HOME}/`,
        "User-Agent": GENERIC_USER_AGENT
      }
    }).then((videoResponse) => {
      return new MessageAttachment(videoResponse.body, `${spoiler ? "SPOILER_" : ""}${this.id}.mp4`);
    });
  }

  getDiscordEmbed() {
    const embed = new MessageEmbed();
    embed.setColor(Colors.TIKTOK);
    embed.setFooter("TikTok", Favicons.TIKTOK);
    embed.setURL(this.url);
    embed.setTimestamp(this.createdAt);
    embed.setTitle(this.content);
    embed.setAuthor(`${this.displayName} (@${this.username})`, this.avatar, this.authorUrl);
    if (this.likes) {
      embed.addField("Likes", this.likes.toString(), true);
    }
    return embed;
  }
}

module.exports = TikTokPost;
