const discord = require("../discord");

class InteractionHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Map();
  }

  registerCommand(command) {
    this.commands.set(command.meta.name, command);
  }

  handle(interaction) {
    if (interaction.isCommand()) {
      if (this.commands.has(interaction.commandName)) {
        this.commands.get(interaction.commandName).exec(interaction);
      }
    }
  }

  _registerCommands() {
    const globalCommands = [];
    const guildCommands = new Map();
    this.commands.forEach((command) => {
      if (command.guilds) {
        command.guilds.forEach((guildid) => {
          if (guildCommands.has(guildid)) {
            const arr = guildCommands.get(guildid);
            arr.push(command.meta);
            guildCommands.set(guildid, arr);
          } else {
            guildCommands.set(guildid, [command.meta]);
          }
        });
      } else {
        globalCommands.push(command.meta);
      }
    });
    guildCommands.forEach((command, guild) => {
      if (discord.guilds.cache.has(guild)) {
        discord.guilds.cache.get(guild).commands.set(command);
      }
    });
    discord.application.commands.set(globalCommands);
  }
}

const interactionHandler = new InteractionHandler(discord);

discord.on("ready", () => {
  interactionHandler._registerCommands();
});

module.exports = interactionHandler;
