import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { useMainPlayer } from 'discord-player';
import { successEmbed } from '../utils/embeds.js';
import { requireDjAccess } from '../utils/permissions.js';
import { updateBotPresence } from '../utils/presence.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';
import { guildPlaybackSettings } from '../music/player.js';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Stop playback, clear the queue, and leave the voice channel');

export async function execute(interaction) {
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

  queue.delete();
  guildPlaybackSettings.delete(interaction.guild.id);
  await updateBotPresence(interaction.client, useMainPlayer());

  return interaction.reply({
    embeds: [successEmbed('Stopped', 'Playback stopped and the bot left the voice channel.')],
  });
}
