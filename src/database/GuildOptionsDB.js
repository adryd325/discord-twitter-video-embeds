const sequelize = require("sequelize");
const { database, cache } = require("../database");
const { Model, DataTypes } = sequelize;

class GuildOptionsDB extends Model {}

GuildOptionsDB.init(
  {
    guildID: { type: DataTypes.STRING, unique: true },
    mode: DataTypes.INTEGER,
    flags: { type: DataTypes.INTEGER, allowNull: true },
    platforms: { type: DataTypes.INTEGER, allowNull: true }
  },
  {
    sequelize: database,
    modelName: "GuildOptions"
  }
);

module.exports = cache.init(GuildOptionsDB);
