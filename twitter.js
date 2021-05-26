import fetch from "node-fetch";

// twitter guest web token
// https://github.com/ytdl-org/youtube-dl/blob/2021.05.16/youtube_dl/extractor/twitter.py#L84
const TWITTER_BEARER_TOKEN =
  "Bearer AAAAAAAAAAAAAAAAAAAAAPYXBAAAAAAACLXUNDekMxqa8h%2F40K4moUkGsoc%3DTYfbDKbT3jJPCEVnMYqilB28NHfOPqkca3qaAxGfsyKCs0wRbw";

const TWITTER_API_URL = "https://api.twitter.com/1.1/guest/activate.json";

export class TwitterError extends Error {
  constructor({ message, code }) {
    super(message);
    this.code = code;
  }
}

export class TwitterErrorList extends Error {
  constructor(errors) {
    super(errors.map((err) => err.message).join("\n\n"));
    this.errors = errors;
  }
}

export class TwitterClient {
  /** @param {string} userAgent */
  constructor(userAgent) {
    this.userAgent = userAgent;
  }

  fetchGuestToken() {
    return fetch(TWITTER_API_URL, {
      method: "post",
      headers: {
        "user-agent": this.userAgent,
        authorization: TWITTER_BEARER_TOKEN,
      },
    }).then((res) => res.json());
  }

  async getGuestToken() {
    if (!this.guestToken) {
      const data = await this.fetchGuestToken();
      this.guestToken = data["guest_token"];
    }
    return this.guestToken;
  }

  /** @param {string} id the tweet id */
  async getTweet(id) {
    const apiUrl = `https://api.twitter.com/2/timeline/conversation/${id}.json?tweet_mode=extended`;

    return fetch(apiUrl, {
      headers: {
        "user-agent": this.userAgent,
        authorization: TWITTER_BEARER_TOKEN,
        "x-guest-token": await this.getGuestToken(),
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.errors) {
          throw new TwitterErrorList(
            res.errors.map((err) => new TwitterError(err))
          );
        }
        return res;
      })
      .then((conversation) => {
        const tweets = conversation.globalObjects.tweets;
        return tweets[
          // Follow retweets
          tweets[id].retweeted_status_id_str ??
            // Follow quotes
            tweets[id].quoted_status_id_str ??
            id
        ];
      });
  }

  /** @param {string} id the tweet id */
  async getVideos(id) {
    return this.getTweet(id)
      .then((tweet) =>
        tweet.extended_entities?.media
          // Make sure it's actually a video
          .filter((m) => m.type === "video" || m.type === "animated_gif")
          .flatMap(
            (entity) =>
              entity.video_info.variants
                // Make sure it's a valid video
                .filter((v) => v.bitrate != null)
                // Get the highest quality
                .sort((a, b) => b.bitrate - a.bitrate)?.[0]
          )
      )
      .then((info) => (info ? (info.length > 0 ? info : null) : null));
  }
}
