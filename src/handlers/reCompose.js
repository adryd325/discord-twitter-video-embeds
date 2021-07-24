import getAttachment from "../util/getAttachment.js";
import { registerMessage } from "../structures/MessageMappings.js";
import { escapeRegExp } from "../util.js";
import { Constants as DiscordConstants, DiscordAPIError, GuildChannel, Webhook } from "discord.js";
import WebhookMappings from "../structures/WebhookMappings.js";
import { discord } from "../index.js";
import { setMode } from "../structures/ModeMappings.js";
import { EmbedModes } from "../constants.js";

const { APIErrors } = DiscordConstants;

// TEMP WEBOOKS MAPPINGS
const webhookMappings = new Map();

/** @param {import("discord.js").GuildChannel} channel */
async function getWebhook(channel) {
	if (webhookMappings.has(channel.id)) {
		return webhookMappings.get(channel.id);
	} else {
		const dbWebhookMap = await WebhookMappings.findOne({ where: { channelID: channel.id } });
		if (dbWebhookMap) {
			const webhook = new Webhook(discord, {
				id: dbWebhookMap.getDataValue("webhookID"),
				token: dbWebhookMap.getDataValue("webhookToken"),
			});
			webhookMappings.set(channel.id, webhook);
			return webhook;
		} else {
			if (!channel.permissionsFor(discord.user.id).has("MANAGE_MESSAGES")) {
				// @ts-ignore
				channel.send(
					"Hi, We tried to create a webhook for re-composing messages, but the bot doesn't have permission, We've switched you to video_reply mode. You're free to switch back to re-compose mode once the bot has appropriate permissions. (Manage Messages, Manage Webhooks)"
				);
				setMode(channel.guild, 1);
				return;
			}
			try {
				// @ts-ignore
				const webhook = await channel.createWebhook("TwitterVideoEmbeds Proxy Webhook");
				WebhookMappings.create({
					channelID: channel.id,
					webhookID: webhook.id,
					webhookToken: webhook.token,
				});
				return webhook;
			} catch (error) {
				if (error instanceof DiscordAPIError && error.code === APIErrors.MAXIMUM_WEBHOOKS) {
					// Set mode to 2 and notify
					// @ts-ignore
					channel.send(
						"Hi, We tried to create a webhook for re-composing messages, but you're at the webhook limit for this channel. We've switched you to re-embed mode. You're free to switch back to re-compose mode once you're not at the webhook limit."
					);
					setMode(channel.guild, 2);
				}
			}
		}
	}
}

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
		return;
	}
	if (!message.channel.permissionsFor(discord.user.id).has("MANAGE_WEBHOOKS")) {
		message.channel.send(
			"Hi, We tried to create a webhook for re-composing messages, but the bot doesn't have permission, We've switched your server to video_reply mode. You're free to switch back to re-compose mode once the bot has appropriate permissions. (Manage messages, Manage webhooks, Embed links, Attach files)"
		);
		setMode(message.channel.guild, EmbedModes.VIDEO_REPLY);
		return;
	}
	if (!message.channel.permissionsFor(discord.user.id).has("ATTACH_FILES")) {
		message.channel.send(
			"Hi, We cannot upload videos as attachments cause the bot doesn't have permission, We've switched your server to video_reply mode. You're free to switch back to re-compose mode once the bot has appropriate permissions. (Manage messages, Manage webhooks, Embed links, Attach files)"
		);
		setMode(message.channel.guild, EmbedModes.VIDEO_REPLY);
		return;
	}
	const tweets = await Promise.all(tweetPromises);
	const webhook = await getWebhook(message.channel);
	let content = message.content;
	const embeds = [];
	const downloads = [];
	tweets.map((tweet) => {
		if (!tweet || !tweet.tweet.bestVideo) return;
		content += tweet.spoiler ? "|| " + tweet.tweet.url + " ||" : "";
		embeds.push(tweet.tweet.discordEmbed);
		downloads.push(
			getAttachment(tweet.tweet.bestVideo.url, (tweet.spoiler ? "SPOILER_" : "") + tweet.match.id + ".mp4")
		);
		const urlRegExp = new RegExp(`(?<!<)${escapeRegExp(tweet.match.content)}(?!>)`);
		content.replace(urlRegExp, "$&");
	});
	// assume all tweets failed to resolve
	if (embeds.length === 0 && downloads.length === 0) return;
	const files = await Promise.all(downloads);
	if (content === "") content = undefined;
	try {
		const response = await webhook.send({
			content,
			embeds,
			files,
			username: message.author.username,
			avatarURL: message.author.avatarURL({ format: "webp", size: 256 }),
			allowed_mentions: { parse: ["users"] },
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
			}
		} else {
			message.channel.send("An error occured while recomposing a message.");
			throw error;
		}
	}
}
