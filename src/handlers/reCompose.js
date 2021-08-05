import { Constants as DiscordConstants, DiscordAPIError, GuildChannel } from "discord.js";
import videoReply from "./videoReply.js";
import { EmbedModes } from "../constants.js";
import { discord } from "../index.js";
import { registerMessage } from "../structures/MessageMappings.js";
import { setMode } from "../structures/ModeMappings.js";
import WebhookMappings from "../structures/WebhookMappings.js";
import { escapeRegExp } from "../util.js";
import getAttachment from "../util/getAttachment.js";
import { getWebhook, webhookMappings } from "../util/getWebhook.js";

const { APIErrors } = DiscordConstants;

/** @param {Promise[]} tweetPromises */
/** @param {import("discord.js").Message} message */
export default async function reCompose(tweetPromises, message) {
	// To suppress TS errors, even though we already handled that.
	if (!(message.channel instanceof GuildChannel)) return;
	if (!message.channel.permissionsFor(discord.user.id).has("MANAGE_MESSAGES")) {
		message.channel.send(
			"Hi, the bot doesn't have manage messages permission, so it is unable to re-compose messages. We've switched your server to video_reply mode. You're free to switch back to re-compose mode once the bot has appropriate permissions. (Manage messages, Manage webhooks, Embed links, Attach files)"
		);
		setMode(message.channel.guild, EmbedModes.VIDEO_REPLY);
		videoReply(tweetPromises, message);
		return;
	}
	if (!message.channel.permissionsFor(discord.user.id).has("MANAGE_WEBHOOKS")) {
		message.channel.send(
			"Hi, We tried to create a webhook for re-composing messages, but the bot doesn't have permission, We've switched your server to video_reply mode. You're free to switch back to re-compose mode once the bot has appropriate permissions. (Manage messages, Manage webhooks, Embed links, Attach files)"
		);
		setMode(message.channel.guild, EmbedModes.VIDEO_REPLY);
		videoReply(tweetPromises, message);
		return;
	}
	if (!message.channel.permissionsFor(discord.user.id).has("ATTACH_FILES")) {
		message.channel.send(
			"Hi, We cannot upload videos as attachments cause the bot doesn't have permission, We've switched your server to video_reply mode. You're free to switch back to re-compose mode once the bot has appropriate permissions. (Manage messages, Manage webhooks, Embed links, Attach files)"
		);
		setMode(message.channel.guild, EmbedModes.VIDEO_REPLY);
		videoReply(tweetPromises, message);
		return;
	}
	const tweets = await Promise.all(tweetPromises);
	const webhook = await getWebhook(message.channel);
	let content = message.content;
	const embeds = [];
	const downloads = [];
	tweets.map((tweet) => {
		if (!tweet || !tweet.tweet.bestVideo) return;
		embeds.push(tweet.tweet.discordEmbed);
		downloads.push(getAttachment(tweet.tweet.bestVideo.url, (tweet.spoiler ? "SPOILER_" : "") + tweet.match.id + ".mp4"));
		const urlRegExp = new RegExp(`(?<!<)${escapeRegExp(tweet.match.content)}(?!>)`);
		// Prevent
		content.replace(urlRegExp, "$&");
	});
	// assume all tweets failed to resolve
	if (embeds.length === 0 && downloads.length === 0) return;
	// don't crash if videos fail to download
	let files;
	try {
		files = await Promise.all(downloads);
	} catch (error) {
		console.log("Failed to download videos:");
		console.error(error);
		return;
	}
	if (content.trim() === "") content = undefined;
	try {
		const response = await webhook.send({
			content,
			embeds,
			files,
			username: message.author.username,
			avatarURL: message.author.avatarURL({ format: "webp", size: 256 }),
			allowed_mentions: { parse: ["users"] }
		});
		message.delete();
		registerMessage(response, message);
	} catch (error) {
		if (error instanceof DiscordAPIError) {
			switch (error.code) {
				case APIErrors.UNKNOWN_WEBHOOK:
				case APIErrors.UNKNOWN_WEBHOOK_SERVICE:
					// Assume webhook was deleted
					webhookMappings.delete(message.channel.id);
					WebhookMappings.destroy({ where: { channelID: message.channel.id } });
					message.channel.send(
						"An error occured while recomposing a message (UNKNOWN_WEBHOOK), This error should resolve itself next time a message is proxied."
					);
					break;
				case APIErrors.INVALID_WEBHOOK_TOKEN:
					// Delete and recreate webhook
					webhookMappings.delete(message.channel.id);
					WebhookMappings.destroy({ where: { channelID: message.channel.id } });
					message.channel.send("An error occured while recomposing a message (INVALID_WEBHOOK_TOKEN)");
					webhook.delete();
					break;
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
