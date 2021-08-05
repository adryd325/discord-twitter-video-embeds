import { GuildChannel, DiscordAPIError, Constants as DiscordConstants } from "discord.js";
import videoReply from "./videoReply.js";
import { EmbedModes } from "../constants.js";
import { discord } from "../index.js";
import { registerMessage } from "../structures/MessageMappings.js";
import { setMode } from "../structures/ModeMappings.js";
import getAttachment from "../util/getAttachment.js";
const { APIErrors } = DiscordConstants;

/** @param {Promise[]} tweetPromises */
/** @param {import("discord.js").Message} message */
export default async function reEmbed(tweetPromises, message) {
	// To suppress TS errors, even though we already handled that.
	if (!(message.channel instanceof GuildChannel)) return;
	if (!message.channel.permissionsFor(discord.user.id).has("MANAGE_MESSAGES")) {
		message.channel.send(
			"Hi, the bot doesn't have manage messages permission, so it is unable to re-embed messages. We've switched your server to video_reply mode. You're free to switch back to re-embed mode once the bot has appropriate permissions. (Manage messages, Embed links, Attach files)"
		);
		setMode(message.channel.guild, EmbedModes.VIDEO_REPLY);
		videoReply(tweetPromises, message);
		return;
	}
	if (!message.channel.permissionsFor(discord.user.id).has("ATTACH_FILES")) {
		message.channel.send(
			"Hi, We cannot upload videos as attachments cause the bot doesn't have permission, We've switched your server to video_reply mode. You're free to switch back to re-embed mode once the bot has appropriate permissions. (Manage messages, Embed links, Attach files)"
		);
		setMode(message.channel.guild, EmbedModes.VIDEO_REPLY);
		videoReply(tweetPromises, message);
		return;
	}
	const tweets = await Promise.all(tweetPromises);
	let content = "";
	const embeds = [];
	const downloads = [];
	tweets.map((tweet) => {
		if (!tweet || !tweet.tweet.bestVideo) return;
		content += tweet.spoiler ? "|| " + tweet.tweet.url + " ||" : "";
		embeds.push(tweet.tweet.discordEmbed);
		downloads.push(getAttachment(tweet.tweet.bestVideo.url, (tweet.spoiler ? "SPOILER_" : "") + tweet.match.id + ".mp4"));
	});
	let files;
	// don't crash if videos fail to download
	try {
		files = await Promise.all(downloads);
	} catch (error) {
		console.log("Failed to download videos:");
		console.error(error);
		return;
	}
	if (content.trim() === "") content = undefined;
	if (embeds.length === 0) return;
	try {
		const response = await message.reply({ content, embeds, files });
		registerMessage(response, message);
		message.suppressEmbeds();
	} catch (error) {
		if (error instanceof DiscordAPIError) {
			switch (error.code) {
				case APIErrors.REQUEST_ENTITY_TOO_LARGE:
					// Try again with a link embed
					videoReply(tweetPromises, message);
					break;
				case APIErrors.UNKNOWN_MESSAGE:
					break;
			}
		} else {
			throw error;
		}
	}
}
