const {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandIntegerOption,
  SlashCommandStringOption,
  InteractionResponse,
  CommandInteraction,
  SlashCommandSubcommandGroupBuilder
} = require("discord.js");
const Command = require("../structures/Command");
const GuildFlags = require("../structures/GuildFlags");
const GuildOptions = require("../structures/GuildOptions");
const { EmbedModes } = require("../util/Constants");
const { inspect } = require("util");

const command = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("Bot management command")
  .setDMPermission(true)
  .addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName("setflag")
      .setDescription("Set flags for guild")
      .addIntegerOption(
        new SlashCommandIntegerOption().setName("flags").setDescription("Flags").setRequired(true).setMinValue(0)
      )
      .addStringOption(new SlashCommandStringOption().setName("guildid").setDescription("Guild ID"))
  )
  .addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName("setmode")
      .setDescription("Set mode for guild")
      .addIntegerOption(
        new SlashCommandIntegerOption()
          .setName("mode")
          .setDescription("mode")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(Object.keys(EmbedModes).length)
      )
      .addStringOption(new SlashCommandStringOption().setName("guildid").setDescription("Guild ID"))
  )
  .addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName("evaluate")
      .setDescription("Evaluate arbitrairy javascript")
      .addStringOption(
        new SlashCommandStringOption().setName("content").setDescription("Javascript to evaluate").setRequired(true)
      )
  );

function getGuild(interaction) {
  let guildId;
  if (interaction.inGuild()) {
    guildId = interaction.guildId;
  }
  const interactionGuildId = interaction.options.getString("guildid");
  if (interactionGuildId) {
    guildId = interactionGuildId;
  }
  return guildId;
}

module.exports = new Command(
  command,
  /**
   * @param {CommandInteraction} interaction - The title of the book.
   */
  async function execute(interaction) {
    if (interaction.user.id != "298475055141355520") {
      interaction.reply({ content: "You do not have permission to execute this command", ephemeral: true });
    }
    let guildId;
    switch (interaction.options.getSubcommand()) {
      case "evaluate":
        try {
          const result = await eval(interaction.options.getString("content"));
          interaction.reply({ content: `\`\`\`${inspect(result).substring(0, 1990)}\`\`\``, ephemeral: true });
        } catch (e) {
          interaction.reply({ content: `\`\`\`${inspect(e).substring(0, 1990)}\`\`\``, ephemeral: true });
        }
        break;
      case "setflag":
        guildId = getGuild(interaction);
        if (!guildId) {
          interaction.reply({ content: "No guildid specified and command not run in guild", ephemeral: true });
          break;
        }
        console.log(interaction.options.getInteger("flags"));
        const flags = new GuildFlags(interaction.options.getInteger("flags"));
        GuildOptions.setOptions(guildId, { flags }).then(() => {
          interaction.reply({
            content: `bitfield: \`${flags.bitfield}\`\nvalues: \`${flags.toArray().join(", ")}\``,
            ephemeral: true
          });
        });

        break;
      case "setmode":
        guildId = getGuild(interaction);
        if (!guildId) {
          interaction.reply({ content: "No guildid specified and command not run in guild", ephemeral: true });
          break;
        }
        console.log(interaction.options.getInteger("mode"));
        const mode = EmbedModes[interaction.options.getInteger("mode")];
        GuildOptions.setOptions(guildId, { mode }).then(() => {
          interaction.reply({
            content: `mode: \`${mode}\``,
            ephemeral: true
          });
        });

        break;
    }
  }
);
