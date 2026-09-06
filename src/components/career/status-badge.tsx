import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const STATUS_VARIANTS: Record<ApplicationStatus, BadgeVariant> = {
  WISHLIST: "ghost",
  APPLIED: "secondary",
  SCREENING: "outline",
  INTERVIEW: "default",
  OFFER: "default",
  REJECTED: "destructive",
  ACCEPTED: "secondary",
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  ACCEPTED: "Accepted",
};

export function StatusBadge({ status }: { status: ApplicationStatus }): React.JSX.Element {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
