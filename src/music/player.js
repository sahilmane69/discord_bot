import { Player, QueueRepeatMode } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import ffmpeg from 'ffmpeg-static';
import { postNowPlayingMessage, refreshNowPlayingMessage } from '../music/controlsMessage.js';
import { updateBotPresence } from '../utils/presence.js';

if (ffmpeg) {
  process.env.FFMPEG_PATH = ffmpeg;
}

/** @type {Map<string, { loopMode: 'off' | 'song' | 'queue', autoplay: boolean }>} */
export const guildPlaybackSettings = new Map();

const DEFAULT_SETTINGS = { loopMode: 'off', autoplay: false };

export function getGuildSettings(guildId) {
  if (!guildPlaybackSettings.has(guildId)) {
    guildPlaybackSettings.set(guildId, { ...DEFAULT_SETTINGS });
  }

  return guildPlaybackSettings.get(guildId);
}

export function applyPlaybackModes(queue) {
  if (!queue) return;

  const settings = getGuildSettings(queue.guild.id);

  if (settings.loopMode === 'song') {
    queue.setRepeatMode(QueueRepeatMode.TRACK);
    return;
  }

  if (settings.loopMode === 'queue') {
    queue.setRepeatMode(QueueRepeatMode.QUEUE);
    return;
  }

  if (settings.autoplay) {
    queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
    return;
  }

  queue.setRepeatMode(QueueRepeatMode.OFF);
}

export function setLoopMode(guildId, mode) {
  const settings = getGuildSettings(guildId);
  settings.loopMode = mode;

  if (mode !== 'off') {
    settings.autoplay = false;
  }
}

export function setAutoplay(guildId, enabled) {
  const settings = getGuildSettings(guildId);
  settings.autoplay = enabled;

  if (enabled) {
    settings.loopMode = 'off';
  }
}

export function isSpotifyUrl(query) {
  return /https?:\/\/(?:open\.)?spotify\.com\//i.test(query);
}

export function getSpotifyHelpMessage() {
  return [
    'Could not play that Spotify link.',
    '',
    'This bot does not use the Spotify API. Try one of these instead:',
    '• A YouTube or SoundCloud URL',
    '• A direct audio file URL',
    '• A search query such as `shape of you`',
  ].join('\n');
}

export async function createPlayer(client) {
  const player = new Player(client, {
    skipFFmpeg: false,
  });

  await player.extractors.register(YoutubeiExtractor, {
    disablePlayer: true,
    useYoutubeDL: true,
    logLevel: 'LOW',
    streamOptions: {
      useClient: 'ANDROID',
    },
  });

  await player.extractors.loadMulti(DefaultExtractors);

  player.events.on('playerStart', async (queue, track) => {
    await updateBotPresence(client, player);

    const channel = queue.metadata?.channel;
    if (!channel) return;

    await postNowPlayingMessage(queue, channel);
  });

  player.events.on('playerFinish', async (queue) => {
    await refreshNowPlayingMessage(queue);
    await updateBotPresence(client, player);
  });

  player.events.on('playerError', (queue, error) => {
    console.error(`[playerError] ${queue.guild.name}:`, error);
    const channel = queue.metadata?.channel;
    channel
      ?.send({
        embeds: [
          {
            color: 0xed4245,
            title: 'Playback error',
            description:
              'Failed to play that track. Try another YouTube/SoundCloud link, search text, or pick a related song.',
          },
        ],
      })
      .catch(() => {});
  });

  player.events.on('error', (queue, error) => {
    console.error(`[queueError] ${queue?.guild?.name ?? 'unknown'}:`, error);
  });

  player.events.on('emptyQueue', (queue) => {
    applyPlaybackModes(queue);
  });

  player.events.on('disconnect', async (queue) => {
    guildPlaybackSettings.delete(queue.guild.id);
    await updateBotPresence(client, player);
  });

  console.log('YouTube extractor ready (ANDROID client + yt-dlp fallback)');

  return player;
}

export function getLoopModeLabel(mode) {
  switch (mode) {
    case 'song':
      return 'Song';
    case 'queue':
      return 'Queue';
    default:
      return 'Off';
  }
}

export function getRepeatModeFromSettings(guildId) {
  const settings = getGuildSettings(guildId);

  if (settings.loopMode === 'song') return QueueRepeatMode.TRACK;
  if (settings.loopMode === 'queue') return QueueRepeatMode.QUEUE;
  if (settings.autoplay) return QueueRepeatMode.AUTOPLAY;
  return QueueRepeatMode.OFF;
}
