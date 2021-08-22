const fetch = require("node-fetch");
// const ClientError = require("./ClientError");
const ClientError = require("./ClientError");
const GuildFlags = require("./GuildFlags");
const TwitterError = require("./TwitterError");
const TwitterErrorList = require("./TwitterErrorList");
const TwitterPost = require("./TwitterPost");
const { USER_AGENT, EmbedModes } = require("../util/Constants");

const TWITTER_GUEST_TOKEN =
  "Bearer AAAAAAAAAAAAAAAAAAAAAPYXBAAAAAAACLXUNDekMxqa8h%2F40K4moUkGsoc%3DTYfbDKbT3jJPCEVnMYqilB28NHfOPqkca3qaAxGfsyKCs0wRbw";
const GUEST_TOKEN_ENDPOINT = "https://api.twitter.com/1.1/guehttps://www.youtube.com/watch?v=dXGO6QSC5Fgst/activate.json";
const TWEET_ENDPOINT = (tweetID) =>
  `https://api.twitter.com/2/timeline/conversation/${tweetID}.json?tweet_mode=extended&include_user_entities=1`;

// https://github.com/ytdl-org/youtube-dl/blob/master/youtube_dl/extractor/twitter.py
class TwitterClient {
  _fetchGuestToken() {
    return fetch(GUEST_TOKEN_ENDPOINT, {
      method: "post",
      headers: {
        "user-agent": USER_AGENT,
        authorization: TWITTER_GUEST_TOKEN
      }
    }).then((res) => res.json());
  }

  async _getGuestToken() {
    if (!this.guestToken) {
      const data = await this._fetchGuestToken();
      this.guestToken = data["guest_token"];
    }
    return this.guestToken;
  }

  // TODO: Renew client token when errors
  // eslint-disable-next-line no-unused-vars
  async getPost(match, options, isRetry = false) {
    const id = match[2];
    const twitfix = match[1];
    if (!options.flags.has(GuildFlags.FLAGS.PARSE_TWITFIX) && twitfix === "fx") return null;
    if (twitfix === "fx" && options.mode === EmbedModes.VIDEO_REPLY) return null;
    return fetch(TWEET_ENDPOINT(id), {
      headers: {
        "user-agent": USER_AGENT,
        authorization: TWITTER_GUEST_TOKEN,
        "x-guest-token": await this._getGuestToken()
      }
    })
      .then((res) => res.text())
      .then((res) => {
        let parsed;
        try {
          parsed = JSON.parse(res);
        } catch (error) {
          throw new ClientError("Error parsing JSON", "Twitter");
        }
        if (parsed.errors) {
          if (parsed.errors.filter((error) => error.code === 239) && !isRetry) {
            console.log("Renewing Twitter guest token");
            this.guestToken = null;
            return this.getPost(match, options, true);
          }
          throw new TwitterErrorList(parsed.errors.map((err) => new TwitterError(err)));
        }
        return parsed;
      })
      .then((conversation) => {
        if (!conversation?.globalObjects?.tweets) {
          throw new ClientError(`Didn't recieve conversation data; ID:${id}`, "Twitter");
        }
        const tweets = conversation.globalObjects.tweets;
        if (!tweets[id]) {
          throw new ClientError(`Didn't recieve tweet data; ID:${id}`, "Twitter");
        }
        const tweetIndex = tweets[id].retweeted_status_id_str ?? id;
        const tweet = new TwitterPost(tweets[tweetIndex]);
        tweet.addUserData(conversation.globalObjects.users[tweet.userID]);
        if (!tweet.videoUrl) return null;
        return tweet;
      });
  }
}

module.exports = new TwitterClient();
