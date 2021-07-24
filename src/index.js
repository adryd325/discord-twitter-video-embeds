import { Client, Intents, GuildChannel, MessageAttachment, Message, Webhook } from "discord.js";
import fetch from "node-fetch";
import { TWITTER_URL_REGEXP, USER_AGENT, QRT_UNROLL_BOTS, EmbedModes } from "./constants.js";
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
	allowedMentions: {
		parse: [],
		repliedUser: false,
	},
});

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

async function hackyMakeTweetPromise(spoiler, tweet, match) {
	return { spoiler, tweet: await tweet, match };
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

/** @param {Promise[]} tweetPromises */
/** @param {Message} message */
async function videoReply(tweetPromises, message) {
	const tweets = await Promise.all(tweetPromises);
	// Make an array of urls, with spoiler marks if needed, then join them
	const content = tweets
		.map((tweet) => {
			if (!tweet.tweet.bestVideo) return;
			const videoUrl = tweet.tweet.bestVideo.url;
			return tweet.spoiler ? "|| " + videoUrl + " ||" : videoUrl;
		})
		.join(" ");
	// Make sure we're not sending an empty message
	if (content.length === 0) return;
	message.reply({ content });
}

/** @param {String} url */
/** @param {String} name */
async function getAttachment(url, name) {
	return new MessageAttachment(
		(
			await fetch(url, {
				headers: {
					"user-agent": USER_AGENT,
				},
			})
		).body,
		name
	);
}

/** @param {Promise[]} tweetPromises */
/** @param {Message} message */
async function reEmbed(tweetPromises, message) {
	const tweets = await Promise.all(tweetPromises);
	let content = "";
	const embeds = [];
	const downloads = [];
	tweets.map((tweet) => {
		if (!tweet.tweet.bestVideo) return;
		content += tweet.spoiler ? "|| " + tweet.tweet.url + " ||" : "";
		embeds.push(tweet.tweet.discordEmbed);
		downloads.push(
			getAttachment(tweet.tweet.bestVideo.url, (tweet.spoiler ? "SPOILER_" : "") + tweet.match.id + ".mp4")
		);
	});
	const files = await Promise.all(downloads);
	if (content === "") content = undefined;
	message.suppressEmbeds();
	message.reply({ content, embeds, files });
}

// TEMP WEBOOKS MAPPINGS
const webhookMappings = new Map();

/** @param {GuildChannel} channel */
async function getWebhook(channel) {
	if (webhookMappings.has(channel.id)) {
		return webhookMappings.get(channel.id);
	} else {
		throw new Error("Not Implemented");
	}
}

/** @param {Promise[]} tweetPromises */
/** @param {Message} message */
async function reCompose(tweetPromises, message) {
	const tweets = await Promise.all(tweetPromises);
	const webhook = await getWebhook(message.channel);
	let content = message.content;
	const embeds = [];
	const downloads = [];
	tweets.map((tweet) => {
		if (!tweet.tweet.bestVideo) return;
		content += tweet.spoiler ? "|| " + tweet.tweet.url + " ||" : "";
		embeds.push(tweet.tweet.discordEmbed);
		downloads.push(
			getAttachment(tweet.tweet.bestVideo.url, (tweet.spoiler ? "SPOILER_" : "") + tweet.match.id + ".mp4")
		);
		const urlRegExp = new RegExp(`(?<!<)${escapeRegExp(tweet.match.content)}(?!>)`);
		content.replace(urlRegExp, "$&");
	});
	const files = await Promise.all(downloads);
	if (content === "") content = undefined;
	message.delete();
	webhook.send({
		content,
		embeds,
		files,
		username: message.author.username,
		avatarURL: message.author.avatarURL({ format: "webp", size: 256 }),
		allowed_mentions: { parse: ["users"] },
	});
}

/** @param {Message} message */
discord.on("messageCreate", (message) => {
	// todo: attach to database
	let embedMode = "3";
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

	const syntaxTree = parse(message.content);
	const twitterClient = new TwitterClient(USER_AGENT);
	const tweets = getTweets(syntaxTree, twitterClient);

	// In case a tweet matched before but doesn't pass propper parsing
	if (tweets.length === 0) return;

	// Until we have the database set up, we'll use process.env
	switch (embedMode) {
		case EmbedModes.OFF:
			break;
		case EmbedModes.RECOMPOSE:
			// We can't re-compose in a DM channel
			// We can't delete message without manage messages permission
			// We can't create or send messages in channels we can't manage webhooks
			if (
				message.channel instanceof GuildChannel &&
				message.channel.permissionsFor(discord.user.id).has("MANAGE_MESSAGES") &&
				message.channel.permissionsFor(discord.user.id).has("MANAGE_WEBHOOKS")
			) {
				reCompose(tweets, message);
				break;
			}
		// eslint-disable-next-line no-fallthrough
		case EmbedModes.REEMBED:
			// We can't re-embed in a DM channel
			// We can't clear embeds without manage messages permission
			if (
				message.channel instanceof GuildChannel &&
				message.channel.permissionsFor(discord.user.id).has("MANAGE_MESSAGES")
			) {
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

discord.login(process.env.TOKEN);
