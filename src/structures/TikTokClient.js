const TikTokPost = require("./TikTokPost");
const { sh } = require("../util/Utils");

class TikTokClient {
  async getPost(match) {
    const url = match[0];
    // This should be safe as our regexes earlier prevent any weirdness
    try {
      return await sh(`yt-dlp '${url.replace(/'/g, "'\\''")}' -j`).then((stdout) => {
        return new TikTokPost(JSON.parse(stdout));
      });
    } catch (ignored) {
      // ignored
    }
    return;
  }
}

module.exports = new TikTokClient();
