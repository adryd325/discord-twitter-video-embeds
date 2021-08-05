import { GuildChannel, Guild } from "discord.js";
import sequelize from "sequelize";
import { SAFE_EMBED_MODE } from "../constants.js";
import database from "../database.js";
const { Model, DataTypes } = sequelize;

class ModeMappings extends Model {}

ModeMappings.init(
	{
		guildID: { type: DataTypes.STRING, unique: true },
		mode: DataTypes.INTEGER
	},
	{
		sequelize: database
	}
);

// export default ModeMappings;

const modes = new Map();

/** @param {import("discord.js").Channel} channel*/
export async function getMode(channel) {
	if (!(channel instanceof GuildChannel)) return SAFE_EMBED_MODE;
	if (modes.has(channel.guild.id)) {
		return modes.get(channel.guild.id);
	} else {
		const dbModeMap = await ModeMappings.findOne({ where: { guildID: channel.guild.id } });
		if (dbModeMap) {
			const mode = dbModeMap.getDataValue("mode");
			modes.set(channel.guild.id, mode);
			return mode;
		} else {
			modes.set(channel.guild.id, SAFE_EMBED_MODE);
			return SAFE_EMBED_MODE;
		}
	}
}

/** @param {import("discord.js").Guild} guild */
export async function setMode(guild, mode) {
	if (!(guild instanceof Guild)) return;
	modes.set(guild.id, mode);
	const dbModeMap = await ModeMappings.findOne({ where: { guildID: guild.id } });
	if (!dbModeMap) {
		ModeMappings.create({ guildID: guild.id, mode: mode });
	} else {
		ModeMappings.update(
			{
				mode: mode
			},
			{ where: { guildID: guild.id } }
		);
	}
}
