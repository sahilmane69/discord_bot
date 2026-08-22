import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { successEmbed } from '../utils/embeds.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';
import { requireDjAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('shuffle')
  .setDescription('Shuffle the upcoming queue');

export async function execute(interaction) {
  const queue = useQueue(interaction.guild.id);
  const queueCheck = requireActiveQueue(queue);
  if (!queueCheck.ok) return interaction.reply(queueCheck.response);

  const voiceCheck = requireSameVoiceChannel(interaction, queue);
  if (!voiceCheck.ok) return interaction.reply(voiceCheck.response);

  const djCheck = requireDjAccess(interaction, queue);
  if (!djCheck.ok) return interaction.reply(djCheck.response);

  queue.enableShuffle(false);

  return interaction.reply({
    embeds: [successEmbed('Shuffled', 'The queue has been shuffled.')],
  });
}
