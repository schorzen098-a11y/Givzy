// deploy-commands.js
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a giveaway!')
    .addStringOption(opt =>
      opt.setName('prize').setDescription('Giveaway prize').setRequired(true))
    .addStringOption(opt =>
      opt.setName('duration').setDescription('Duration (e.g., 10m, 1h)').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('winners').setDescription('Number of winners').setRequired(true))
    .addRoleOption(opt =>
      opt.setName('role').setDescription('Optional role requirement')),

  new SlashCommandBuilder()
    .setName('reroll')
    .setDescription('Reroll a giveaway')
    .addStringOption(opt =>
      opt.setName('message_id').setDescription('Message ID').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cancel')
    .setDescription('Cancel a giveaway')
    .addStringOption(opt =>
      opt.setName('message_id').setDescription('Message ID').setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔁 Deploying slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Commands deployed successfully!');
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();
