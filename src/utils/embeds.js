import { EmbedBuilder } from 'discord.js';

export const COLORS = {
  success: 0x57f287,
  error: 0xed4245,
  info: 0x5865f2,
  music: 0x1db954,
};

export function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle(title)
    .setDescription(description);
}

export function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.error)
    .setTitle(title)
    .setDescription(description);
}

export function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(title)
    .setDescription(description);
}

export function musicEmbed(title, fields = []) {
  const embed = new EmbedBuilder().setColor(COLORS.music).setTitle(title);

  for (const field of fields) {
    embed.addFields(field);
  }

  return embed;
}

export function formatDuration(ms) {
  if (!ms || ms <= 0) return 'Live / Unknown';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
