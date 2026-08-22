import { SlashCommandBuilder } from 'discord.js';
import { infoEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show all music bot commands');

export async function execute(interaction) {
  const embed = infoEmbed('saiman Music Bot — Help', null).addFields(
    {
      name: 'Playback',
      value:
        '`/play` — URL or search (pick from results)\n' +
        '`/pause` `/resume` `/skip` `/stop`\n' +
        '`/seek` — jump to a timestamp\n' +
        '`/nowplaying`',
      inline: false,
    },
    {
      name: 'Queue',
      value:
        '`/queue` `/shuffle` `/clearqueue`\n' +
        '`/remove <position>` `/loop` `/autoplay`',
      inline: false,
    },
    {
      name: 'Other',
      value:
        '`/volume` `/related` `/lyrics`\n' +
        '`/disconnect` — leave voice channel',
      inline: false,
    },
    {
      name: 'Chat controls',
      value:
        'When a song starts, use the **Pause / Skip / Stop / Shuffle / Volume / Loop / Related** buttons on the Now Playing message.',
      inline: false,
    },
    {
      name: 'DJ controls',
      value:
        'Skip, stop, volume, and shuffle require the DJ role (if set), Manage Server, or being the requester.',
      inline: false,
    },
  );

  return interaction.reply({ embeds: [embed], ephemeral: true });
}
