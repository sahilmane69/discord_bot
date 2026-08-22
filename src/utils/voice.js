import { errorEmbed } from './embeds.js';

export function getMemberVoiceChannel(interaction) {
  return interaction.member?.voice?.channel ?? null;
}

export function requireVoiceChannel(interaction) {
  const channel = getMemberVoiceChannel(interaction);

  if (!channel) {
    return {
      ok: false,
      response: {
        embeds: [
          errorEmbed(
            'Voice channel required',
            'Join a voice channel before using music commands.',
          ),
        ],
        ephemeral: true,
      },
    };
  }

  return { ok: true, channel };
}

export function requireSameVoiceChannel(interaction, queue) {
  const memberChannel = getMemberVoiceChannel(interaction);

  if (!memberChannel) {
    return {
      ok: false,
      response: {
        embeds: [
          errorEmbed(
            'Voice channel required',
            'Join a voice channel before using music commands.',
          ),
        ],
        ephemeral: true,
      },
    };
  }

  const botChannelId = queue?.channel?.id;

  if (botChannelId && memberChannel.id !== botChannelId) {
    return {
      ok: false,
      response: {
        embeds: [
          errorEmbed(
            'Wrong voice channel',
            'You must be in the same voice channel as the bot.',
          ),
        ],
        ephemeral: true,
      },
    };
  }

  return { ok: true, channel: memberChannel };
}

export function requireActiveQueue(queue) {
  if (!queue) {
    return {
      ok: false,
      response: {
        embeds: [
          errorEmbed(
            'Nothing playing',
            'There is no active music session in this server.',
          ),
        ],
        ephemeral: true,
      },
    };
  }

  return { ok: true };
}
