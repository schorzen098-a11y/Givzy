const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a giveaway')
    .addStringOption(option =>
      option.setName('prize')
        .setDescription('The prize of the giveaway')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration (e.g. 10m, 1h, 1d)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('winners')
        .setDescription('Number of winners')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Optional role requirement')),

  new SlashCommandBuilder()
    .setName('reroll')
    .setDescription('Reroll a giveaway')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('Message ID of the giveaway')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('cancel')
    .setDescription('Cancel a giveaway')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('Message ID of the giveaway')
        .setRequired(true)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Replace with your bot's client ID and the guild ID where you want to register commands
const CLIENT_ID = '1398836139837886504';
const GUILD_ID = 'YOUR_GUILD_ID_HERE'; // 👈 Replace this

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
