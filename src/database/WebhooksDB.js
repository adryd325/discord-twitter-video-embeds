const sequelize = require("sequelize");
const { database, cache } = require("../database.js");
const { Model, DataTypes } = sequelize;

class WebhooksDB extends Model {}

WebhooksDB.init(
  {
    channelID: { type: DataTypes.STRING, unique: true },
    guildID: DataTypes.STRING,
    webhookID: DataTypes.STRING,
    webhookToken: DataTypes.STRING
  },
  {
    sequelize: database,
    modelName: "Webhooks"
  }
);

module.exports = cache.init(WebhooksDB);
