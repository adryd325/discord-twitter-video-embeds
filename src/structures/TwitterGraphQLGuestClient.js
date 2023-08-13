const fetch = require("node-fetch");
// const ClientError = require("./ClientError");
const ClientError = require("./ClientError");
const GuildFlags = require("./GuildFlags");
const TwitterError = require("./TwitterError");
const TwitterErrorList = require("./TwitterErrorList");
const TwitterPost = require("./TwitterGuestPost");
const { EmbedModes, GENERIC_USER_AGENT } = require("../util/Constants");
const log = require("../util/log");

const TWITTER_GUEST_TOKEN =
  "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
const WEB_TWEET_ENDPOINT = (tweetID) => `https://twitter.com/LillianaFuture/${tweetID}`;
const GRAPHQL_TWEET_ENDPOINT = (tweetID, flags) => {
  return `https://twitter.com/i/api/graphql/0hWvDhmW8YQ-S_ib3azIrw/TweetResultByRestId?variables={"tweetId":"${tweetID}","withCommunity":false,"includePromotedContent":false,"withVoice":false}&features=${JSON.stringify(
    flags
  )}`;
};
const GUEST_TOKEN_REGEX = /gt=(\d+); Max-Age=\d+;/;
// https://github.com/ytdl-org/youtube-dl/blob/master/youtube_dl/extractor/twitter.py
class TwitterGuestClient {
  _fetchGuestToken(id) {
    return fetch(WEB_TWEET_ENDPOINT(id), {
      headers: {
        "user-agent": GENERIC_USER_AGENT
      },
      redirect: "manual"
    })
      .then((res) => {
        const headers = res.headers[Object.getOwnPropertySymbols(res.headers)[0]];
        const cookies = headers["set-cookie"] ? headers["set-cookie"] : [];
        this.cookie = "";
        cookies.forEach((setCookie) => {
          this.cookie += setCookie.split(";")[0] + "; ";
        });
        log.verbose("twitterClient", "got cookies");
        return fetch(WEB_TWEET_ENDPOINT(id), {
          headers: {
            "user-agent": GENERIC_USER_AGENT,
            cookie: this.cookie
          }
        });
      })
      .then((res) => res.text())
      .then((html) => {
        const match = GUEST_TOKEN_REGEX.exec(html);
        if (match != null && match[1] != null) {
          this.guestToken = match[1];
        }
        log.verbose("twitterClient", "got guest token");
        this.cookie += `gt=${this.guestToken}; `;
      });
  }

  _setFlags(error) {
    this.flags = {};
    error.message
      .replace("The following features cannot be null: ", "")
      .split(", ")
      .forEach((a) => (this.flags[a] = true));
  }

  // TODO: Renew client token when errors
  // eslint-disable-next-line no-unused-vars
  async getPost(match, options, isRetry = false) {
    const id = match[2];
    const twitfix = match[1] ? match[1] : "";
    if (!options.flags.has(GuildFlags.FLAGS.PARSE_TWITFIX) && twitfix != "") return "FX";
    if (twitfix != "" && options.mode === EmbedModes.VIDEO_REPLY) return "FX";
    if (this.guestToken == null) {
      await this._fetchGuestToken(id);
    }
    if (this.flags == null) {
      this.flags = {};
    }
    return fetch(GRAPHQL_TWEET_ENDPOINT(id, this.flags), {
      headers: {
        authorization: TWITTER_GUEST_TOKEN,
        "user-agent": GENERIC_USER_AGENT,
        cookie: this.cookie,
        "x-guest-token": this.guestToken
      }
    })
      .catch((a) => {
        if (a.type == "max-redirect") {
          this._fetchGuestToken(id);
          if (!isRetry) return this.getPost(match, options, true);
        } else {
          throw a;
        }
      })
      .then((res) => res.text())
      .then((res) => {
        let parsed;
        try {
          parsed = JSON.parse(res);
        } catch (error) {
          if (!isRetry) {
            this.guestToken = "";
            this.cookie = "";
            return this.getPost(match, options, true);
          }
          throw new ClientError("Error parsing JSON", "Twitter");
        }

        if (parsed.errors) {
          const validationError = parsed.errors.filter((error) => error.code === 336);
          if (
            validationError[0] &&
            validationError[0].message.startsWith("The following features cannot be null") &&
            !isRetry
          ) {
            log.info("TwitterClient", "Updating features");
            this._setFlags(validationError[0]);
            return this.getPost(match, options, true);
          }
          throw new TwitterErrorList(parsed.errors.map((err) => new TwitterError(err)));
        }

        if (!parsed?.data?.tweetResult?.result?.legacy) {
          throw new ClientError(`Didn't recieve conversation data; ID:${id}`, "Twitter");
        }
        const tweetData = parsed?.data?.tweetResult?.result?.legacy;
        if (!parsed?.data?.tweetResult?.result?.core?.user_results?.result?.legacy) {
          throw new ClientError(`Didn't recieve user data; ID:${id}`, "Twitter");
        }
        const user = parsed?.data?.tweetResult?.result?.core?.user_results?.result?.legacy;
        const tweet = new TwitterPost(tweetData);
        tweet.addUserData(user);
        if (!tweet.videoUrl && options.flags.has(GuildFlags.FLAGS.TWITTER_ONLY_VIDEO)) return null;
        return tweet;
      });
  }
}

module.exports = new TwitterGuestClient();
