const { Webhook, DiscordAPIError, Constants: DiscordConstants } = require("discord.js");
const { APIErrors } = DiscordConstants;
const { tempMsg } = require("./Utils");
const WebhooksDB = require("../database/WebhooksDB");
const discord = require("../discord");

module.exports.getWebhook = async function getWebhook(channel) {
  const dbWebhookMap = await WebhooksDB.findOne({ where: { channelID: channel.id } });
  if (dbWebhookMap) {
    // @ts-ignore
    const webhook = new Webhook(discord, {
      id: dbWebhookMap.getDataValue("webhookID"),
      token: dbWebhookMap.getDataValue("webhookToken")
    });
    return webhook;
  } else {
    try {
      // @ts-ignore
      const webhook = await channel.createWebhook("Video Embeds");
      WebhooksDB.create({
        channelID: channel.id,
        guildID: channel.guild.id,
        webhookID: webhook.id,
        webhookToken: webhook.token
      });
      return webhook;
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === APIErrors.MAXIMUM_WEBHOOKS) {
        tempMsg(
          channel,
          "An error occured creating a webhook for this channel. You've reached Discord's limit on webhooks per channel. You can resolve this problem by deleting unused webhooks in this channel, or switching the bot to another mode using /embedmode. This message will self-destruct in 30 seconds."
        );
        return null;
      }
      throw error;
    }
  }
};

module.exports.resetWebhook = async function resetWebhook(channel) {
  const channelID = channel.id;
  const dbWebhookMap = await WebhooksDB.findOne({ where: { channelID } });
  if (dbWebhookMap) {
    WebhooksDB.destroy({ where: { channelID } });
  }
};
