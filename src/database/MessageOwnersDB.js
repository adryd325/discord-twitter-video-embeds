const sequelize = require("sequelize");
const { Model, DataTypes } = sequelize;
const { database, cache } = require("../database");

class MessageOwnersDB extends Model {}

MessageOwnersDB.init(
  {
    messageID: { type: DataTypes.STRING, unique: true },
    originalMessageID: DataTypes.STRING,
    channelID: DataTypes.STRING,
    userID: DataTypes.STRING,
    guildID: { type: DataTypes.STRING, allowNull: true }
  },
  {
    sequelize: database,
    modelName: "MessageOwners"
  }
);

module.exports = cache.init(MessageOwnersDB);
