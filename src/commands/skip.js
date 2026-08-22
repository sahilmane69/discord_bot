import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { successEmbed } from '../utils/embeds.js';
import { requireDjAccess } from '../utils/permissions.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Skip the current song');

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

  const djCheck = requireDjAccess(interaction, queue);
  if (!djCheck.ok) {
    return interaction.reply(djCheck.response);
  }

  const current = queue.currentTrack;
  await queue.node.skip();

  return interaction.reply({
    embeds: [
      successEmbed(
        'Skipped',
        current ? `Skipped **${current.title}**.` : 'Skipped the current track.',
      ),
    ],
  });
}
