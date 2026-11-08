export type ParticipantPublic = {
  id: string;
  displayName: string;
};

export type GroupSnapshot = {
  id: string;
  name: string | null;
  inviteCode: string;
  organizerId: string;
  drawnAt: string | null;
  participants: ParticipantPublic[];
  myAssignment: { id: string; displayName: string } | null;
  isOrganizer: boolean;
};
