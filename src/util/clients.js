const RedditClient = require("../structures/RedditClient");
const RedditVideo = require("../structures/RedditVideo");
const TikTokClient = require("../structures/TikTokClient");
const TwitterClient = require("../structures/TwitterClient");

const clients = new Map();

clients.set("REDDIT", RedditClient);
clients.set("REDDIT_VIDEO", RedditVideo);
clients.set("TIKTOK", TikTokClient);
clients.set("TIKTOK_REDIRECT", TikTokClient);
clients.set("TWITTER", TwitterClient);

module.exports = clients;
