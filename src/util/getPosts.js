const { URLRegexes, EmbedModes, Providers } = require("./Constants");
const clients = require("./clients");
const log = require("./log");
const ClientError = require("../structures/ClientError");
const TwitterError = require("../structures/TwitterError");
const TwitterErrorList = require("../structures/TwitterErrorList");
const PlatformFlags = require("../structures/PlatformFlags");

async function getPost(mdMatch, options, spoiler) {
  // Make sure our URL is actually valid
  let url;
  try {
    url = new URL(mdMatch.content);
    log.verbose("getPosts", `Got URL: ${url.href}`);
  } catch (error) {
    log.error("getPosts", error);
    return null;
  }

  // Find which provider we're using and match
  let provider;
  let match;
  for (const [tmpProvider, regex] of Object.entries(URLRegexes)) {
    const tmpMatch = url.href.match(regex);
    if (tmpMatch) {
      log.verbose("getPosts", `Matched tmpProvider:${tmpProvider} and tmpMatch:${tmpMatch} with regex:${regex}`);
      provider = tmpProvider;
      match = tmpMatch;
    } else {
      log.verbose("getPosts", `Did not match for for url: ${url.href} with regex:${regex}`);
    }
  }

  // If we don't have a provider, return null
  if (!provider) return null;

  switch (provider) {
    case Providers.TWITTER:
    case Providers.X_DOT_COM:
      if (!options.platforms.hasFlag(PlatformFlags.Flags.TWITTER)) {
        return null;
      }
      break;
    case Providers.REDDIT:
    case Providers.REDDIT_VIDEO:
      if (!options.platforms.hasFlag(PlatformFlags.Flags.REDDIT)) {
        return null;
      }
      break;
    case Providers.INSTAGRAM:
      if (!options.platforms.hasFlag(PlatformFlags.Flags.INSTAGRAM_FACEBOOK)) {
        return null;
      }
      break;
    case Providers.TIKTOK:
    case Providers.TIKTOK_REDIRECT:
      if (!options.platforms.hasFlag(PlatformFlags.Flags.TIKTOK)) {
        return null;
      }
      break;
    default:
      throw new Error("No matching provider flags???");
  }

  // If we do have a provider, call getPost
  let post;
  try {
    const providerClient = clients.get(provider);
    if (!providerClient) return null;
    post = await providerClient.getPost(match, options);
  } catch (error) {
    if (error instanceof ClientError || error instanceof TwitterError || error instanceof TwitterErrorList) {
      log.error("getPosts", error);
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
  if (needsAttachment || provider == Providers.TWITTER || provider == Providers.X_DOT_COM) {
    if (post.getDiscordAttachments) {
      attachment = post.getDiscordAttachments(spoiler);
    } else {
      attachment = [post.getDiscordAttachment(spoiler)];
    }
  }

  return {
    embed: post.getDiscordEmbed(),
    url: post.url,
    videoUrl: post.videoUrl ?? null,
    provider,
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
