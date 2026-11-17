import { Badge } from "@/components/ui/badge";
import type { VerificationStatus } from "@/lib/types";
import type { Dict } from "@/lib/i18n";
import { ShieldCheck, ShieldQuestion, History, Clock, CircleHelp } from "lucide-react";

const tone = { verified: "acid", unverified: "warn", historical: "violet", outdated: "danger", unknown: "neutral" } as const;
const icon = { verified: ShieldCheck, unverified: ShieldQuestion, historical: History, outdated: Clock, unknown: CircleHelp };

export function VerificationBadge({ status, t }: { status: VerificationStatus; t: Dict }) {
  const Icon = icon[status];
  return (
    <Badge tone={tone[status]} title={t.verification[status]}>
      <Icon className="h-3 w-3" aria-hidden />
      {t.verification[status]}
    </Badge>
  );
}
