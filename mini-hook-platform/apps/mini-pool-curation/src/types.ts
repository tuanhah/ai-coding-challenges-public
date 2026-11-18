export type CurationStatus = "pending" | "approved" | "rejected";

export interface Curation {
  poolId: string;
  status: CurationStatus;
  submittedBy: string;
  submittedAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}

export interface CurationDb {
  curations: Record<string, Curation>;
}
