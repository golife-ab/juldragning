"use client";

import { GroupClient } from "@/components/group-client";
import { useParams } from "next/navigation";

export function GroupPageInner() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toString().toUpperCase();

  if (!code) {
    return <p className="text-gold/80">Ogiltig grupp</p>;
  }

  return <GroupClient inviteCode={code} />;
}
