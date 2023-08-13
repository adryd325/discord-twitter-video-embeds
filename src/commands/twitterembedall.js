const { ApplicationCommandOptionType, PermissionFlagsBits } = require("discord.js");
const Command = require("../structures/Command");
const GuildFlags = require("../structures/GuildFlags");
const GuildOptions = require("../structures/GuildOptions");
const { EmbedModes } = require("../util/Constants");
const log = require("../util/log");

module.exports = new Command(
  {
    name: "twitterembedall",
    options: [
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "state",
        description: "Embed All Twitter Posts?",
        required: true
      }
    ],
    description: "Toggles whether to embed all twitter posts, or only those with video"
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
    if (!interaction.options.get("state")) return;
    const mode = interaction.options.get("state").value;
    log.info(`Handled embed all switch to (${!mode ? "Embedding only video tweets" : "Embedding all tweets"})`);
    GuildOptions.getOptions(interaction.guild.id).then((options) => {
      let flags;
      if (!mode) {
        flags = options.flags.add(GuildFlags.Flags.TWITTER_ONLY_VIDEO);
      } else {
        flags = options.flags.remove(GuildFlags.Flags.TWITTER_ONLY_VIDEO);
      }
      GuildOptions.setOptions(interaction.guild.id, { flags }).then(() => {
        interaction.reply({
          content: !mode ? "Embedding only video tweets" : "Embedding all tweets",
          ephemeral: true
        });
      });
    });
  }
);
