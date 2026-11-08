import { assignSecretSanta } from "@/lib/secret-santa";
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from "@/lib/invite-code";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { GroupSnapshot } from "@/lib/types";

type GroupRow = {
  id: string;
  name: string | null;
  invite_code: string;
  organizer_id: string;
  drawn_at: string | null;
};

type ParticipantRow = {
  id: string;
  group_id: string;
  display_name: string;
  assigned_to: string | null;
};

export async function createGroup(input: {
  organizerName: string;
  name?: string;
}): Promise<{ inviteCode: string; participantId: string; groupId: string }> {
  const db = getSupabaseAdmin();
  let inviteCode = generateInviteCode();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data: group, error: groupError } = await db
      .from("groups")
      .insert({
        name: input.name?.trim() || null,
        invite_code: inviteCode,
        organizer_id: null,
      })
      .select("id, invite_code")
      .single();

    if (!groupError && group) {
      const { data: participant, error: partError } = await db
        .from("participants")
        .insert({
          group_id: group.id,
          display_name: input.organizerName.trim(),
        })
        .select("id")
        .single();

      if (partError || !participant) {
        await db.from("groups").delete().eq("id", group.id);
        throw new Error(partError?.message ?? "Kunde inte skapa organisatör");
      }

      const { error: linkError } = await db
        .from("groups")
        .update({ organizer_id: participant.id })
        .eq("id", group.id);

      if (linkError) {
        throw new Error(linkError.message);
      }

      return {
        inviteCode: group.invite_code,
        participantId: participant.id,
        groupId: group.id,
      };
    }

    if (groupError?.code === "23505") {
      inviteCode = generateInviteCode();
      continue;
    }

    throw new Error(groupError?.message ?? "Kunde inte skapa grupp");
  }

  throw new Error("Kunde inte generera unik kod");
}

export async function joinGroup(input: {
  inviteCode: string;
  displayName: string;
}): Promise<{ inviteCode: string; participantId: string; groupId: string }> {
  const code = normalizeInviteCode(input.inviteCode);
  if (!isValidInviteCode(code)) {
    throw new Error("Ogiltig inbjudningskod");
  }

  const db = getSupabaseAdmin();
  const { data: group, error: groupError } = await db
    .from("groups")
    .select("id, invite_code, drawn_at")
    .eq("invite_code", code)
    .maybeSingle();

  if (groupError) {
    throw new Error(groupError.message);
  }
  if (!group) {
    throw new Error("Gruppen hittades inte");
  }
  if (group.drawn_at) {
    throw new Error("Dragningen är redan gjord — inga nya deltagare");
  }

  const { data: participant, error: partError } = await db
    .from("participants")
    .insert({
      group_id: group.id,
      display_name: input.displayName.trim(),
    })
    .select("id")
    .single();

  if (partError) {
    if (partError.code === "23505") {
      throw new Error("Namnet är redan taget i gruppen");
    }
    throw new Error(partError.message);
  }

  return {
    inviteCode: group.invite_code,
    participantId: participant.id,
    groupId: group.id,
  };
}

async function loadGroupByCode(code: string): Promise<{
  group: GroupRow;
  participants: ParticipantRow[];
}> {
  const db = getSupabaseAdmin();
  const { data: group, error } = await db
    .from("groups")
    .select("id, name, invite_code, organizer_id, drawn_at")
    .eq("invite_code", normalizeInviteCode(code))
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!group) {
    throw new Error("Gruppen hittades inte");
  }

  const { data: participants, error: pError } = await db
    .from("participants")
    .select("id, group_id, display_name, assigned_to")
    .eq("group_id", group.id)
    .order("created_at", { ascending: true });

  if (pError) {
    throw new Error(pError.message);
  }

  return { group, participants: participants ?? [] };
}

export async function getGroupSnapshot(
  code: string,
  viewerParticipantId?: string | null,
): Promise<GroupSnapshot> {
  const { group, participants } = await loadGroupByCode(code);

  let myAssignment: GroupSnapshot["myAssignment"] = null;
  if (viewerParticipantId && group.drawn_at) {
    const me = participants.find((p) => p.id === viewerParticipantId);
    if (me?.assigned_to) {
      const receiver = participants.find((p) => p.id === me.assigned_to);
      if (receiver) {
        myAssignment = { id: receiver.id, displayName: receiver.display_name };
      }
    }
  }

  return {
    id: group.id,
    name: group.name,
    inviteCode: group.invite_code,
    organizerId: group.organizer_id,
    drawnAt: group.drawn_at,
    participants: participants.map((p) => ({
      id: p.id,
      displayName: p.display_name,
    })),
    myAssignment,
    isOrganizer: viewerParticipantId === group.organizer_id,
  };
}

export async function runDraw(
  code: string,
  participantId: string,
): Promise<GroupSnapshot> {
  const { group, participants } = await loadGroupByCode(code);

  if (group.organizer_id !== participantId) {
    throw new Error("Bara organisatören kan dra julklappar");
  }
  if (group.drawn_at) {
    throw new Error("Dragningen är redan gjord");
  }
  if (participants.length < 3) {
    throw new Error("Minst tre deltagare krävs för dragning");
  }

  const order = assignSecretSanta(participants.length);
  const db = getSupabaseAdmin();

  for (let i = 0; i < participants.length; i += 1) {
    const giver = participants[i];
    const receiver = participants[order[i]];
    const { error } = await db
      .from("participants")
      .update({ assigned_to: receiver.id })
      .eq("id", giver.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  const { error: drawError } = await db
    .from("groups")
    .update({ drawn_at: new Date().toISOString() })
    .eq("id", group.id);

  if (drawError) {
    throw new Error(drawError.message);
  }

  return getGroupSnapshot(code, participantId);
}

export async function getParticipantAssignment(participantId: string) {
  const db = getSupabaseAdmin();
  const { data: participant, error } = await db
    .from("participants")
    .select("id, display_name, assigned_to, group_id")
    .eq("id", participantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!participant) {
    throw new Error("Deltagaren hittades inte");
  }

  const { data: group, error: gError } = await db
    .from("groups")
    .select("drawn_at")
    .eq("id", participant.group_id)
    .single();

  if (gError) {
    throw new Error(gError.message);
  }
  if (!group.drawn_at) {
    return { assignedTo: null as null };
  }

  if (!participant.assigned_to) {
    return { assignedTo: null as null };
  }

  const { data: receiver, error: rError } = await db
    .from("participants")
    .select("id, display_name")
    .eq("id", participant.assigned_to)
    .single();

  if (rError || !receiver) {
    throw new Error(rError?.message ?? "Mottagare saknas");
  }

  return {
    assignedTo: { id: receiver.id, displayName: receiver.display_name },
  };
}
