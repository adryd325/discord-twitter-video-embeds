const InstagramClient = require("../structures/InstagramClient");
const RedditClient = require("../structures/RedditClient");
const RedditVideo = require("../structures/RedditVideo");
const TikTokClient = require("../structures/TikTokClient");
const TikTokRedirect = require("../structures/TikTokRedirect");
const TwitterSyndcateClient = require("../structures/TwitterGraphQLGuestClient");

const clients = new Map();

clients.set("REDDIT", RedditClient);
clients.set("REDDIT_VIDEO", RedditVideo);
clients.set("TIKTOK", TikTokClient);
clients.set("TIKTOK_REDIRECT", TikTokRedirect);
clients.set("INSTAGRAM", InstagramClient);
clients.set("TWITTER", TwitterSyndcateClient);
clients.set("X_DOT_COM", TwitterSyndcateClient);

module.exports = clients;
