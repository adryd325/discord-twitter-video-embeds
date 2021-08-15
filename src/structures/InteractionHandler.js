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

  getCommands() {
    const commandMeta = [];
    this.commands.forEach((command) => commandMeta.push(command.meta));
    return commandMeta;
  }
}

const interactionHandler = new InteractionHandler(discord);

discord.on("ready", () => {
  discord.application.commands.set(interactionHandler.getCommands());
});

module.exports = interactionHandler;
