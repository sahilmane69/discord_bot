import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import { getGuildSettings, getLoopModeLabel } from '../music/player.js';

export const CONTROL_IDS = {
  TOGGLE: 'music:toggle',
  SKIP: 'music:skip',
  STOP: 'music:stop',
  SHUFFLE: 'music:shuffle',
  VOL_DOWN: 'music:vol_down',
  VOL_UP: 'music:vol_up',
  LOOP: 'music:loop',
  RELATED: 'music:related',
  QUEUE: 'music:queue',
  SEARCH_PICK: 'music:search_pick',
  RELATED_PICK: 'music:related_pick',
};

export function buildNowPlayingEmbed(queue) {
  const track = queue.currentTrack;
  if (!track) return null;

  const timestamp = queue.node.getTimestamp();
  const progressBar = queue.node.createProgressBar();
  const settings = getGuildSettings(queue.guild.id);
  const requester = track.requestedBy ? `${track.requestedBy}` : 'Unknown';
  const paused = queue.node.isPaused();

  const embed = {
    color: 0x1db954,
    title: paused ? 'Paused' : 'Now Playing',
    description: `[${track.title}](${track.url})`,
    fields: [
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
    ],
    thumbnail: track.thumbnail ? { url: track.thumbnail } : undefined,
    footer: { text: 'Use the buttons below to control playback' },
  };

  return embed;
}

export function buildControlRows(queue) {
  const paused = queue?.node?.isPaused?.() ?? false;

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CONTROL_IDS.TOGGLE)
      .setLabel(paused ? 'Resume' : 'Pause')
      .setEmoji(paused ? '▶️' : '⏸️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(CONTROL_IDS.SKIP)
      .setLabel('Skip')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(CONTROL_IDS.STOP)
      .setLabel('Stop')
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(CONTROL_IDS.SHUFFLE)
      .setLabel('Shuffle')
      .setEmoji('🔀')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(CONTROL_IDS.QUEUE)
      .setLabel('Queue')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CONTROL_IDS.VOL_DOWN)
      .setLabel('-10')
      .setEmoji('🔉')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(CONTROL_IDS.VOL_UP)
      .setLabel('+10')
      .setEmoji('🔊')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(CONTROL_IDS.LOOP)
      .setLabel('Loop')
      .setEmoji('🔁')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(CONTROL_IDS.RELATED)
      .setLabel('Related')
      .setEmoji('🎵')
      .setStyle(ButtonStyle.Success),
  );

  return [row1, row2];
}

export function buildNowPlayingPayload(queue) {
  const embed = buildNowPlayingEmbed(queue);
  if (!embed) return null;

  return {
    embeds: [embed],
    components: buildControlRows(queue),
  };
}

export function buildSearchSelectMenu(tracks, selectionKey) {
  const options = tracks.slice(0, 25).map((track, index) => ({
    label: track.title.slice(0, 100),
    description: `${track.author ?? 'Unknown'} • ${track.duration ?? 'Unknown'}`.slice(0, 100),
    value: String(index),
  }));

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`${CONTROL_IDS.SEARCH_PICK}:${selectionKey}`)
      .setPlaceholder('Pick a song to play')
      .addOptions(options),
  );

  return [row];
}

export function buildRelatedSelectMenu(tracks, selectionKey) {
  const options = tracks.slice(0, 25).map((track, index) => ({
    label: track.title.slice(0, 100),
    description: `${track.author ?? 'Unknown'} • ${track.duration ?? 'Unknown'}`.slice(0, 100),
    value: String(index),
  }));

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`${CONTROL_IDS.RELATED_PICK}:${selectionKey}`)
      .setPlaceholder('Add a related song to the queue')
      .addOptions(options),
  );

  return [row];
}
