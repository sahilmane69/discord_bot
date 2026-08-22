import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer, useQueue } from 'discord-player';
import { buildRelatedSelectMenu } from '../utils/controls.js';
import { errorEmbed, infoEmbed } from '../utils/embeds.js';
import { requireActiveQueue, requireSameVoiceChannel } from '../utils/voice.js';
import { fetchRelatedTracks } from '../music/related.js';
import { selectionKey, storeRelatedSelection } from '../music/pending.js';

export const data = new SlashCommandBuilder()
  .setName('related')
  .setDescription('Find related songs and add one to the queue');

export async function execute(interaction) {
  const queue = useQueue(interaction.guild.id);
  const queueCheck = requireActiveQueue(queue);
  if (!queueCheck.ok) return interaction.reply(queueCheck.response);

  const voiceCheck = requireSameVoiceChannel(interaction, queue);
  if (!voiceCheck.ok) return interaction.reply(voiceCheck.response);

  await interaction.deferReply({ ephemeral: true });

  const player = useMainPlayer();
  const tracks = await fetchRelatedTracks(player, queue, 10);

  if (!tracks.length) {
    return interaction.editReply({
      embeds: [errorEmbed('No related songs', 'Could not find related tracks right now.')],
    });
  }

  const key = selectionKey(interaction.guild.id, interaction.user.id);
  storeRelatedSelection(key, { tracks });

  return interaction.editReply({
    embeds: [infoEmbed('Related songs', 'Pick a track to add to the queue.')],
    components: buildRelatedSelectMenu(tracks, key),
  });
}
