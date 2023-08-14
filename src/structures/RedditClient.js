const fetch = require("node-fetch");
const ClientError = require("./ClientError");
const RedditPost = require("./RedditPost");
const { USER_AGENT } = require("../util/Constants");

// https://github.com/ytdl-org/youtube-dl/blob/master/youtube_dl/extractor/reddit.py
class RedditClient {
  async getPost(match) {
    const permalink = match[1];
    const url = `https://old.reddit.com${permalink}`;
    const jsonURL = url + "/.json";
    return fetch(jsonURL, {
      headers: {
        "User-Agent": USER_AGENT
      }
    })
      .then((response) => {
        if (response.status !== 200) throw new ClientError(`HTTP ${response.status} while fetching post`, "Reddit");
        return response.json();
      })
      .catch((a) => {
        if (a?.type != "invalid-json") {
          throw a;
        }
      })
      .then((json) => {
        if (!json[0].data.children[0].data.url) return null;
        if (!json[0].data.children[0].data.is_video) return null;
        return new RedditPost(json[0].data.children[0].data);
      });
  }
}

module.exports = new RedditClient();
