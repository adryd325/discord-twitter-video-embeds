import sequelize from "sequelize";
const { Model, DataTypes } = sequelize;
import database from "../database.js";

class WebhookMappings extends Model {}

WebhookMappings.init(
	{
		channelID: DataTypes.STRING,
		webhookID: DataTypes.STRING,
		webhookToken: DataTypes.STRING,
	},
	{
		sequelize: database,
	}
);

export default WebhookMappings;
