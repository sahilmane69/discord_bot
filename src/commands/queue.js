import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { infoEmbed } from '../utils/embeds.js';
import { requireActiveQueue } from '../utils/voice.js';

const MAX_TRACKS = 10;

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Show the current song and upcoming queue');

export async function execute(interaction) {
  const queue = useQueue(interaction.guild.id);
  const queueCheck = requireActiveQueue(queue);

  if (!queueCheck.ok) {
    return interaction.reply(queueCheck.response);
  }

  const current = queue.currentTrack;
  const upcoming = queue.tracks.toArray().slice(0, MAX_TRACKS);

  const lines = upcoming.length
    ? upcoming
        .map((track, index) => `${index + 1}. [${track.title}](${track.url}) — ${track.duration}`)
        .join('\n')
    : '_No upcoming tracks._';

  const embed = infoEmbed('Music Queue', null)
    .addFields(
      {
        name: 'Now Playing',
        value: current
          ? `[${current.title}](${current.url}) — ${current.duration}`
          : '_Nothing playing_',
        inline: false,
      },
      {
        name: `Up Next (${queue.tracks.size} total)`,
        value: lines.slice(0, 4000),
        inline: false,
      },
    )
    .setFooter({ text: `Volume: ${queue.node.volume ?? 80}%` });

  return interaction.reply({ embeds: [embed] });
}
