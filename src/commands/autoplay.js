import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { successEmbed } from '../utils/embeds.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';
import { applyPlaybackModes, setAutoplay } from '../music/player.js';

export const data = new SlashCommandBuilder()
  .setName('autoplay')
  .setDescription('Automatically play similar songs when the queue ends')
  .addStringOption((option) =>
    option
      .setName('mode')
      .setDescription('Autoplay mode')
      .setRequired(true)
      .addChoices(
        { name: 'On', value: 'on' },
        { name: 'Off', value: 'off' },
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

  const enabled = interaction.options.getString('mode', true) === 'on';
  setAutoplay(interaction.guild.id, enabled);
  applyPlaybackModes(queue);

  return interaction.reply({
    embeds: [
      successEmbed(
        'Autoplay updated',
        enabled
          ? 'Autoplay is **on**. Similar songs will play when the queue ends.'
          : 'Autoplay is **off**.',
      ),
    ],
  });
}
