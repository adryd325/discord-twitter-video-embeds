import {
	Client,
	Intents,
	GuildChannel,
	ThreadChannel,
	TextChannel,
	DiscordAPIError,
	Constants as DiscordConstants
} from "discord.js";
import modeCommand from "./commands/mode.js";
import { TWITTER_URL_REGEXP, USER_AGENT, QRT_UNROLL_BOTS, EmbedModes, DELETE_MESSAGE_EMOJIS } from "./constants.js";
import database from "./database.js";
import reCompose from "./handlers/reCompose.js";
import reEmbed from "./handlers/reEmbed.js";
import videoReply from "./handlers/videoReply.js";
import { parse } from "./parser.js";
import InteractionHandler from "./structures/InteractionHandler.js";
import { getMessageOwner } from "./structures/MessageMappings.js";
import { getMode, setMode } from "./structures/ModeMappings.js";
import TwitterClient from "./structures/TwitterClient.js";
import TwitterErrorList from "./structures/TwitterErrorList.js";

const { APIErrors } = DiscordConstants;

export const discord = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_WEBHOOKS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGES
	],
	allowedMentions: {
		parse: [],
		repliedUser: false
	},
	partials: ["MESSAGE", "CHANNEL", "USER", "REACTION"]
});

let logChannel;

export const interactionHandler = new InteractionHandler(discord);
interactionHandler.registerCommand(modeCommand);

/** @param {import("./structures/Tweet")} tweet */
/** @param {Object} match */
/** @param {Boolean} spoiler */
/** @returns {Promise<Object>} */
async function hackyMakeTweetPromise(tweet, match, spoiler) {
	try {
		const resolvedTweet = await tweet;
		return { spoiler, tweet: resolvedTweet, match };
	} catch (error) {
		if (error instanceof TwitterErrorList) {
			return;
		}
	}
}

/** @param {Array} syntaxTree */
/** @param {TwitterClient} twitterClient */
/** @param {Boolean} spoiler */
/** @returns {Array<Promise>} */
function getTweets(syntaxTree, twitterClient, spoiler = false) {
	const tweets = [];
	for (const mdEntryIndex in syntaxTree) {
		const mdEntry = syntaxTree[mdEntryIndex];
		switch (mdEntry.type) {
			case "tweet":
				// If we're the last syntax element in a spoiler, do not embed. This mimics Discord's behaviour
				if (spoiler && parseInt(mdEntryIndex) === syntaxTree.length - 1) continue;
				// This is a promise to avoid a tangled code mess later
				tweets.push(hackyMakeTweetPromise(twitterClient.asyncGetTweet(mdEntry.id), mdEntry, spoiler));
				break;
			case "spoiler":
				tweets.push(...getTweets(mdEntry.content, twitterClient, true));
				break;
		}
	}
	return tweets;
}

/** @param {Array} syntaxTree */
/** @param {Boolean} spoiler */
/** @returns {boolean} */
function hasUnembedableLinks(syntaxTree, spoiler) {
	for (const mdEntryIndex in syntaxTree) {
		const mdEntry = syntaxTree[mdEntryIndex];
		switch (mdEntry.type) {
			case "url":
				// If we're the last syntax element in a spoiler, do not embed. This mimics Discord's behaviour
				if (spoiler && parseInt(mdEntryIndex) === syntaxTree.length - 1) continue;
				return true;
			case "spoiler":
				if (hasUnembedableLinks(mdEntry.content, spoiler)) return true;
				break;
		}
	}
}

discord.on("ready", () => {
	console.log("Ready!");
	discord.application.commands.set(interactionHandler.getCommands());
	discord.user.setPresence({
		status: "online",
		activities: [{ name: process.env.STATUS ?? "adryd.co/twitter-embeds", type: 0 }]
	});
	// @ts-ignore
	const channel = discord.channels.cache.get(process.env.LOG_CHANNEL);
	if (!(channel instanceof TextChannel)) {
		throw new Error("`process.env.LOG_CHANNEL` must be a text channel");
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
	// get the embed mode in the background (getMode returns a promise)
	let embedMode = getMode(message.channel);
	const syntaxTree = parse(message.content);
	const twitterClient = new TwitterClient(USER_AGENT);
	const tweets = getTweets(syntaxTree, twitterClient);
	if (hasUnembedableLinks(syntaxTree)) {
		// Oops embedMode is a promise above and im not awaiting immediately so things can run in the background
		embedMode = new Promise((resolve) => resolve(EmbedModes.VIDEO_REPLY));
	}
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
		try {
			await messageReaction.message.delete();
		} catch (error) {
			if (error instanceof DiscordAPIError) {
				switch (error.code) {
					case APIErrors.UNKNOWN_MESSAGE:
						console.log("Failed to delete message from reaction delete (Unknown Message)");
						break;
					case APIErrors.MISSING_PERMISSIONS:
						console.log("Failed to delete message from reaction delete (Missing Permissions");
						break;
				}
			}
		}
	}
});

discord.on("interactionCreate", (interaction) => {
	interactionHandler.handle(interaction);
});

/** @param {import("discord.js").Guild} guild*/
discord.on("guildCreate", (guild) => {
	if (logChannel) {
		const safeName = guild.name.replace(/(@everyone|@here|<|>)/g, "\\$&");
		logChannel.send(`:tada: New guild: ${guild.memberCount} members; ${guild.id}:${safeName}`);
	}
	// Most popular mode, even though my poor bandwidth hates it ;-;
	setMode(guild, EmbedModes.REEMBED);
});

discord.on("error", (error) => {
	console.log(error);
});

(async function init() {
	await database.sync();
	discord.login(process.env.TOKEN);
})();
