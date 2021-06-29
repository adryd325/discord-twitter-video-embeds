import * as Discord from "eris";
import * as fs from "fs";
import { TwitterClient, TwitterErrorList } from "./twitter.js";

const discord = new Discord.Client(process.env.TOKEN, {
  intents: ["guilds", "guildMessages", "directMessages"],
});

/** @type {Discord.TextChannel} */
let logChannel;

const userAgent = `discord-twitter-video-embeds (https://github.com/adryd325/discord-twitter-video-embeds, https://adryd.co/twitter-embeds)`;
const TWITTER_URL_REGEXP = /(?<!<)https?:\/\/(?:(?:mobile|www)\.)?twitter\.com\/[a-zA-Z0-9_]+\/status\/([0-9]{1,32})(?:\?s=\d{1,2})?/g;
const SPOILER_REGEXP = /\|\|([\s\S]+?)\|\|/g;

/**
 * @param {string} id
 * @param {TwitterClient} twitter twitter
 **/
async function getVideoURL(id, twitter) {
  try {
    const videos = await twitter.getVideos(id);
    return videos?.[0]?.url;
  } catch (error) {
    if (error instanceof TwitterErrorList) {
      error.errors.forEach((err) => {
        // Ignore page does not exist error
        if (err.code !== 34) {
          handleError(err);
        }
      });
    } else {
      handleError(error);
    }
  }
}

/** @param {Discord.Message} message */
async function handleMessage(message) {
  // If the message doesn't have content
  if (!message.content) return;
  // Do not respond to ourselves
  if (message.author.id === discord.user.id) return;
  // Block bots, but reply to hiddenphox (quote rt unrolling)
  if (message.author.bot && message.author.id !== "152172984373608449") return;
  // If we're in a guild (TextChannel)
  if (message.channel instanceof Discord.TextChannel) {
    // Check to make sure we have permission to send in the channel we're going to send
    if (!message.channel.permissionsOf(discord.user.id).has("sendMessages")) return;
    // Check that the user sending the message has permissions to embed links
    if (!message.channel.permissionsOf(message.author.id).has("embedLinks")) return;
  }
  // if the channel is currently unsupported by eris (Threads)
  if (!message.channel.createMessage) return;

  // this is the simplest way I could think of for doing this, I guess it also resolves duplicates.
  // it's not optimal but i refuse to write a propper parser for this
  let twitterLinks = [];
  [...message.content.matchAll(TWITTER_URL_REGEXP)].forEach((match) => {
    const id = match[1];
    if (!twitterLinks.find((twitterLink) => twitterLink.id === id)) {
      twitterLinks.push({
        id,
        spoiler: false,
      });
    }
  });

  const spoilers = [...message.content.matchAll(SPOILER_REGEXP)].map((match) => [
    ...match[1].matchAll(TWITTER_URL_REGEXP),
  ]);
  spoilers.forEach((matches) => {
    matches.forEach((match) => {
      const id = match[1];
      const index = twitterLinks.findIndex((twitterLink) => twitterLink.id === id);
      if (index !== null) {
        twitterLinks[index].spoiler = true;
      }
    });
  });

  // Make sure we have at least one link so we don't create uneeded twitter instances
  if (twitterLinks.length === 0) return;
  const twitter = new TwitterClient(userAgent);

  // Match the URL
  // then get the video url for each id
  const promises = twitterLinks?.map((twitterLink) => {
    return getVideoURL(twitterLink.id, twitter);
  });

  // Wait for all the video url fetches to finish asynchronously
  const urls = await Promise.all(promises);
  twitterLinks = twitterLinks.map((link, index) => {
    return {
      ...link,
      url: urls[index],
      sendUrl: link.spoiler ? "|| " + urls[index] + " ||" : urls[index],
    };
  });
  twitterLinks = twitterLinks.filter((link) => link.url !== undefined);

  const response = twitterLinks
    .map((link) => {
      return link.sendUrl;
    })
    .join("\n");

  // Make sure we're not sending an empty message if no links have videos
  if (response.length === 0) {
    return;
  }

  message.channel.createMessage({
    content: response,
    messageReference: {
      channelID: message.channel.id,
      messageID: message.id,
    },
  });
}

discord.on("messageCreate", handleMessage);

discord.on("ready", () => {
  console.log("ready");
  discord.editStatus("online", { name: process.env.STATUS ?? "adryd.co/twitter-embeds", type: 0 });
  let channel = discord.getChannel(process.env.LOG_CHANNEL);
  if (!(channel instanceof Discord.TextChannel)) {
    throw new Error("`config.logChannel` must be a text channel");
  }
  logChannel = channel;
  logChannel.createMessage("Ready!");
  // Test code
  /* handleMessage({
    content: "https://twitter.com/yonasawa/status/1374689368980385801?s=20",
    author: {
      id: "authorID",
    },
    channel: {
      id: "channelID",
      createMessage: function createMessage(content) {
        console.log(content);
      },
    },
    id: "messageID",
  }); */
});

/** @param {Error} error */
function handleError(error) {
  if (logChannel) {
    try {
      logChannel.createMessage(`ERROR: \`${error.message}\``);
    } catch (e) {
      console.error(error);
    }
  } else {
    console.error(error);
  }
}

discord.on("error", handleError);
discord.on("warn", handleError);

/** @param {Discord.Guild} message */
discord.on("guildCreate", (guild) => {
  if (logChannel) {
    const safeName = guild.name.replace(/<@/g, "<@\u200b");
    logChannel.createMessage(`:tada: New guild: ${guild.memberCount} members; ${guild.id}:${safeName}`);
  }
});

discord.connect();
