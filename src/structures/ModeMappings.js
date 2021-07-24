import sequelize from "sequelize";
import { DEFAULT_MODE } from "../constants.js";
const { Model, DataTypes } = sequelize;
import database from "../database.js";
import { GuildChannel } from "discord.js";

class ModeMappings extends Model {}

ModeMappings.init(
	{
		guildID: { type: DataTypes.STRING, unique: true },
		mode: DataTypes.INTEGER,
	},
	{
		sequelize: database,
	}
);

// export default ModeMappings;

const modes = new Map();

/** @param {import("discord.js").Channel} channel*/
export async function getMode(channel) {
	if (!(channel instanceof GuildChannel)) return DEFAULT_MODE;
	if (modes.has(channel.guild.id)) {
		return modes.get(channel.guild.id);
	} else {
		const dbModeMap = await ModeMappings.findOne({ where: { guildID: channel.guild.id } });
		if (dbModeMap) {
			const mode = dbModeMap.getDataValue("mode");
			modes.set(channel.guild.id, mode);
			return mode;
		} else {
			modes.set(channel.guild.id, DEFAULT_MODE);
			return DEFAULT_MODE;
		}
	}
}

/** @param {import("discord.js").Guild} guild */
export async function setMode(guild, mode) {
	modes.set(guild.id, mode);
	const dbModeMap = await ModeMappings.findOne({ where: { guildID: guild.id } });
	if (!dbModeMap) {
		ModeMappings.create({ guildID: guild.id, mode: mode });
	} else {
		ModeMappings.update(
			{
				mode: mode,
			},
			{ where: { guildID: guild.id } }
		);
	}
}
