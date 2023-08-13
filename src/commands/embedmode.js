const { PermissionFlagsBits, ApplicationCommandOptionType } = require("discord.js");
const Command = require("../structures/Command");
const GuildOptions = require("../structures/GuildOptions");
const { EmbedModes } = require("../util/Constants");
const log = require("../util/log");

module.exports = new Command(
  {
    name: "embedmode",
    options: [
      {
        type: ApplicationCommandOptionType.Integer,
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
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      interaction.reply({ content: "You do not have permission to use this command", ephemeral: true });
      return;
    }
    if (!interaction.options.get("mode")) return;
    const mode = interaction.options.get("mode").value;
    log.info(`Handled mode switch to (${EmbedModes[mode]})`);
    GuildOptions.setOptions(interaction.guild.id, { mode }).then(() => {
      interaction.reply({
        content: `Embed mode has been set to ${EmbedModes[mode]}!`,
        ephemeral: true
      });
    });
  }
);
