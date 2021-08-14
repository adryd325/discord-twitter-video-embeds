const fetch = require("node-fetch");
const ClientError = require("./ClientError");
const RedditClient = require("./RedditClient");
const { USER_AGENT } = require("../util/Constants");

module.exports.getPost = function getPost(match) {
  const url = match[0];
  return fetch(url, {
    method: "HEAD",
    headers: {
      "User-Agent": USER_AGENT
    },
    redirect: "follow"
  }).then((response) => {
    if (response.status !== 200) throw new ClientError(`HTTP ${response.status} while fetching post`, "Reddit");
    // Replicate what a match from our regex would look like without executing the regex
    return RedditClient.getPost([response.url, response.url.replace(/^https?:\/\/(?:[^/]+\.)?reddit\.com/, "")]);
  });
};
