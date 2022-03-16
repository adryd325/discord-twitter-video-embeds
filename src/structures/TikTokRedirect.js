const fetch = require("node-fetch");
const TikTokClient = require("./TikTokClient");
const { USER_AGENT } = require("../util/Constants");

class TikTokRedirect {
  async getPost(match) {
    const url = match[0];
    // Just follow the damn redirect
    fetch(url, {
      headers: {
        "User-Agent": USER_AGENT
      },
      redirect: "manual"
    }).then((response) => {
      if (response.status === 301 || response.status === 302) {
        const locationURL = new URL(response.headers.get("location"), response.url);
        return TikTokClient.getPost([locationURL]);
      }
    });
  }
}

module.exports = new TikTokRedirect();
