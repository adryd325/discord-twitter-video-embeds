import sequelize from "sequelize";
const { Model, DataTypes } = sequelize;
import database from "../database.js";

class MessageMappings extends Model {}

MessageMappings.init(
	{
		messageID: { type: DataTypes.STRING, unique: true },
		originalMessageID: DataTypes.STRING,
		channelID: DataTypes.STRING,
		userID: DataTypes.STRING,
		guildID: { type: DataTypes.STRING, allowNull: true }
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
		originalMessageID: originalMessage.id,
		userID: originalMessage.author.id,
		channelID: message.channel.id,
		guildID: message.channel?.guild.id
	});
}

export async function getMessageOwner(message) {
	const dbMessageMap = await MessageMappings.findOne({ where: { messageID: message.id } });
	if (dbMessageMap) {
		return dbMessageMap.getDataValue("userID");
	}
}