import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { successEmbed } from '../utils/embeds.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';
import {
  applyPlaybackModes,
  getLoopModeLabel,
  setLoopMode,
} from '../music/player.js';

export const data = new SlashCommandBuilder()
  .setName('loop')
  .setDescription('Set loop mode for the current session')
  .addStringOption((option) =>
    option
      .setName('mode')
      .setDescription('Loop mode')
      .setRequired(true)
      .addChoices(
        { name: 'Off', value: 'off' },
        { name: 'Song', value: 'song' },
        { name: 'Queue', value: 'queue' },
      ),
  );

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

  const mode = interaction.options.getString('mode', true);
  setLoopMode(interaction.guild.id, mode);
  applyPlaybackModes(queue);

  return interaction.reply({
    embeds: [
      successEmbed('Loop updated', `Loop mode is now **${getLoopModeLabel(mode)}**.`),
    ],
  });
}
