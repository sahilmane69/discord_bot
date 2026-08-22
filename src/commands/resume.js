import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { successEmbed } from '../utils/embeds.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Resume the current song');

export async function execute(interaction) {
  const queue = useQueue(interaction.guild.id);
  const queueCheck = requireActiveQueue(queue);

  if (!queueCheck.ok) {
    return interaction.reply(queueCheck.response);
  }

  const voiceCheck = requireSameVoiceChannel(interaction, queue);
  if (!voiceCheck.ok) {
    return interaction.reply(voiceCheck.response);
  }

  if (!queue.node.isPaused()) {
    return interaction.reply({
      embeds: [successEmbed('Already playing', 'Playback is not paused.')],
      ephemeral: true,
    });
  }

  queue.node.resume();

  return interaction.reply({
    embeds: [successEmbed('Resumed', 'Playback has been resumed.')],
  });
}
