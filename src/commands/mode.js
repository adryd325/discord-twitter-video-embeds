import { Constants as DiscordConstants } from "discord.js";
const { ApplicationCommandOptionTypes } = DiscordConstants;
import { Command } from "../structures/Command.js";
import { setMode } from "../structures/ModeMappings.js";

export default new Command(
	{
		name: "embedmode",
		options: [
			{
				type: ApplicationCommandOptionTypes.INTEGER,
				name: "mode",
				description: "Mode to switch to",
				choices: [
					{
						name: "video_reply",
						value: 1,
					},
					{
						name: "reembed",
						value: 2,
					},
					{
						name: "recompose",
						value: 3,
					},
				],
				required: true,
			},
		],
		description: "Switches embed mode",
	},
	function mode(interaction) {
		if (!interaction.inGuild()) {
			interaction.reply("This command only applies to servers");
			return;
		}
		if (!interaction.member.permissions.has("MANAGE_SERVER")) {
			interaction.reply("You do not have permission to use this command");
			return;
		}
		if (!interaction.options.get("mode")) return;
		setMode(interaction.guild, interaction.options.get("mode")).then(() => {
			interaction.reply("Mode has been set!");
		});
	}
);
