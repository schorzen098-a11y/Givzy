require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  Collection,
  SlashCommandBuilder,
} = require('discord.js');
const ms = require('ms');
const keepAlive = require('./keep-alive');

const token = process.env.TOKEN;
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const giveaways = new Collection();

// Presence & Ready Log
client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: 'Developed By Schorzen', type: 0 }],
    status: 'online',
  });
});

// Slash Command Handling
client.on(Events.InteractionCreate, async interaction => {
  try {
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

        const msg = await interaction.reply({
          embeds: [embed],
          components: [row],
          allowedMentions: { parse: ['roles'] },
          fetchReply: true,
        });

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

        console.log(`⏳ Giveaway started in ${interaction.guild.name} for prize: ${prize}`);
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

    if (interaction.isButton() && interaction.customId === 'join_giveaway') {
      const giveaway = giveaways.get(interaction.message.id);
      if (!giveaway) return interaction.reply({ content: '❌ This giveaway no longer exists.', flags: 64 });

      if (giveaway.role && !interaction.member.roles.cache.has(giveaway.role)) {
        return interaction.reply({ content: '🚫 You do not have the required role.', flags: 64 });
      }

      if (giveaway.participants.has(interaction.user.id)) {
        return interaction.reply({ content: '⚠️ You already joined this giveaway.', flags: 64 });
      }

      giveaway.participants.add(interaction.user.id);
      interaction.reply({ content: '✅ You joined the giveaway!', flags: 64 });
    }
  } catch (err) {
    console.error("❌ Interaction Error:", err);
  }
});

// Ends giveaway and picks winner(s)
function endGiveaway(messageId) {
  const giveaway = giveaways.get(messageId);
  if (!giveaway) return;

  const participantsArray = [...giveaway.participants];
  const channelId = giveaway.channelId;

  if (participantsArray.length < giveaway.winners) {
    announceWinners(channelId, messageId, 'Not enough participants to pick winners.', giveaway.prize);
  } else {
    const shuffled = participantsArray.sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, giveaway.winners).map(id => `<@${id}>`);
    announceWinners(channelId, messageId, `${winners.join(', ')}`, giveaway.prize);
  }

  giveaways.delete(messageId);
}

// Sends result message & edits embed
async function announceWinners(channelId, messageId, resultText, prize) {
  try {
    const channel = await client.channels.fetch(channelId);
    const msg = await channel.messages.fetch(messageId);

    const embed = EmbedBuilder.from(msg.embeds[0])
      .setFooter({ text: `🎉 Winners: ${resultText}` })
      .setColor('Green');

    await msg.edit({ embeds: [embed], components: [] });

    await channel.send({
      content: `🎉 **Congratulations!** ${resultText} for winning **${prize}**!`,
      allowedMentions: { parse: ['users', 'roles'] },
    });

    console.log(`🏁 Giveaway ended for prize: ${prize}`);
  } catch (err) {
    console.error('❌ Failed to announce winners:', err);
  }
}

// Slash Command: Reroll
function rerollGiveaway(messageId, interaction) {
  const giveaway = giveaways.get(messageId);
  if (!giveaway) return interaction.reply({ content: 'Giveaway not found or already ended.', flags: 64 });

  const participantsArray = [...giveaway.participants];
  if (participantsArray.length < giveaway.winners) {
    return interaction.reply({ content: 'Not enough participants to reroll.', flags: 64 });
  }

  const shuffled = participantsArray.sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, giveaway.winners).map(id => `<@${id}>`);

  interaction.reply({ content: `🎉 New Winners: ${winners.join(', ')}` });
}

// Slash Command: Cancel
function cancelGiveaway(messageId, interaction) {
  if (giveaways.has(messageId)) {
    giveaways.delete(messageId);
    interaction.reply({ content: '🚫 Giveaway has been cancelled.', flags: 64 });
  } else {
    interaction.reply({ content: 'Giveaway not found.', flags: 64 });
  }
}

keepAlive();
client.login(token);
