import { Client, Intents, GuildChannel } from "discord.js";
import { TWITTER_URL_REGEXP, USER_AGENT, EmbedModes } from "./constants.js";
import { parse } from "./parser.js";
import { TwitterClient } from "./structures/TwitterClient.js";

const discord = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_WEBHOOKS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  ],
});

function getTweets(parsedData, twitterClient, spoiler = false) {
  let tweets = [];
  for (let mdEntryIndex in parsedData) {
    let mdEntry = parsedData[mdEntryIndex];
    switch (mdEntry.type) {
    case "tweet":
      tweets.push({ spoiler, tweet: twitterClient.getTweet(mdEntry.id) });
      break;
    case "spoiler":
      tweets.push(...getTweets(mdEntry.content, twitterClient, true));
      break;
    }
  }
  return tweets;
}

async function videoReply(tweets, message) {
  // wait for these to all be resolved before getting urls
  await Promise.all(
    tweets.map((tweet) => {
      return tweet.tweet;
    })
  );
  const preparedLinks = tweets.map(async (tweet) => {
    // get best video
    const bestVideo = (await tweet.tweet).bestVideo;
    if (!bestVideo) return "";
    const videoUrl = bestVideo[0].url;
    // spoiler the video if needed
    return tweet.spoiler ? "|| " + videoUrl + " ||" : videoUrl;
  });
  // await all the links and join
  const messageContent = (await Promise.all(preparedLinks)).join(" ");
  if (messageContent.length === 0) return;
  message.channel.send(messageContent);
}

function reEmbed(tweets, message) {}

discord.on("messageCreate", (message) => {
  let embedMode = "1";
  // If the message doesn't have content
  if (!message.content) return;
  // Do not respond to ourselves
  if (message.author.id === discord.user.id) return;
  // Block bots, but reply to hiddenphox (quote rt unrolling)
  if (message.author.bot && message.author.id !== "152172984373608449") return;
  // If we're in a guild (TextChannel)
  if (message.channel instanceof GuildChannel) {
    // Check to make sure we have permission to send in the channel we're going to send
    if (!message.channel.permissionsFor(discord.user.id).has("SEND_MESSAGES")) return;
    // Check that the user sending the message has permissions to embed links
    if (!message.channel.permissionsFor(message.author.id).has("EMBED_LINKS")) return;
  }
  if (!message.content.match(TWITTER_URL_REGEXP)) return;

  const parsedData = parse(message.content);
  const twitterClient = new TwitterClient(USER_AGENT);
  const tweets = getTweets(parsedData, twitterClient);

  // In case a tweet matched before but doesn't pass propper parsing
  if (tweets.length === 0) return;

  // Until we have the database set up, we'll use process.env
  switch (embedMode) {
  case EmbedModes.OFF:
    return;
  case EmbedModes.VIDEO_REPLY:
    videoReply(tweets, message);
    break;
  case EmbedModes.REEMBED:
    // We can't re-embed in a DM channel
    if (!(message.channel instanceof GuildChannel)) break;
    // Can't clear embeds without manage messages permission
    if (!message.channel.permissionsFor(discord.user.id).has("MANAGE_MESSAGES")) break;
    reEmbed(tweets, message);
    break;
  case EmbedModes.RECOMPOSE:
    return;
  default:
    videoReply(tweets, message);
  }
});

discord.login(process.env.TOKEN);
