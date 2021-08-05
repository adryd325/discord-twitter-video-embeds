import { Webhook, DiscordAPIError, Constants as DiscordConstants } from "discord.js";
import { discord } from "../index.js";
import { setMode } from "../structures/ModeMappings.js";
import WebhookMappings from "../structures/WebhookMappings.js";

const { APIErrors } = DiscordConstants;

export const webhookMappings = new Map();

/** @param {import("discord.js").GuildChannel} channel */
export async function getWebhook(channel) {
	if (webhookMappings.has(channel.id)) {
		return webhookMappings.get(channel.id);
	} else {
		const dbWebhookMap = await WebhookMappings.findOne({ where: { channelID: channel.id } });
		if (dbWebhookMap) {
			const webhook = new Webhook(discord, {
				id: dbWebhookMap.getDataValue("webhookID"),
				token: dbWebhookMap.getDataValue("webhookToken")
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
					guildID: channel.guild.id,
					webhookID: webhook.id,
					webhookToken: webhook.token
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
