const { sh } = require("../util/Utils");
const TikTokPost = require("./TikTokPost");

class TikTokClient {
  async getPost(match) {
    const url = match[0];
    // This should be safe as our regexes earlier prevent any weirdness
    return await sh(`yt-dlp '${url.replace(/'/g, '\'\\\'\'')}' -j`).then((stdout)=>{
      return new TikTokPost(JSON.parse(stdout))
    });
  }
}

module.exports = new TikTokClient();
