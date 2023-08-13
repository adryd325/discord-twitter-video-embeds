const { Constants: DiscordConstants, Permissions } = require("discord.js");
const { ApplicationCommandOptionTypes } = DiscordConstants;
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
        type: ApplicationCommandOptionTypes.BOOLEAN,
        name: "mode",
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
    if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
      interaction.reply({ content: "You do not have permission to use this command", ephemeral: true });
      return;
    }
    if (!interaction.options.get("mode")) return;
    const mode = interaction.options.get("mode").value;
    log.info(`Handled mode switch to (${EmbedModes[mode]})`);
    GuildOptions.getOptions(interaction.guild.id).then((options) => {
      let flags;
      if (!mode) {
        flags = options.flags.add(GuildFlags.FLAGS.TWITTER_ONLY_VIDEO);
      } else {
        flags = options.flags.remove(GuildFlags.FLAGS.TWITTER_ONLY_VIDEO);
      }
      GuildOptions.setOptions(interaction.guild.id, { flags }).then(() => {
        interaction.reply({
          content: !mode ? "Embedding all posts" : "Embedding only video posts",
          ephemeral: true
        });
      });
    });
  }
);
