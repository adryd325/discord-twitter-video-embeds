import sequelize from "sequelize";
const { Model, DataTypes } = sequelize;
import database from "../database.js";

class MessageMappings extends Model {}

MessageMappings.init(
	{
		channelID: DataTypes.STRING,
		userID: DataTypes.STRING,
		originalMessageID: DataTypes.STRING,
		messageID: DataTypes.STRING,
	},
	{
		sequelize: database,
	}
);

/** @param {import("discord.js").Message} message */
/** @param {import("discord.js").Message} originalMessage */
export function registerMessage(message, originalMessage) {
	MessageMappings.create({
		messageID: message.id,
		originalMessage: originalMessage.id,
		userID: originalMessage.author.id,
		channelID: message.channel.id,
	});
}

export async function getMessageOwner(message) {
	const dbMessageMap = await MessageMappings.findOne({ where: { messageID: message.id } });
	if (dbMessageMap) {
		return dbMessageMap.getDataValue("userID");
	}
}
