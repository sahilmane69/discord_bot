import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { successEmbed, errorEmbed } from '../utils/embeds.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';
import { requireDjAccess } from '../utils/permissions.js';
import { refreshNowPlayingMessage } from '../music/controlsMessage.js';

export const data = new SlashCommandBuilder()
  .setName('seek')
  .setDescription('Seek to a position in the current song')
  .addStringOption((option) =>
    option
      .setName('timestamp')
      .setDescription('Time like 1:30 or 90 (seconds)')
      .setRequired(true),
  );

function parseTimestamp(input) {
  const trimmed = input.trim();

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }

  const parts = trimmed.split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part))) return null;

  if (parts.length === 2) {
    return (parts[0] * 60 + parts[1]) * 1000;
  }

  if (parts.length === 3) {
    return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  }

  return null;
}

export async function execute(interaction) {
  const queue = useQueue(interaction.guild.id);
  const queueCheck = requireActiveQueue(queue);
  if (!queueCheck.ok) return interaction.reply(queueCheck.response);

  const voiceCheck = requireSameVoiceChannel(interaction, queue);
  if (!voiceCheck.ok) return interaction.reply(voiceCheck.response);

  const djCheck = requireDjAccess(interaction, queue);
  if (!djCheck.ok) return interaction.reply(djCheck.response);

  const ms = parseTimestamp(interaction.options.getString('timestamp', true));

  if (ms == null || ms < 0) {
    return interaction.reply({
      embeds: [errorEmbed('Invalid time', 'Use formats like `90`, `1:30`, or `1:05:00`.')],
      ephemeral: true,
    });
  }

  const ok = await queue.node.seek(ms);

  if (!ok) {
    return interaction.reply({
      embeds: [errorEmbed('Seek failed', 'Could not seek in the current track.')],
      ephemeral: true,
    });
  }

  await refreshNowPlayingMessage(queue);

  return interaction.reply({
    embeds: [successEmbed('Seeked', `Jumped to **${interaction.options.getString('timestamp', true)}**.`)],
  });
}
