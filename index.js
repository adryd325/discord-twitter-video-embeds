import Discord from "eris";
import fs from "fs";
import { TwitterClient, TwitterErrorList } from "./twitter.js";

const config = JSON.parse(fs.readFileSync("./config.json"));
const discord = new Discord(config.token);

const twitter = new TwitterClient(
  `Discord twitter video embeds // adryd.co/twitter-embeds`
);

let logChannel;

const TWITTER_URL_REGEX = /(?<!<|\|\|)https?:\/\/(?:(?:mobile|www)\.)?twitter\.com\/[a-zA-Z0-9_]+\/status\/([0-9]+)/gm;

/** @param {string} id */
async function getVideoURL(id) {
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

  // Match the URL
  // then get the video url for each id
  const promises = [...message.content.matchAll(TWITTER_URL_REGEX)]?.map(
    (m) => {
      return getVideoURL(m[1]);
    }
  );

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
  logChannel = discord.getChannel(config.logChannel);
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
