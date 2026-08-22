const DJ_ROLE_ID = process.env.DJ_ROLE_ID?.trim() || null;

export function hasDjAccess(member, queue) {
  if (!member) return false;

  if (member.permissions?.has('ManageGuild') || member.permissions?.has('Administrator')) {
    return true;
  }

  if (DJ_ROLE_ID && member.roles?.cache?.has(DJ_ROLE_ID)) {
    return true;
  }

  const requesterId = queue?.currentTrack?.requestedBy?.id;
  if (requesterId && member.id === requesterId) {
    return true;
  }

  if (!DJ_ROLE_ID) {
    return true;
  }

  return false;
}

export function requireDjAccess(interaction, queue) {
  if (hasDjAccess(interaction.member, queue)) {
    return { ok: true };
  }

  return {
    ok: false,
    response: {
      content: 'You need the DJ role (or be the requester) to use that control.',
      ephemeral: true,
    },
  };
}
