import getAttachment from "../util/getAttachment.js";
import { registerMessage } from "../structures/MessageMappings.js";
import { GuildChannel } from "discord.js";
import { setMode } from "../structures/ModeMappings.js";
import { EmbedModes } from "../constants.js";
import { discord } from "../index.js";

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
		return;
	}
	if (!message.channel.permissionsFor(discord.user.id).has("ATTACH_FILES")) {
		message.channel.send(
			"Hi, We cannot upload videos as attachments cause the bot doesn't have permission, We've switched your server to video_reply mode. You're free to switch back to re-embed mode once the bot has appropriate permissions. (Manage messages, Embed links, Attach files)"
		);
		setMode(message.channel.guild, EmbedModes.VIDEO_REPLY);
		return;
	}
	const tweets = await Promise.all(tweetPromises);
	let content = "";
	const embeds = [];
	const downloads = [];
	tweets.map((tweet) => {
		// TODO: if tweets are just regular and along side other tweets, we need to fix their embeds too
		if (!tweet || !tweet.tweet.bestVideo) return;
		content += tweet.spoiler ? "|| " + tweet.tweet.url + " ||" : "";
		embeds.push(tweet.tweet.discordEmbed);
		downloads.push(
			getAttachment(tweet.tweet.bestVideo.url, (tweet.spoiler ? "SPOILER_" : "") + tweet.match.id + ".mp4")
		);
	});
	const files = await Promise.all(downloads);
	if (content.trim() === "") content = undefined;
	if (embeds.length === 0) return;
	const response = await message.reply({ content, embeds, files });
	message.suppressEmbeds();
	registerMessage(response, message);
}
