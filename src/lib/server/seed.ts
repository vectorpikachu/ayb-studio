import { randomUUID } from "node:crypto";
import type {
  ActivityRecord,
  Database,
  GrammarProgress,
  ReviewGrade,
  ReviewState,
  WritingRecord,
} from "./db-types";
import { DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD, isDemoEnabled } from "./demo";
import { hashPassword } from "./password";

function atDaysAgo(now: Date, days: number, hour = 18) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function atHoursAgo(now: Date, hours: number) {
  return new Date(now.getTime() - hours * 3_600_000).toISOString();
}

const demoWordIds = [
  "barev",
  "shnorhakalutyun",
  "hats",
  "jur",
  "surch",
  "girk",
  "tun",
  "arev",
  "tsov",
  "lerr",
  "mayr",
  "hayr",
  "nurr",
  "tsiran",
  "gini",
  "hayeren",
  "yerevan",
  "ser",
  "sirel",
  "sovorel",
];

function buildDemoReviewStates(now: Date): Record<string, ReviewState> {
  return Object.fromEntries(
    demoWordIds.map((id, index) => {
      const due =
        index < 8
          ? atDaysAgo(now, 1 + (index % 3), 8)
          : new Date(now.getTime() + (index - 6) * 86_400_000).toISOString();
      const state: ReviewState = {
        ease: 2.5 + (index % 3) * 0.1,
        interval: 2 + (index % 12),
        repetitions: 2 + (index % 4),
        lapses: index % 3 === 0 ? 1 : 0,
        due,
        lastReviewed: atDaysAgo(now, 1 + (index % 6), 19),
        lastGrade: (index % 3 === 0 ? 3 : 2) as ReviewGrade,
      };
      return [id, state];
    }),
  );
}

function buildDemoActivities(now: Date): ActivityRecord[] {
  const activities: ActivityRecord[] = [];
  for (let day = 0; day < 7; day += 1) {
    const at = day === 0 ? atHoursAgo(now, 0.08) : atDaysAgo(now, day, 19);
    activities.push(
      {
        id: randomUUID(),
        userId: "demo-user",
        type: "review",
        at,
        meta: { count: 4 + (day % 3) },
      },
      {
        id: randomUUID(),
        userId: "demo-user",
        type: "review",
        at: day === 0 ? atHoursAgo(now, 0.03) : atDaysAgo(now, day, 8),
        meta: { count: 3 + (day % 2) },
      },
    );
  }

  activities.push({
    id: randomUUID(),
    userId: "demo-user",
    type: "grammar",
    at: atDaysAgo(now, 4, 20),
    meta: { lessonId: "alphabet-and-sounds" },
  });
  activities.push({
    id: randomUUID(),
    userId: "demo-user",
    type: "grammar",
    at: atDaysAgo(now, 2, 20),
    meta: { lessonId: "hello-and-pronouns" },
  });
  activities.push({
    id: randomUUID(),
    userId: "demo-user",
    type: "writing",
    at: atDaysAgo(now, 3, 21),
    meta: { status: "final" },
  });

  return activities;
}

const demoWriting: WritingRecord = {
  id: "demo-first-day",
  userId: "demo-user",
  title: "Իմ առաջին հայերեն օրը",
  titleZh: "我在亚美尼亚语里的第一天",
  body: [
    "Այսօր ես սովորեցի իմ առաջին հայերեն բառերը։",
    "Բարև, շնորհակալություն, ջուր։ Այս փոքրիկ բառերը ինձ ուրախություն են պարգևում։",
    "Վաղը ես նոր բառեր կսովորեմ։",
  ].join("\n\n"),
  translation:
    "今天我学会了第一批亚美尼亚语单词。你好、谢谢、水。这些小小的词给了我快乐。明天我会学习新的词。",
  tags: ["日记", "第一天"],
  status: "final",
  createdAt: "2026-10-13T18:00:00.000Z",
  updatedAt: "2026-10-13T18:30:00.000Z",
};

export async function buildSeedDatabase(): Promise<Database> {
  const now = new Date();
  const users: Database["users"] = [];
  const reviewStates: Database["reviewStates"] = {};
  const grammarProgress: Database["grammarProgress"] = {};
  const writings: Database["writings"] = [];
  let activities: ActivityRecord[] = [];

  if (isDemoEnabled()) {
    users.push({
      id: "demo-user",
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      role: "admin",
      createdAt: atDaysAgo(now, 42, 10),
    });
    reviewStates["demo-user"] = buildDemoReviewStates(now);
    grammarProgress["demo-user"] = {
      "alphabet-and-sounds": {
        completedAt: atDaysAgo(now, 4, 20),
        score: 3,
        total: 3,
      } satisfies GrammarProgress,
      "hello-and-pronouns": {
        completedAt: atDaysAgo(now, 2, 20),
        score: 2,
        total: 3,
      } satisfies GrammarProgress,
    };
    writings.push({
      ...demoWriting,
      createdAt: atDaysAgo(now, 3, 21),
      updatedAt: atDaysAgo(now, 3, 21),
    });
    activities = buildDemoActivities(now);
  }

  return {
    version: 1,
    createdAt: now.toISOString(),
    users,
    sessions: [],
    reviewStates,
    grammarProgress,
    writings,
    activities,
    customWords: [],
    customLessons: [],
    customReadingTexts: [],
    customCultureEntries: [],
  };
}
