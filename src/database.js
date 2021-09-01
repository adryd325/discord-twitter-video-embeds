const path = require("path");
const sequelize = require("sequelize");
const { Sequelize } = sequelize;
const SequelizeSimpleCache = require("sequelize-simple-cache");
const log = require("./util/log");

module.exports.database = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../data/database.db"),
  logging: (message) => log.sql(message)
});

module.exports.cache = new SequelizeSimpleCache({
  GuildOptions: { ttl: 24 * 60 * 60 }, // 24 hours
  Webhooks: { ttl: 60 * 60 }, // 1 hour
  MessageOwners: { ttl: 15 * 60 } // 15 minutes
});
