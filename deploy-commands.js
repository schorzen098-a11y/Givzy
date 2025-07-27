const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const commands = [
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a giveaway!')
    .addStringOption(opt =>
      opt.setName('prize')
        .setDescription('Giveaway prize')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('duration')
        .setDescription('Duration (e.g., 10m, 1h, 2d)')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('winners')
        .setDescription('Number of winners')
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('Optional role requirement')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('reroll')
    .setDescription('Reroll a giveaway')
    .addStringOption(opt =>
      opt.setName('message_id')
        .setDescription('The message ID of the giveaway to reroll')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('cancel')
    .setDescription('Cancel an ongoing giveaway')
    .addStringOption(opt =>
      opt.setName('message_id')
        .setDescription('The message ID of the giveaway to cancel')
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🚀 Deploying slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('✅ Slash commands deployed successfully!');
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
})();
