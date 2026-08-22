import { ActivityType } from 'discord.js';

export function updateBotPresence(client, player) {
  const active = player?.nodes?.cache?.filter((node) => node.isPlaying())?.size ?? 0;

  client.user.setPresence({
    activities: [
      {
        name: active > 0 ? `music in ${active} server${active === 1 ? '' : 's'}` : '/play',
        type: ActivityType.Listening,
      },
    ],
    status: 'online',
  });
}
