const InstagramPost = require("./InstagramPost");
const { sh } = require("../util/Utils");
const log = require("../util/log");
const { snapsave } = require('@bochilteam/scraper');

class InstagramClient {
  async getPost(match) {
    var urlMatch = match[0];
    log.verbose("InstagramClient", `Got urlMatch: ${urlMatch}`);
    // This should be safe as our regexes earlier prevent any weirdness
    try {
      if(urlMatch.includes("/reels/")){
        urlMatch = urlMatch.replace('/reels/', '/p/');
      }
      if(urlMatch.includes("/reel/")){
        urlMatch = urlMatch.replace('/reel/', '/p/');
      }
      if(urlMatch.includes("/tv/")){
        urlMatch = urlMatch.replace('/tv/', '/p/');
      }
      const url = urlMatch;
      var shellCommand = `yt-dlp --cookies data/cookies.txt '${url.replace(/'/g, "'\\''")}' -j`;
      if(urlMatch.includes("facebook.com")){
        shellCommand = `yt-dlp '${url.replace(/'/g, "'\\''")}' -j`;
      }
      log.verbose("InstagramClient", `Got url: ${url}`);
      return await sh(shellCommand).then((stdout) => {
        log.verbose("InstagramClient", `Got stdout: ${stdout}`);
        return new InstagramPost(JSON.parse(stdout));
      });
    } catch (ignored) {
      log.error("InstagramClient", ignored);
      try{
        var newObj = {};
        newObj.scraper = true;
        newObj.original_url = url;
        newObj.scraping = await snapsave(url);
        let scraping_string = JSON.stringify(newObj, null, 2);
        log.verbose("InstagramClient", `Got scraping: ${scraping_string}`);
        return new InstagramPost(newObj);
      }catch(err2){
        log.error("InstagramClient", err2);
      }
      // ignored
    }
    return;
  }
}

module.exports = new InstagramClient();
