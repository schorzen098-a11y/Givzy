const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');

const commands = [
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a giveaway!')
    .addStringOption(opt => opt.setName('prize').setDescription('Giveaway prize').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g., 10m, 1h)').setRequired(true))
    .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('Optional role requirement')),

  new SlashCommandBuilder()
    .setName('reroll')
    .setDescription('Reroll a giveaway')
    .addStringOption(opt => opt.setName('message_id').setDescription('Message ID').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cancel')
    .setDescription('Cancel a giveaway')
    .addStringOption(opt => opt.setName('message_id').setDescription('Message ID').setRequired(true)),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Deploying commands...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });
    console.log('Commands deployed!');
  } catch (error) {
    console.error(error);
  }
})();
