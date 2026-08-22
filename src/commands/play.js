import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import { postNowPlayingMessage } from '../music/controlsMessage.js';
import { errorEmbed, infoEmbed, musicEmbed, successEmbed } from '../utils/embeds.js';
import { buildSearchSelectMenu } from '../utils/controls.js';
import { requireVoiceChannel } from '../utils/voice.js';
import { isDirectPlayQuery } from '../utils/search.js';
import { selectionKey, storeSearchSelection } from '../music/pending.js';
import {
  applyPlaybackModes,
  getSpotifyHelpMessage,
  isSpotifyUrl,
} from '../music/player.js';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play music with saiman bot — URL or search query')
  .addStringOption((option) =>
    option
      .setName('query_or_url')
      .setDescription('YouTube/SoundCloud URL, direct audio URL, or search text')
      .setRequired(true),
  );

export async function execute(interaction) {
  const voiceCheck = requireVoiceChannel(interaction);
  if (!voiceCheck.ok) {
    return interaction.reply(voiceCheck.response);
  }

  const query = interaction.options.getString('query_or_url', true).trim();
  const player = useMainPlayer();
  const voiceChannel = voiceCheck.channel;

  await interaction.deferReply();

  if (!isDirectPlayQuery(query)) {
    try {
      const search = await player.search(query, { requestedBy: interaction.user });

      if (!search.hasTracks()) {
        return interaction.editReply({
          embeds: [errorEmbed('No results', `Nothing found for \`${query}\`.`)],
        });
      }

      if (search.tracks.length > 1 && !search.playlist) {
        const key = selectionKey(interaction.guild.id, interaction.user.id);
        storeSearchSelection(key, {
          tracks: search.tracks.slice(0, 25),
          voiceChannelId: voiceChannel.id,
          textChannelId: interaction.channel.id,
          requestedBy: interaction.user,
        });

        return interaction.editReply({
          embeds: [
            infoEmbed(
              'Pick a song',
              `Found **${search.tracks.length}** results for **${query}**. Choose one below.`,
            ),
          ],
          components: buildSearchSelectMenu(search.tracks, key),
        });
      }
    } catch (error) {
      console.error('[play-search]', error);
    }
  }

  try {
    const result = await player.play(voiceChannel, query, {
      requestedBy: interaction.user,
      nodeOptions: {
        metadata: {
          channel: interaction.channel,
          client: interaction.client,
        },
        volume: 80,
      },
    });

    applyPlaybackModes(result.queue);

    const { track, searchResult, queue } = result;
    const playlist = searchResult.playlist;

    if (playlist) {
      return interaction.editReply({
        embeds: [
          successEmbed(
            'Playlist added',
            `Added **${playlist.tracks.length}** tracks from **[${playlist.title}](${playlist.url})** to the queue.`,
          ),
        ],
      });
    }

    const isNowPlaying = queue?.currentTrack?.id === track.id;

    await interaction.editReply({
      embeds: [
        musicEmbed(isNowPlaying ? 'Now Playing' : 'Added to Queue', [
          { name: 'Title', value: `[${track.title}](${track.url})`, inline: false },
          { name: 'Duration', value: track.duration || 'Unknown', inline: true },
          { name: 'Requested by', value: `${interaction.user}`, inline: true },
        ]),
      ],
    });

    if (isNowPlaying) {
      await postNowPlayingMessage(queue, interaction.channel);
    }
  } catch (error) {
    console.error('[play]', error);

    const message = error?.message ?? 'Unknown error';
    const userMessage = isSpotifyUrl(query)
      ? getSpotifyHelpMessage()
      : message.includes('No results') ||
          message.includes('Could not extract') ||
          message.includes('Sign in') ||
          message.includes('403')
        ? 'YouTube playback failed. Try:\n• Search text like `shape of you`\n• A SoundCloud URL\n• Waiting a few seconds and trying again'
        : `Could not play that input.\n\`${message.slice(0, 200)}\``;

    return interaction.editReply({
      embeds: [
        errorEmbed(
          isSpotifyUrl(query) ? 'Spotify link not supported' : 'Playback failed',
          userMessage,
        ),
      ],
    });
  }
}
