import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { errorEmbed, infoEmbed } from '../utils/embeds.js';
import { requireActiveQueue } from '../utils/voice.js';

export const data = new SlashCommandBuilder()
  .setName('lyrics')
  .setDescription('Show lyrics for the current song');

async function fetchLyrics(artist, title) {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.lyrics ?? null;
}

export async function execute(interaction) {
  const queue = useQueue(interaction.guild.id);
  const queueCheck = requireActiveQueue(queue);
  if (!queueCheck.ok) return interaction.reply(queueCheck.response);

  const track = queue.currentTrack;

  if (!track) {
    return interaction.reply({
      embeds: [errorEmbed('Nothing playing', 'There is no current track.')],
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const artist = track.author || 'Unknown';
  const title = track.title.replace(/\([^)]*\)/g, '').replace(/\[.*?\]/g, '').trim();
  const lyrics = await fetchLyrics(artist, title);

  if (!lyrics) {
    return interaction.editReply({
      embeds: [
        errorEmbed(
          'Lyrics not found',
          `No lyrics found for **${title}** by **${artist}**.`,
        ),
      ],
    });
  }

  const trimmed = lyrics.trim().slice(0, 3900);

  return interaction.editReply({
    embeds: [
      infoEmbed(`Lyrics — ${track.title}`, trimmed).setFooter({ text: `Source: lyrics.ovh` }),
    ],
  });
}
