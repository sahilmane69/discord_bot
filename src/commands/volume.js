import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { successEmbed } from '../utils/embeds.js';
import { requireDjAccess } from '../utils/permissions.js';
import { refreshNowPlayingMessage } from '../music/controlsMessage.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';

export const data = new SlashCommandBuilder()
  .setName('volume')
  .setDescription('Set the playback volume')
  .addIntegerOption((option) =>
    option
      .setName('level')
      .setDescription('Volume level from 0 to 100')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(100),
  );

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

  const level = interaction.options.getInteger('level', true);
  queue.node.setVolume(level);
  await refreshNowPlayingMessage(queue);

  return interaction.reply({
    embeds: [successEmbed('Volume updated', `Volume set to **${level}%**.`)],
  });
}
