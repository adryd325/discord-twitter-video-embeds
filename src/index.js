import { Client, Intents, GuildChannel, ThreadChannel, TextChannel } from "discord.js";
import TwitterClient from "./structures/TwitterClient.js";
import { TWITTER_URL_REGEXP, USER_AGENT, QRT_UNROLL_BOTS, EmbedModes, DELETE_MESSAGE_EMOJIS } from "./constants.js";
import { parse } from "./parser.js";
import database from "./database.js";
import { getMode, setMode } from "./structures/ModeMappings.js";
import videoReply from "./handlers/videoReply.js";
import reEmbed from "./handlers/reEmbed.js";
import reCompose from "./handlers/reCompose.js";
import TwitterErrorList from "./structures/TwitterErrorList.js";
import { getMessageOwner } from "./structures/MessageMappings.js";
import InteractionHandler from "./structures/InteractionHandler.js";
import modeCommand from "./commands/mode.js";

export const discord = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_WEBHOOKS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGES,
	],
	allowedMentions: {
		parse: [],
		repliedUser: false,
	},
	partials: ["MESSAGE", "CHANNEL", "USER", "REACTION"],
});

let logChannel;
export const interactionHandler = new InteractionHandler(discord);

interactionHandler.registerCommand(modeCommand);

async function hackyMakeTweetPromise(spoiler, tweet, match) {
	try {
		const resolvedTweet = await tweet;
		return { spoiler, tweet: resolvedTweet, match };
	} catch (error) {
		if (error instanceof TwitterErrorList) {
			return;
		}
	}
}

function getTweets(syntaxTree, twitterClient, spoiler = false) {
	let tweets = [];
	for (let mdEntryIndex in syntaxTree) {
		let mdEntry = syntaxTree[mdEntryIndex];
		switch (mdEntry.type) {
			case "tweet":
				// If we're the last syntax element in a spoiler, do not embed. This mimics Discord's behaviour
				if (mdEntryIndex === syntaxTree.length) break;
				// This is a promise to avoid a tangled code mess later
				tweets.push(hackyMakeTweetPromise(spoiler, twitterClient.getTweet(mdEntry.id), mdEntry));
				break;
			case "spoiler":
				tweets.push(...getTweets(mdEntry.content, twitterClient, true));
				break;
		}
	}
	return tweets;
}

discord.on("ready", () => {
	console.log("ready");
	discord.application.commands.set(interactionHandler.getCommands());
	console.log("ready");
	discord.user.setPresence({
		status: "online",
		activities: [{ name: process.env.STATUS ?? "adryd.co/twitter-embeds", type: 0 }],
	});
	let channel = discord.channels.cache.get(process.env.LOG_CHANNEL);
	if (!(channel instanceof TextChannel)) {
		throw new Error("`config.logChannel` must be a text channel");
	}
	logChannel = channel;
	logChannel.send("Ready!");
});

/** @param {import("discord.js").Message} message */
discord.on("messageCreate", async (message) => {
	// If the message doesn't have content
	if (!message.content) return;
	// Do not respond to ourselves
	if (message.author.id === discord.user.id) return;
	// Make sure we have a Twitter URL, no point in parsing random people talking
	if (!message.content.match(TWITTER_URL_REGEXP)) return;
	// Block bots, but reply to HiddenPhox (quote rt unrolling)
	if (message.author.bot && !QRT_UNROLL_BOTS.includes(message.author.id)) return;
	// If we're in a guild (TextChannel)
	if (message.channel instanceof GuildChannel) {
		// Check to make sure we have permission to send in the channel we're going to send
		if (!message.channel.permissionsFor(discord.user.id).has("SEND_MESSAGES")) return;
		// Check that the user sending the message has permissions to embed links
		if (!message.channel.permissionsFor(message.author.id).has("EMBED_LINKS")) return;
	}
	const embedMode = getMode(message.channel);
	const syntaxTree = parse(message.content);
	const twitterClient = new TwitterClient(USER_AGENT);
	const tweets = getTweets(syntaxTree, twitterClient);

	// In case a tweet matched before but doesn't pass propper parsing
	if (tweets.length === 0) return;

	// Until we have the database set up, we'll use process.env
	switch (await embedMode) {
		case EmbedModes.OFF:
			break;
		case EmbedModes.RECOMPOSE:
			// We can't re-compose in a DM channel
			// I'm not optimistic that webhooks will work in threads
			if (message.channel instanceof GuildChannel && !(message.channel instanceof ThreadChannel)) {
				reCompose(tweets, message);
				break;
			}
		// eslint-disable-next-line no-fallthrough
		case EmbedModes.REEMBED:
			// We can't re-embed in a DM channel
			if (message.channel instanceof GuildChannel) {
				reEmbed(tweets, message);
				break;
			}
		// eslint-disable-next-line no-fallthrough
		case EmbedModes.VIDEO_REPLY:
			videoReply(tweets, message);
			break;

		default:
			videoReply(tweets, message);
	}
});

discord.on("messageReactionAdd", async (messageReaction, user) => {
	// If the user reacts with one of the delete message emojis
	if (!DELETE_MESSAGE_EMOJIS.includes(messageReaction.emoji.name)) return;
	const messageOwner = await getMessageOwner(messageReaction.message);
	// If we got nothing
	if (!messageOwner) return;
	// If the message owner is the one who reacted, delete
	if (messageOwner === user.id) {
		messageReaction.message.delete();
	}
});

discord.on("interactionCreate", (interaction) => {
	interactionHandler.handle(interaction);
});

/** @param {Discord.Guild} message */
discord.on("guildCreate", (guild) => {
	if (logChannel) {
		logChannel.send(`:tada: New guild: ${guild.memberCount} members; ${guild.id}:${guild.name}`);
	}
});

(async function init() {
	await database.sync();
	discord.login(process.env.TOKEN);
})();
