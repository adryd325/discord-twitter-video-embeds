const fetch = require("node-fetch");
const ClientError = require("./ClientError");
const TikTokPost = require("./TikTokPost");

const { TIKTOK_HOME, GENERIC_USER_AGENT } = require("../util/Constants.js");
const DATA_REGEXP = /<script[^>]+\bid=["']__NEXT_DATA__[^>]+>\s*({.+?})\s*<\/script/;

// https://github.com/ytdl-org/youtube-dl/blob/master/youtube_dl/extractor/tiktok.py
class TikTokClient {
  async _getCookies() {
    if (this.cookies) return this.cookies;
    return fetch(TIKTOK_HOME, {
      headers: {
        "User-Agent": GENERIC_USER_AGENT
      }
    }).then((response) => {
      if (response.status !== 200) throw new ClientError(`HTTP ${response.status} while fetching cookies`, "TikTok");
      let cookies = "";
      response.headers.raw()["set-cookie"].forEach((setCookie) => {
        cookies += setCookie.split(";")[0] + "; ";
      });
      this.cookies = cookies.trim();
      return this.cookies;
    });
  }

  async getPost(match) {
    const url = match[0];
    const cookies = await this._getCookies();
    return fetch(url, {
      headers: {
        Cookie: cookies,
        "User-Agent": GENERIC_USER_AGENT
      }
    })
      .then((response) => {
        if (response.status !== 200) throw new ClientError(`HTTP ${response.status} while fetching post`, "TikTok");
        return response.text();
      })
      .then((html) => {
        const match = html.match(DATA_REGEXP);
        if (!match) throw new ClientError("No match when parsing post", "TikTok");
        const pageProps = JSON.parse(match[1]).props.pageProps;
        if (!pageProps) throw new ClientError("No data", "TikTok");
        const data = pageProps.itemInfo.itemStruct;
        return new TikTokPost(data, cookies);
      });
  }
}

module.exports = new TikTokClient();
