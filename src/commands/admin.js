const {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandIntegerOption,
  SlashCommandStringOption,
  InteractionResponse,
  CommandInteraction,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandBooleanOption
} = require("discord.js");
const Command = require("../structures/Command");
const GuildFlags = require("../structures/GuildFlags");
const GuildOptions = require("../structures/GuildOptions");
const { EmbedModes } = require("../util/Constants");
const { inspect } = require("util");
const { database } = require("../database");
const log = require("../util/log");

const command = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("Bot management command")
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
      .addBooleanOption(new SlashCommandBooleanOption().setName("public").setDescription("Post results publicly"))
  )
  .addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName("reset-application")
      .setDescription("Reset all command states and restart the bot")
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
        let public = !interaction.options.getBoolean("public");
        if (public == null) {
          public = true;
        }
        try {
          const client = interaction.client;
          const { sh } = require("../util/Utils");
          const fetch = require("node-fetch");
          const result = await eval(interaction.options.getString("content"));
          await interaction.reply({ content: `\`\`\`${inspect(result).substring(0, 1990)}\`\`\``, ephemeral: public });
        } catch (e) {
          try {
            await interaction.reply({ content: `\`\`\`${inspect(e).substring(0, 1990)}\`\`\``, ephemeral: public });
          } catch (e) {
            await interaction.reply({ content: "Failed to respond with content", ephemeral: public });
          }
        }
        break;
      case "setflag":
        guildId = getGuild(interaction);
        if (!guildId) {
          interaction.reply({ content: "No guildid specified and command not run in guild", ephemeral: true });
          break;
        }
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
        const mode = interaction.options.getInteger("mode");
        GuildOptions.setOptions(guildId, { mode }).then(() => {
          interaction.reply({
            content: `mode: \`${EmbedModes[mode]}\``,
            ephemeral: true
          });
        });

        break;
      case "reset-application":
        await interaction.reply({ content: "Resetting application and safely shutting down", ephemeral: true });
        log.info("unregistering guild commands");
        await Promise.all(interaction.client.guilds.cache.map((guild) => guild.commands.set([])));
        log.info("unregistering application commands");
        await interaction.client.application.commands.set([]);
        log.info("closing discord client");
        await interaction.client.destroy();
        log.info("syncing database");
        await database.sync();
        log.info(":wave:");
        await process.exit();
    }
  },
  ["825498121625665536"]
);
