import { MessageEmbed } from "discord.js";

const embedColor = parseInt("1da1f2", 16);

export default class Tweet {
  constructor(data) {
    this.id = data.id_str;
    this.createdAt = new Date(data.created_at);
    this.extendedEntities = data.extended_entities;
    this.userID = data.user_id_str;
    this.content = data.full_text;
    this.entities = data.entities;
    this.retweets = data.retweet_count;
    this.likes = data.favorite_count;
  }

  addUserData(data) {
    this.username = data.screen_name;
    this.displayName = data.name;
    this.avatar = data.profile_image_url_https;
  }

  get bestVideo() {
    return (
      this.extendedEntities?.media
        // Make sure it's actually a video
        .filter((media) => media.type === "video" || media.type === "animated_gif")
        .flatMap(
          (entity) =>
            entity.video_info.variants
              // Make sure it's a valid video
              .filter((video) => video.bitrate != null)
              // Get the highest quality
              .sort((a, b) => b.bitrate - a.bitrate)?.[0]
        )
    );
  }

  get discordEmbed() {
    return new MessageEmbed({
      author: {
        name: `${this.displayName} (${this.username})`,
        // Permanent URL, even if the author changes their @
        url: `https://twitter.com/i/user/${this.userID}`,
        iconURL: this.avatar,
      },
      color: embedColor,
      createdAt: this.createdAt,
      description: this.content,
      fields: [
        {
          name: "Likes",
          value: this.likes,
          inline: true,
        },
        {
          name: "Retweets",
          value: this.retweets,
          inline: true,
        },
      ],
      url: `https://twitter.com/i/status/${this.id}`,
      video: {
        url: this.bestVideo[0].url,
      },
    });
  }
}
