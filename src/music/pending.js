/** @type {Map<string, { tracks: import('discord-player').Track[], voiceChannelId: string, textChannelId: string, requestedBy: import('discord.js').User }>} */
export const pendingSearchSelections = new Map();

/** @type {Map<string, { tracks: import('discord-player').Track[] }>} */
export const pendingRelatedSelections = new Map();

export function storeSearchSelection(key, data) {
  pendingSearchSelections.set(key, data);
  setTimeout(() => pendingSearchSelections.delete(key), 5 * 60 * 1000);
}

export function storeRelatedSelection(key, data) {
  pendingRelatedSelections.set(key, data);
  setTimeout(() => pendingRelatedSelections.delete(key), 5 * 60 * 1000);
}

export function selectionKey(guildId, userId) {
  return `${guildId}:${userId}`;
}
