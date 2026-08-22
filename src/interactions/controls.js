import { useMainPlayer, useQueue } from 'discord-player';
import {
  buildRelatedSelectMenu,
  CONTROL_IDS,
} from '../utils/controls.js';
import { errorEmbed, infoEmbed, successEmbed } from '../utils/embeds.js';
import { refreshNowPlayingMessage, postNowPlayingMessage } from '../music/controlsMessage.js';
import { requireDjAccess } from '../utils/permissions.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';
import {
  applyPlaybackModes,
  getGuildSettings,
  getLoopModeLabel,
  guildPlaybackSettings,
  setLoopMode,
} from '../music/player.js';
import { fetchRelatedTracks } from '../music/related.js';
import {
  pendingRelatedSelections,
  pendingSearchSelections,
  selectionKey,
  storeRelatedSelection,
} from '../music/pending.js';
import { updateBotPresence } from '../utils/presence.js';

export async function handleButtonInteraction(interaction, player) {
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

  const { customId } = interaction;

  switch (customId) {
    case CONTROL_IDS.TOGGLE: {
      if (queue.node.isPaused()) queue.node.resume();
      else queue.node.pause();
      await interaction.deferUpdate();
      await refreshNowPlayingMessage(queue);
      return;
    }
    case CONTROL_IDS.SKIP: {
      await interaction.deferUpdate();
      await queue.node.skip();
      return;
    }
    case CONTROL_IDS.STOP: {
      queue.delete();
      guildPlaybackSettings.delete(interaction.guild.id);
      await updateBotPresence(interaction.client, player);
      return interaction.update({
        embeds: [successEmbed('Stopped', 'Playback stopped and the bot left the voice channel.')],
        components: [],
      });
    }
    case CONTROL_IDS.SHUFFLE: {
      queue.enableShuffle(false);
      await interaction.reply({
        embeds: [successEmbed('Shuffled', 'The queue has been shuffled.')],
        ephemeral: true,
      });
      return;
    }
    case CONTROL_IDS.VOL_DOWN: {
      const next = Math.max(0, (queue.node.volume ?? 80) - 10);
      queue.node.setVolume(next);
      await interaction.deferUpdate();
      await refreshNowPlayingMessage(queue);
      return;
    }
    case CONTROL_IDS.VOL_UP: {
      const next = Math.min(100, (queue.node.volume ?? 80) + 10);
      queue.node.setVolume(next);
      await interaction.deferUpdate();
      await refreshNowPlayingMessage(queue);
      return;
    }
    case CONTROL_IDS.LOOP: {
      const settings = getGuildSettings(interaction.guild.id);
      const next =
        settings.loopMode === 'off'
          ? 'song'
          : settings.loopMode === 'song'
            ? 'queue'
            : 'off';
      setLoopMode(interaction.guild.id, next);
      applyPlaybackModes(queue);
      await interaction.reply({
        embeds: [successEmbed('Loop updated', `Loop mode is now **${getLoopModeLabel(next)}**.`)],
        ephemeral: true,
      });
      await refreshNowPlayingMessage(queue);
      return;
    }
    case CONTROL_IDS.RELATED: {
      await interaction.deferReply({ ephemeral: true });
      const tracks = await fetchRelatedTracks(player, queue, 10);
      if (!tracks.length) {
        return interaction.editReply({
          embeds: [errorEmbed('No related songs', 'Could not find related tracks right now.')],
        });
      }
      const key = selectionKey(interaction.guild.id, interaction.user.id);
      storeRelatedSelection(key, { tracks });
      return interaction.editReply({
        embeds: [infoEmbed('Related songs', 'Pick a track to add to the queue.')],
        components: buildRelatedSelectMenu(tracks, key),
      });
    }
    case CONTROL_IDS.QUEUE: {
      const upcoming = queue.tracks.toArray().slice(0, 10);
      const lines = upcoming.length
        ? upcoming.map((t, i) => `${i + 1}. ${t.title}`).join('\n')
        : '_No upcoming tracks._';
      return interaction.reply({
        embeds: [
          infoEmbed(
            'Up Next',
            `**Now:** ${queue.currentTrack?.title ?? 'Nothing'}\n\n${lines}`,
          ),
        ],
        ephemeral: true,
      });
    }
    default:
      return interaction.reply({ content: 'Unknown control.', ephemeral: true });
  }
}

export async function handleSelectMenuInteraction(interaction, player) {
  if (interaction.customId.startsWith(`${CONTROL_IDS.SEARCH_PICK}:`)) {
    return handleSearchPick(interaction, player);
  }

  if (interaction.customId.startsWith(`${CONTROL_IDS.RELATED_PICK}:`)) {
    return handleRelatedPick(interaction, player);
  }
}

async function handleSearchPick(interaction, player) {
  const key = interaction.customId.split(':').slice(2).join(':');
  const pending = pendingSearchSelections.get(key);

  if (!pending) {
    return interaction.reply({
      embeds: [errorEmbed('Expired', 'That search menu expired. Run `/play` again.')],
      ephemeral: true,
    });
  }

  const index = Number(interaction.values[0]);
  const track = pending.tracks[index];

  if (!track) {
    return interaction.reply({
      embeds: [errorEmbed('Invalid pick', 'That track is no longer available.')],
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const voiceChannel = interaction.guild.channels.cache.get(pending.voiceChannelId);
  if (!voiceChannel) {
    return interaction.editReply({
      embeds: [errorEmbed('Voice channel missing', 'Rejoin a voice channel and try again.')],
    });
  }

  try {
    const result = await player.play(voiceChannel, track, {
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
    pendingSearchSelections.delete(key);

    const isNowPlaying = result.queue.currentTrack?.id === track.id;
    await interaction.editReply({
      embeds: [
        successEmbed(
          isNowPlaying ? 'Now Playing' : 'Added to Queue',
          `[${track.title}](${track.url})`,
        ),
      ],
    });

    if (isNowPlaying) {
      await postNowPlayingMessage(result.queue, interaction.channel);
    }
  } catch (error) {
    console.error('[search-pick]', error);
    return interaction.editReply({
      embeds: [errorEmbed('Playback failed', 'Could not play the selected track.')],
    });
  }
}

async function handleRelatedPick(interaction, player) {
  const queue = useQueue(interaction.guild.id);
  const queueCheck = requireActiveQueue(queue);
  if (!queueCheck.ok) {
    return interaction.reply(queueCheck.response);
  }

  const voiceCheck = requireSameVoiceChannel(interaction, queue);
  if (!voiceCheck.ok) {
    return interaction.reply(voiceCheck.response);
  }

  const key = interaction.customId.split(':').slice(2).join(':');
  const pending = pendingRelatedSelections.get(key);

  if (!pending) {
    return interaction.reply({
      embeds: [errorEmbed('Expired', 'That menu expired. Press Related again.')],
      ephemeral: true,
    });
  }

  const index = Number(interaction.values[0]);
  const track = pending.tracks[index];

  if (!track) {
    return interaction.reply({
      embeds: [errorEmbed('Invalid pick', 'That track is no longer available.')],
      ephemeral: true,
    });
  }

  track.requestedBy = interaction.user;
  queue.addTrack(track);
  pendingRelatedSelections.delete(key);

  return interaction.reply({
    embeds: [successEmbed('Added', `Added **[${track.title}](${track.url})** to the queue.`)],
    ephemeral: true,
  });
}

export { handleSearchPick, handleRelatedPick };
