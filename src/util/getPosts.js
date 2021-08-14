const { URLRegexes, EmbedModes, Providers } = require("./Constants");
const clients = require("./clients");
const { logChannel } = require("../index.js");
const ClientError = require("../structures/ClientError");
const GuildFlags = require("../structures/GuildFlags");
const TwitterError = require("../structures/TwitterError");
const TwitterErrorList = require("../structures/TwitterErrorList");

async function getPost(mdMatch, options, spoiler) {
  // Make sure our URL is actually valid
  let url;
  try {
    url = new URL(mdMatch.content);
  } catch (error) {
    return null;
  }

  // Find which provider we're using and match
  let provider;
  let match;
  for (const [tmpProvider, regex] of Object.entries(URLRegexes)) {
    const tmpMatch = url.href.match(regex);
    if (tmpMatch) {
      provider = tmpProvider;
      match = tmpMatch;
    }
  }

  // If we don't have a provider, return null
  if (!provider) return null;

  // TWITTER_ONLY flag
  if (options.flags.has(GuildFlags.FLAGS.TWITTER_ONLY)) {
    if (provider !== Providers.TWITTER) return null;
  }

  // If we do have a provider, call getPost
  let post;
  try {
    const providerClient = clients.get(provider);
    if (!providerClient) return null;
    post = await providerClient.getPost(match, options);
  } catch (error) {
    if (error instanceof ClientError || error instanceof TwitterError || error instanceof TwitterErrorList) {
      if (logChannel && error instanceof TwitterErrorList) {
        logChannel.send("<@842601826674540574> bitch there a error in da console");
      }
      console.error(error);
      return null;
    }
    throw error;
  }

  // In the case a post doesn't meet our criteria (eg. not a video)
  if (!post) return null;

  // TIKTOK and TIKTOK_REDIRECT need to be downloadded with a cookie and origin
  // INSTAGRAM video urls are just borked in Discord
  // RE_EMBED and RE_COMPOSE don't have scraping since we provide our own embeds
  const needsAttachment =
    provider === Providers.INSTAGRAM ||
    provider === Providers.TIKTOK ||
    provider === Providers.TIKTOK_REDIRECT ||
    options.mode === EmbedModes.RE_EMBED ||
    options.mode === EmbedModes.RE_COMPOSE;

  // Only fetch attachment if needed
  // My poor bandwidth
  let attachment;
  if (needsAttachment) {
    attachment = post.getDiscordAttachment();
  }

  return {
    embed: post.getDiscordEmbed(),
    url: post.url,
    videoUrl: post.videoUrl ?? null,
    spoiler,
    needsAttachment,
    attachment
  };
}

module.exports = function getPosts(syntaxTree, options, spoiler = false) {
  const tweets = [];
  for (const matchIndex in syntaxTree) {
    const match = syntaxTree[matchIndex];
    switch (match.type) {
      case "url":
        // If we're the last syntax element in a spoiler, do not embed. This mimics Discord's behaviour
        if (spoiler && parseInt(matchIndex) === syntaxTree.length - 1) continue;
        tweets.push(getPost(match, options, spoiler));
        break;
      case "spoiler":
        // Run this function again but with spoiler as true
        tweets.push(...getPosts(match.content, options, true));
        break;
    }
  }
  return tweets;
};
