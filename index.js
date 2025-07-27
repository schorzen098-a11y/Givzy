require('dotenv').config(); // Load environment variables

console.log("Token loaded:", process.env.TOKEN); // DEBUG LINE

const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Events, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  EmbedBuilder, 
  Collection 
} = require('discord.js');

const keepAlive = require('./keep-alive');
const ms = require('ms');

const token = process.env.TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const giveaways = new Collection(); // In-memory storage

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === 'giveaway') {
      const prize = interaction.options.getString('prize');
      const duration = interaction.options.getString('duration');
      const winners = interaction.options.getInteger('winners');
      const role = interaction.options.getRole('role');

      const endTime = Date.now() + ms(duration);
      const embed = new EmbedBuilder()
        .setTitle('🎉 Giveaway!')
        .setDescription(`**Prize:** ${prize}\n**Hosted by:** ${interaction.user}\n**Ends in:** <t:${Math.floor(endTime / 1000)}:R>\n${role ? `**Role required:** ${role}` : ''}`)
        .setColor('Blurple')
        .setTimestamp(endTime);

      const joinBtn = new ButtonBuilder()
        .setCustomId('join_giveaway')
        .setLabel('🎉 Join Giveaway')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(joinBtn);
      const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

      giveaways.set(msg.id, {
        prize,
        endTime,
        winners,
        role: role?.id,
        host: interaction.user.id,
        participants: new Set(),
        messageId: msg.id,
        channelId: msg.channel.id,
      });

      // End the giveaway after the duration
      setTimeout(() => endGiveaway(msg.id), ms(duration));
    }

    if (commandName === 'reroll') {
      const id = interaction.options.getString('message_id');
      rerollGiveaway(id, interaction);
    }

    if (commandName === 'cancel') {
      const id = interaction.options.getString('message_id');
      cancelGiveaway(id, interaction);
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'join_giveaway') {
      const giveaway = giveaways.get(interaction.message.id);
      if (!giveaway) return interaction.reply({ content: 'This giveaway no longer exists.', ephemeral: true });

      if (giveaway.role && !interaction.member.roles.cache.has(giveaway.role)) {
        return interaction.reply({ content: 'You do not have the required role.', ephemeral: true });
      }

      giveaway.participants.add(interaction.user.id);
      interaction.reply({ content: 'You joined the giveaway!', ephemeral: true });
    }
  }
});

// Functions
function endGiveaway(messageId) {
  const giveaway = giveaways.get(messageId);
  if (!giveaway) return;

  const participantsArray = [...giveaway.participants];
  if (participantsArray.length < giveaway.winners) {
    announceWinners(giveaway.channelId, giveaway.messageId, 'Not enough participants to pick winners.');
  } else {
    const shuffled = participantsArray.sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, giveaway.winners).map(id => `<@${id}>`);
    announceWinners(giveaway.channelId, giveaway.messageId, `🎉 Winners: ${winners.join(', ')}`);
  }

  giveaways.delete(messageId);
}

async function announceWinners(channelId, messageId, resultText) {
  const channel = await client.channels.fetch(channelId);
  const msg = await channel.messages.fetch(messageId);
  const embed = EmbedBuilder.from(msg.embeds[0])
    .setFooter({ text: resultText })
    .setColor('Green');
  await msg.edit({ embeds: [embed], components: [] });
  channel.send(resultText);
}

function rerollGiveaway(messageId, interaction) {
  const giveaway = giveaways.get(messageId);
  if (!giveaway) return interaction.reply({ content: 'Giveaway not found or already ended.', ephemeral: true });

  const participantsArray = [...giveaway.participants];
  if (participantsArray.length < giveaway.winners) {
    return interaction.reply({ content: 'Not enough participants to reroll.', ephemeral: true });
  }

  const shuffled = participantsArray.sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, giveaway.winners).map(id => `<@${id}>`);

  interaction.reply({ content: `🎉 New Winners: ${winners.join(', ')}` });
}

function cancelGiveaway(messageId, interaction) {
  if (giveaways.has(messageId)) {
    giveaways.delete(messageId);
    interaction.reply({ content: 'Giveaway has been cancelled.', ephemeral: true });
  } else {
    interaction.reply({ content: 'Giveaway not found.', ephemeral: true });
  }
}

keepAlive();
client.login(token);
