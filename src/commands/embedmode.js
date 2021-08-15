const { Constants: DiscordConstants, Permissions } = require("discord.js");
const { ApplicationCommandOptionTypes } = DiscordConstants;
const Command = require("../structures/Command");
const GuildOptions = require("../structures/GuildOptions");
const { EmbedModes } = require("../util/Constants");

module.exports = new Command(
  {
    name: "embedmode",
    options: [
      {
        type: ApplicationCommandOptionTypes.INTEGER,
        name: "mode",
        description: "Mode to switch to",
        choices: [
          {
            name: "VIDEO_REPLY",
            value: EmbedModes.VIDEO_REPLY
          },
          {
            name: "RE_EMBED",
            value: EmbedModes.RE_EMBED
          },
          {
            name: "RE_COMPOSE",
            value: EmbedModes.RE_COMPOSE
          }
        ],
        required: true
      }
    ],
    description: "Switches embed mode"
  },
  function embedmode(interaction) {
    if (!interaction.inGuild()) {
      interaction.reply("This command only applies to servers");
      return;
    }
    if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
      interaction.reply({ content: "You do not have permission to use this command", ephemeral: true });
      return;
    }
    if (!interaction.options.get("mode")) return;
    GuildOptions.setOptions(interaction.guild.id, { mode: interaction.options.get("mode").value }).then(() => {
      interaction.reply({
        content: `Embed mode has been set to ${EmbedModes[interaction.options.get("mode").value]}!`,
        ephemeral: true
      });
    });
  }
);
