import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { successEmbed } from '../utils/embeds.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';
import { requireDjAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('clearqueue')
  .setDescription('Clear all upcoming songs from the queue');

export async function execute(interaction) {
  const queue = useQueue(interaction.guild.id);
  const queueCheck = requireActiveQueue(queue);
  if (!queueCheck.ok) return interaction.reply(queueCheck.response);

  const voiceCheck = requireSameVoiceChannel(interaction, queue);
  if (!voiceCheck.ok) return interaction.reply(voiceCheck.response);

  const djCheck = requireDjAccess(interaction, queue);
  if (!djCheck.ok) return interaction.reply(djCheck.response);

  const count = queue.tracks.size;
  queue.tracks.clear();

  return interaction.reply({
    embeds: [successEmbed('Queue cleared', `Removed **${count}** upcoming track(s).`)],
  });
}
