import type { ReviewState } from "@/lib/srs";
import type { DictionaryWord } from "@/data/dictionary/types";
import type { GrammarLesson } from "@/data/grammar/types";
import type { ReadingText } from "@/data/reading/types";
import type { CultureEntry } from "@/data/culture/types";
import type { UserRole } from "@/lib/auth-types";

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
  role: UserRole;
  createdAt: string;
};

export type SessionRecord = {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

/**
 * The shape produced by the demo seed builder. It is only used while creating
 * a brand-new database, never as a runtime snapshot of the SQLite store.
 */
export type SeedSnapshot = {
  users: UserRecord[];
  sessions: SessionRecord[];
  reviewStates: Record<string, Record<string, ReviewState>>;
  grammarProgress: Record<string, Record<string, GrammarProgress>>;
  writings: WritingRecord[];
  activities: ActivityRecord[];
};

/**
 * The previous `.data/ayb.db.json` format. It is read exactly once when the
 * SQLite database is created for the first time.
 */
export type LegacyDatabase = SeedSnapshot & {
  version?: number;
  createdAt?: string;
  customWords?: DictionaryWord[];
  customLessons?: GrammarLesson[];
  customReadingTexts?: ReadingText[];
  customCultureEntries?: CultureEntry[];
};
