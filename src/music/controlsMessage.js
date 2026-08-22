import { buildNowPlayingPayload } from '../utils/controls.js';

export async function refreshNowPlayingMessage(queue) {
  const payload = buildNowPlayingPayload(queue);
  if (!payload || !queue.metadata?.controlsMessageId || !queue.metadata?.channel) {
    return;
  }

  try {
    const message = await queue.metadata.channel.messages.fetch(
      queue.metadata.controlsMessageId,
    );
    await message.edit(payload);
  } catch {
    // Message may have been deleted; ignore.
  }
}

export async function postNowPlayingMessage(queue, channel) {
  const payload = buildNowPlayingPayload(queue);
  if (!payload) return;

  try {
    if (queue.metadata?.controlsMessageId && queue.metadata?.channel) {
      await refreshNowPlayingMessage(queue);
      return;
    }

    const message = await channel.send(payload);
    queue.metadata = {
      ...queue.metadata,
      channel,
      controlsMessageId: message.id,
    };
  } catch (error) {
    console.error('[controls-message]', error);
  }
}
