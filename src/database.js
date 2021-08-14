const path = require("path");
const sequelize = require("sequelize");
const { Sequelize } = sequelize;
const SequelizeSimpleCache = require("sequelize-simple-cache");

module.exports.database = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../data/database.db"),
  logging: console.log
});

module.exports.cache = new SequelizeSimpleCache({
  GuildOptions: { ttl: 6 * 60 * 60 }, // 6 hours
  Webhooks: { ttl: 60 * 60 }, // 1 hour
  MessageOwners: { ttl: 15 * 60 } // 15 minutes
});
