import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { successEmbed, errorEmbed } from '../utils/embeds.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';
import { requireDjAccess } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('remove')
  .setDescription('Remove a song from the queue by position')
  .addIntegerOption((option) =>
    option
      .setName('position')
      .setDescription('Queue position (1 = next up)')
      .setRequired(true)
      .setMinValue(1),
  );

export async function execute(interaction) {
  const queue = useQueue(interaction.guild.id);
  const queueCheck = requireActiveQueue(queue);
  if (!queueCheck.ok) return interaction.reply(queueCheck.response);

  const voiceCheck = requireSameVoiceChannel(interaction, queue);
  if (!voiceCheck.ok) return interaction.reply(voiceCheck.response);

  const djCheck = requireDjAccess(interaction, queue);
  if (!djCheck.ok) return interaction.reply(djCheck.response);

  const position = interaction.options.getInteger('position', true);
  const tracks = queue.tracks.toArray();

  if (position > tracks.length) {
    return interaction.reply({
      embeds: [errorEmbed('Invalid position', `The queue only has **${tracks.length}** upcoming tracks.`)],
      ephemeral: true,
    });
  }

  const removed = queue.removeTrack(tracks[position - 1]);

  return interaction.reply({
    embeds: [
      successEmbed(
        'Removed',
        removed ? `Removed **${removed.title}** from the queue.` : 'Track removed.',
      ),
    ],
  });
}
