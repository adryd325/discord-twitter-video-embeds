import sequelize from "sequelize";
const { Model, DataTypes } = sequelize;
import database from "../database.js";

class WebhookMappings extends Model {}

WebhookMappings.init(
	{
		guildID: DataTypes.STRING,
		channelID: { type: DataTypes.STRING, unique: true },
		webhookID: DataTypes.STRING,
		webhookToken: DataTypes.STRING
	},
	{
		sequelize: database
	}
);

export default WebhookMappings;
