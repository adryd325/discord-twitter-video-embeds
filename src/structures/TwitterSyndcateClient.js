const fetch = require("node-fetch");
// const ClientError = require("./ClientError");
const ClientError = require("./ClientError");
const GuildFlags = require("./GuildFlags");
const TwitterPost = require("./TwitterSyndicatePost");
const { EmbedModes } = require("../util/Constants");
const log = require("../util/log");

const TWEET_ENDPOINT = (tweetID) => `https://cdn.syndication.twimg.com/tweet-result?id=${tweetID}`;

class TwitterSyndicateClient {
  // TODO: Renew client token when errors
  // eslint-disable-next-line no-unused-vars
  async getPost(match, options, isRetry = false) {
    const id = match[2];
    const twitfix = match[1];
    if (!options.flags.has(GuildFlags.FLAGS.PARSE_TWITFIX) && twitfix === "fx") return null;
    if (twitfix === "fx" && options.mode === EmbedModes.VIDEO_REPLY) return null;
    
    return fetch(TWEET_ENDPOINT(id), {
      headers: {
        "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)"
      }
    })
      .then((res) => {
        if (res.status !== 200) throw new ClientError(`HTTP ${res.status} while fetching post`, "Twitter");
        return res.text()
      })
      .then((res) => {
        let parsed;
        try {
          parsed = JSON.parse(res);
        } catch (error) {
          throw new ClientError("Error parsing JSON", "Twitter");
        }
        return parsed;
      })
      .then((tweetData) => {
        const tweet = new TwitterPost(tweetData);
        if (!tweet.videoUrl) return null;
        return tweet;
      });
  }
}

module.exports = new TwitterSyndicateClient();
