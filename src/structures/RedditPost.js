const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
const { USER_AGENT, Colors, Favicons } = require("../util/Constants");
const mergeStreams = require("../util/mergeStreams");

const dashVideoGlobalRegExp = /Representation bandwidth="(\d+?)"[\s\S]+?<BaseURL>(.+?)<\/BaseURL>/gm;
const dashVideoRegExp = /Representation bandwidth="(\d+?)"[\s\S]+?<BaseURL>(.+?)<\/BaseURL>/m;
const dashAudioGlobalRegExp = /Representation audioSamplingRate="(\d+?)"[\s\S]+?<BaseURL>(.+?)<\/BaseURL>/gm;
const dashAudioRegExp = /Representation audioSamplingRate="(\d+?)"[\s\S]+?<BaseURL>(.+?)<\/BaseURL>/m;

class RedditPost {
  constructor(data) {
    this.id = data.id;
    this.videoId = data.url.split("/").slice(-1)[0];
    this.createdAt = new Date(parseInt(data.created.toString() + "000"));
    this.content = data.title;
    this.username = `/u/${data.author}`;
    this.authorUrl = `https://reddit.com/user/${data.author}`;
    this.url = `https://reddit.com${data.permalink}`;
    this.shortUrl = `${data.url}`;
    // Huge thanks to GenProg for letting me use this as a fallback <3
    this.videoUrl = `https://proxy.knotty.dev/s/${this.videoId}.mp4`;
    this.dashUrl = `${data.url}/DASHPlaylist.mpd`;
    this.video = this._getVideo(this.dashUrl);
    this.subreddit = `/r/${data.subreddit}`;
    this.points = data.ups;
    this.replies = data.num_replies;
  }

  async _getVideo(dashUrl) {
    const dashResponse = await fetch(dashUrl, {
      headers: {
        "User-Agent": USER_AGENT
      }
    });

    const xml = await dashResponse.text();

    // Get all video options
    const videoOptions = xml.match(dashVideoGlobalRegExp);
    dashVideoGlobalRegExp.lastIndex = 0;

    // If we got nothing, exit
    if (!videoOptions) return null;

    // Get all audio options
    const audioOptions = xml.match(dashAudioGlobalRegExp);
    dashAudioGlobalRegExp.lastIndex = 0;

    let bestVideo;
    let bestAudio;

    // Find best video
    videoOptions.forEach((video) => {
      const [_match, bitrate, url] = video.match(dashVideoRegExp);
      if (!bestVideo || bestVideo?.bitrate < bitrate) {
        bestVideo = { bitrate, url: `${this.shortUrl}/${url}` };
      }
    });

    if (!bestVideo) return null;

    // Find best audio
    if (audioOptions !== null) {
      audioOptions.forEach((audio) => {
        const [_match, bitrate, url] = audio.match(dashAudioRegExp);
        if (!bestAudio || bestVideo?.bitrate < bitrate) {
          bestAudio = { bitrate, url: `${this.shortUrl}/${url}` };
        }
      });
    }

    // Download best video
    const video = await fetch(bestVideo.url, {
      headers: {
        "User-Agent": USER_AGENT
      }
    }).then((response) => response.buffer());

    // If we don't have audio, we can end here
    if (!bestAudio) return video;

    // If we do have audio let's download it
    const audio = await fetch(bestAudio.url, {
      headers: {
        "User-Agent": USER_AGENT
      }
    }).then((response) => response.buffer());

    // Then merge the two streams (I hate reddit)
    return mergeStreams(video, audio);
  }

  async getDiscordAttachment(spoiler) {
    return new AttachmentBuilder(await this.video, { name: `${spoiler ? "SPOILER_" : ""}${this.id}.mp4` });
  }

  getDiscordEmbed() {
    const embed = new EmbedBuilder();
    embed.setColor(Colors.REDDIT);
    embed.setFooter({ text: "reddit", iconURL: Favicons.REDDIT });
    embed.setURL(this.url);
    embed.setTimestamp(this.createdAt);
    embed.setTitle(this.content.substring(0, 200));
    embed.setAuthor({
      name: `${this.username}`,
      iconURL: this.authorUrl
    });
    if (this.subreddit) {
      embed.setTitle(`${this.content} (${this.subreddit})`);
    }
    if (this.points && this.points > 0) {
      embed.addFields({ name: "Points", value: this.points.toString(), inline: true });
    }
    if (this.replies && this.replies > 0) {
      embed.addFields({ name: "Replies", value: this.replies.toString(), inline: true });
    }
    return embed;
  }
}

module.exports = RedditPost;
