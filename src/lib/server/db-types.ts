import type { ReviewState } from "@/lib/srs";

export type { ReviewGrade, ReviewState } from "@/lib/srs";

export type GrammarProgress = {
  completedAt: string;
  score: number;
  total: number;
};

export type WritingStatus = "draft" | "final";

export type WritingRecord = {
  id: string;
  userId: string;
  title: string;
  titleZh: string;
  body: string;
  translation: string;
  tags: string[];
  status: WritingStatus;
  createdAt: string;
  updatedAt: string;
};

export type ActivityType = "review" | "grammar" | "writing" | "account";

export type ActivityRecord = {
  id: string;
  userId: string;
  type: ActivityType;
  at: string;
  meta?: Record<string, string | number>;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type SessionRecord = {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type Database = {
  version: 1;
  createdAt: string;
  users: UserRecord[];
  sessions: SessionRecord[];
  reviewStates: Record<string, Record<string, ReviewState>>;
  grammarProgress: Record<string, Record<string, GrammarProgress>>;
  writings: WritingRecord[];
  activities: ActivityRecord[];
};
