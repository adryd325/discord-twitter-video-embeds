const Discord = require("eris");
const fs = require("fs");
const childProcess = require("child_process");

const config = JSON.parse(fs.readFileSync("./config.json"));
const discord = new Discord(config.token);

let logChannel;

const twitterURLRegexGlobal =
  /https?:\/\/((mobile|www)\.)?twitter\.com\/[a-zA-Z0-9_]+\/status\/([0-9]+)/g;
const twitterURLRegex =
  /https?:\/\/((mobile|www)\.)?twitter\.com\/[a-zA-Z0-9_]+\/status\/([0-9]+)/;

async function twitterDownload(twitterURL) {
  // Just in case there's something I overlooked in the regex that would allow code execution
  // This is still hacky af, but I don't care, if you find an RCE with just numbers, you deserve it
  const tweetID = twitterURLRegex.exec(twitterURL)[3];
  const safeTwitterURL = `https://twitter.com/i/status/${tweetID}`;
  return new Promise((resolve) => {
    childProcess.exec(
      `youtube-dl --get-url ${safeTwitterURL}`,
      (stderr, stdout) => {
        resolve(stdout);
      }
    );
  });
}

async function handleMessage(message) {
  // If the message doesn't have content, or if we're reading our own message
  if (!message.content || message.author.id === discord.user.id 
    // Block bots, but reply to hiddenphox (quote rt unrolling)
    || (message.author.bot && message.author.id !== "152172984373608449") 
  ) {
    return;
  }
  const matches = message.content.match(twitterURLRegexGlobal);
  // If there are no Twitter URLs, we don't need to do anything
  if (!matches) {
    return;
  }
  const videoURLs = [];
  for (let index = 0; index < matches.length; index++) {
    videoURLs.push(await twitterDownload(matches[index]));
  }
  const reply = videoURLs.join("");
  // Make sure we're not sending an empty message somehow
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
  discord.editStatus("online", {name: "adryd.co/twitter-embeds"});
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
    logChannel.createMessage(`:tada: New guild: ${guild.name}`)
  }
})

discord.connect();
