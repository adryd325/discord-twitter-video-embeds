const { ApplicationCommandOptionType, PermissionFlagsBits } = require("discord.js");
const Command = require("../structures/Command");
const GuildOptions = require("../structures/GuildOptions");
const PlatformFlags = require("../structures/PlatformFlags");

module.exports = new Command(
  {
    name: "platformoptions",
    options: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "mode",
        description: "Mode to switch to",
        choices: [
          {
            name: "TWITTER",
            value: PlatformFlags.Flags.TWITTER
          },
          {
            name: "INSTAGRAM_FACEBOOK",
            value: PlatformFlags.Flags.INSTAGRAM_FACEBOOK
          },
          {
            name: "TIKTOK",
            value: PlatformFlags.Flags.TIKTOK
          },
          {
            name: "REDDIT",
            value: PlatformFlags.Flags.REDDIT
          }
        ],
        required: true
      }
    ],
    description: "Toggles support for any given platform"
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
    const platform = interaction.options.get("mode").value;
    GuildOptions.getOptions(interaction.guild.id).then((options) => {
      let platforms;
      let newState;
      if (!options.platforms.has(platform)) {
        newState = true;
        platforms = options.platforms.add(platform);
      } else {
        newState = false;
        platforms = options.platforms.remove(platform);
      }
      GuildOptions.setOptions(interaction.guild.id, { platforms }).then(() => {
        interaction.reply({
          content:
            // i hate this
            (newState ? "Enabled" : "Disabled") + " platform support for " + new PlatformFlags(platform).toArray()[0],
          ephemeral: true
        });
      });
    });
  }
);
