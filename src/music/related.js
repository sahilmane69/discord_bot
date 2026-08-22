import { YoutubeiExtractor } from 'discord-player-youtubei';

const YOUTUBEI_ID = 'com.retrouser955.discord-player.discord-player-youtubei';

export async function fetchRelatedTracks(player, queue, limit = 10) {
  const current = queue?.currentTrack;
  if (!current) return [];

  const extractor = player.extractors.store.get(YOUTUBEI_ID);

  if (extractor instanceof YoutubeiExtractor && typeof extractor.getRelatedTracks === 'function') {
    try {
      const result = await extractor.getRelatedTracks(current, queue.history);
      return (result?.tracks ?? []).slice(0, limit);
    } catch (error) {
      console.error('[related]', error);
    }
  }

  try {
    const fallbackQuery = [current.author, current.title].filter(Boolean).join(' ');
    const search = await player.search(fallbackQuery || current.title, {
      requestedBy: current.requestedBy,
    });
    return search.tracks
      .filter((track) => track.url !== current.url)
      .slice(0, limit);
  } catch (error) {
    console.error('[related-fallback]', error);
    return [];
  }
}
