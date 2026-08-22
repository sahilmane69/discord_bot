import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { infoEmbed } from '../utils/embeds.js';
import { requireActiveQueue } from '../utils/voice.js';
import { getGuildSettings, getLoopModeLabel } from '../music/player.js';

export const data = new SlashCommandBuilder()
  .setName('nowplaying')
  .setDescription('Show details about the current song');

export async function execute(interaction) {
  const queue = useQueue(interaction.guild.id);
  const queueCheck = requireActiveQueue(queue);

  if (!queueCheck.ok) {
    return interaction.reply(queueCheck.response);
  }

  const track = queue.currentTrack;

  if (!track) {
    return interaction.reply({
      embeds: [infoEmbed('Now Playing', 'Nothing is currently playing.')],
      ephemeral: true,
    });
  }

  const timestamp = queue.node.getTimestamp();
  const progressBar = queue.node.createProgressBar();
  const settings = getGuildSettings(interaction.guild.id);
  const requester = track.requestedBy ? `${track.requestedBy}` : 'Unknown';

  const embed = infoEmbed('Now Playing', `[${track.title}](${track.url})`)
    .addFields(
      { name: 'Duration', value: track.duration || 'Unknown', inline: true },
      { name: 'Requested by', value: requester, inline: true },
      { name: 'Volume', value: `${queue.node.volume ?? 80}%`, inline: true },
      {
        name: 'Progress',
        value: timestamp
          ? `${timestamp.current.label} ${progressBar ?? ''} ${timestamp.total.label}`
          : 'Unavailable',
        inline: false,
      },
      {
        name: 'Loop / Autoplay',
        value: `Loop: **${getLoopModeLabel(settings.loopMode)}** | Autoplay: **${settings.autoplay ? 'On' : 'Off'}**`,
        inline: false,
      },
    );

  if (track.thumbnail) {
    embed.setThumbnail(track.thumbnail);
  }

  return interaction.reply({ embeds: [embed] });
}
