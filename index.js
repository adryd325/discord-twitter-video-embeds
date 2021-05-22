import * as Discord from "eris";
import * as fs from "fs";
import { TwitterClient, TwitterErrorList } from "./twitter.js";

const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const discord = new Discord.Client(config.token);

/** @type {Discord.TextChannel} */
let logChannel;

const TWITTER_URL_REGEX = /(?<!<|\|\|)https?:\/\/(?:(?:mobile|www)\.)?twitter\.com\/[a-zA-Z0-9_]+\/status\/([0-9]+)/gm;

/**
 * @param {string} id
 * @param {TwitterClient} twitter
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
  // If the message doesn't have content, or if we're reading our own message
  if (
    !message.content ||
    message.author.id === discord.user.id ||
    // Block bots, but reply to hiddenphox (quote rt unrolling)
    (message.author.bot && message.author.id !== "152172984373608449")
  ) {
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

  const reply = urls.join("\n");

  // Make sure we're not sending an empty message if no links have videos
  if (reply.length === 0) {
    return;
  }

  message.channel.createMessage({
    content: reply,
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
    logChannel.createMessage(`:tada: New guild: ${guild.name}`);
  }
});

discord.connect();
