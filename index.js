import * as Discord from "eris";
import * as fs from "fs";
import { TwitterClient, TwitterErrorList } from "./twitter.js";

const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const discord = new Discord.Client(config.token);

/** @type {Discord.TextChannel} */
let logChannel;

const TWITTER_URL_REGEX =
  /(?<!<|\|\|)https?:\/\/(?:(?:mobile|www)\.)?twitter\.com\/[a-zA-Z0-9_]+\/status\/([0-9]+)/gm;

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

  // There have been times where the bot has crashed because message.channel.createMessage is underfined????
  if (!message.channel.createMessage) {
    // try to catch whatever bug is happening
    console.log("--- BEGIN BROKEN MESSAGE ---")
    console.log("message:")
    console.log(message);
    console.log("message.channel:")
    console.log(message.channel);
    console.log("--- END BROKEN MESSAGE ---")
    return;
  }

  const matches = [...message.content.matchAll(TWITTER_URL_REGEX)];

  // Make sure we have at least one link so we don't create uneeded twitter instances
  if (matches.length === 0) return;

  const twitter = new TwitterClient(
    `Discord twitter video embeds // adryd.co/twitter-embeds`
  );

  // Match the URL
  // then get the video url for each id
  const promises = matches?.map((m) => {
    return getVideoURL(m[1], twitter);
  });

  // Wait for all the video url fetches to finish asynchronously
  const urls = await Promise.all(promises);
  const response = urls.filter((url) => url !== undefined).join("\n");

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
  discord.getChannel(config.logChannel);
  discord.editStatus("online", { name: "adryd.co/twitter-embeds" });
  let channel = discord.getChannel(config.logChannel);
  if (!(channel instanceof Discord.TextChannel)) {
    throw new Error("`config.logChannel` must be a text channel");
  }
  logChannel = channel;
  logChannel.createMessage("Ready!");
  // Test code
  /* handleMessage({
    content: "https://twitter.com/crimsonruinz/status/1393126235606183939?s=20",
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

discord.on("guildCreate", (guild) => {
  if (logChannel) {
    const safeName = guild.name.replace(/@/g, '@\u200b')
      .replace(/<#/g, '<#\u200b')
      .replace(/<:/g, '<:\u200b\u200b');
    logChannel.createMessage(`:tada: New guild: ${guild.id} ${safeName}`);
  }
});

discord.connect();
