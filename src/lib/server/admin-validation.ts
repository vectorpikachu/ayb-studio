import { z } from "zod";

const idSchema = z
  .string()
  .trim()
  .min(2, "ID 至少需要 2 个字符。")
  .max(80, "ID 不能超过 80 个字符。")
  .regex(/^[a-z0-9][a-z0-9-]*$/, "ID 只能包含小写字母、数字和连字符。");

const shortText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().max(max).optional();

const exampleSchema = z.object({
  hy: shortText(500),
  translit: shortText(500),
  en: shortText(800),
  zh: shortText(800),
});

const wordSchema = z.object({
  id: idSchema,
  hy: shortText(120),
  translit: shortText(160),
  pos: z.enum([
    "noun",
    "verb",
    "adjective",
    "adverb",
    "phrase",
    "pronoun",
    "interjection",
    "numeral",
    "particle",
  ]),
  level: z.enum(["A1", "A2", "B1"]),
  category: z.enum([
    "essentials",
    "people",
    "food",
    "nature",
    "places",
    "body",
    "time",
    "description",
    "actions",
    "culture",
  ]),
  en: shortText(400),
  ru: shortText(400),
  zh: shortText(400),
  example: exampleSchema,
  note: optionalText(1200),
});

export const wordsUploadSchema = z
  .union([
    z.array(wordSchema).min(1).max(500),
    z.object({ words: z.array(wordSchema).min(1).max(500) }),
  ])
  .transform((payload) => (Array.isArray(payload) ? payload : payload.words))
  .superRefine((words, ctx) => {
    const ids = new Set<string>();
    for (const word of words) {
      if (ids.has(word.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `词条 ID 重复：${word.id}` });
      }
      ids.add(word.id);
    }
  });

const grammarExampleSchema = z.object({
  hy: shortText(1000),
  translit: shortText(1000),
  zh: shortText(2000),
  note: optionalText(2000),
});

const grammarLetterSchema = z.object({
  upper: shortText(8),
  lower: shortText(8),
  name: shortText(40),
  sound: shortText(40),
});

const tableBlockSchema = z.object({
  type: z.literal("table"),
  caption: optionalText(300),
  headers: z.array(shortText(200)).min(1).max(8),
  rows: z.array(z.array(z.string().max(2000)).min(1).max(8)).min(1).max(80),
});

const blockSchema = z.union([
  z.object({
    type: z.literal("paragraph"),
    text: shortText(6000),
  }),
  z.object({
    type: z.literal("note"),
    title: optionalText(200),
    text: shortText(4000),
  }),
  z.object({
    type: z.literal("examples"),
    items: z.array(grammarExampleSchema).min(1).max(30),
  }),
  tableBlockSchema,
  z.object({
    type: z.literal("list"),
    ordered: z.boolean().optional(),
    items: z.array(shortText(2000)).min(1).max(50),
  }),
  z.object({
    type: z.literal("letters"),
    items: z.array(grammarLetterSchema).min(1).max(100),
  }),
]);

const sectionSchema = z.object({
  id: idSchema,
  title: shortText(200),
  blocks: z.array(blockSchema).min(1).max(30),
});

const quizQuestionSchema = z.object({
  id: idSchema,
  question: shortText(1000),
  options: z.array(shortText(1000)).min(2).max(6),
  answer: z.number().int().min(0).max(5),
  explanation: shortText(2000),
});

const lessonSchema = z
  .object({
    id: idSchema,
    order: z.number().int().min(1).max(999),
    level: z.enum(["A1", "A2", "B1", "B2"]),
    minutes: z.number().int().min(1).max(180),
    title: shortText(200),
    titleHy: shortText(200),
    subtitle: shortText(300),
    description: shortText(1000),
    intro: shortText(6000),
    sections: z.array(sectionSchema).min(1).max(20),
    takeaways: z.array(shortText(500)).min(1).max(8),
    quiz: z.array(quizQuestionSchema).min(1).max(10),
  })
  .superRefine((lesson, ctx) => {
    const sectionIds = new Set<string>();
    for (const section of lesson.sections) {
      if (sectionIds.has(section.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `课程「${lesson.id}」中的小节 ID 重复：${section.id}`,
        });
      }
      sectionIds.add(section.id);

      for (const block of section.blocks) {
        if (block.type !== "table") continue;
        for (const [rowIndex, row] of block.rows.entries()) {
          if (row.length !== block.headers.length) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `课程「${lesson.id}」的表格第 ${rowIndex + 1} 行列数与表头不一致。`,
            });
            break;
          }
        }
      }
    }

    for (const question of lesson.quiz) {
      if (question.answer >= question.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `课程「${lesson.id}」中题目 ${question.id} 的正确答案索引超出选项范围。`,
        });
      }
    }
  });

export const lessonsUploadSchema = z
  .union([
    z.array(lessonSchema).min(1).max(50),
    z.object({ lessons: z.array(lessonSchema).min(1).max(50) }),
  ])
  .transform((payload) => (Array.isArray(payload) ? payload : payload.lessons))
  .superRefine((lessons, ctx) => {
    const ids = new Set<string>();
    for (const lesson of lessons) {
      if (ids.has(lesson.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `课程 ID 重复：${lesson.id}` });
      }
      ids.add(lesson.id);
    }
  });

export type UploadWord = z.infer<typeof wordSchema>;
export type UploadLesson = z.infer<typeof lessonSchema>;

const readingParagraphSchema = z.object({
  hy: shortText(4000),
  zh: shortText(4000),
  modernHy: optionalText(4000),
  note: optionalText(2000),
});

const readingWordSchema = z.object({
  hy: shortText(160),
  translit: shortText(160),
  zh: shortText(800),
  note: optionalText(1200),
});

const readingGrammarPointSchema = z.object({
  title: shortText(300),
  explanation: shortText(4000),
  examples: z
    .array(
      z.object({
        hy: shortText(1000),
        zh: shortText(2000),
        note: optionalText(2000),
      }),
    )
    .min(1)
    .max(20),
});

const readingTextSchema = z.object({
  id: idSchema,
  order: z.number().int().min(1).max(999),
  level: z.enum(["A1", "A2", "B1", "B2"]),
  minutes: z.number().int().min(1).max(180),
  title: shortText(300),
  titleLines: z.array(shortText(300)).min(1).max(4).optional(),
  titleHy: shortText(300),
  subtitle: shortText(400),
  description: shortText(4000),
  author: optionalText(300),
  authorHy: optionalText(300),
  year: optionalText(40),
  kind: z.enum(["original", "excerpt", "poem"]).optional(),
  source: optionalText(500),
  sourceUrl: optionalText(1000),
  paragraphs: z.array(readingParagraphSchema).min(1).max(40),
  vocabulary: z.array(readingWordSchema).min(1).max(200),
  grammarPoints: z.array(readingGrammarPointSchema).min(1).max(40),
  takeaways: z.array(shortText(1000)).min(1).max(12),
});

export const readingUploadSchema = z
  .union([
    z.array(readingTextSchema).min(1).max(50),
    z.object({ texts: z.array(readingTextSchema).min(1).max(50) }),
  ])
  .transform((payload) => (Array.isArray(payload) ? payload : payload.texts))
  .superRefine((texts, ctx) => {
    const ids = new Set<string>();
    for (const text of texts) {
      if (ids.has(text.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `课文 ID 重复：${text.id}` });
      }
      ids.add(text.id);
    }
  });

const cultureSectionSchema = z.object({
  id: idSchema,
  heading: shortText(300),
  paragraphs: z.array(shortText(6000)).min(1).max(20),
});

const cultureEntrySchema = z.object({
  id: idSchema,
  order: z.number().int().min(1).max(999),
  category: z.enum(["history", "culture", "people", "geography"]),
  title: shortText(300),
  titleHy: shortText(300),
  subtitle: shortText(400),
  summary: shortText(4000),
  sections: z.array(cultureSectionSchema).min(1).max(30),
  facts: z
    .array(
      z.object({
        label: shortText(200),
        value: shortText(500),
      }),
    )
    .max(10)
    .optional(),
  related: z
    .array(
      z.object({
        href: z.string().trim().regex(/^\/(?!\/)/, "关联链接必须是站内路径。"),
        label: shortText(200),
      }),
    )
    .max(10)
    .optional(),
});

export const cultureUploadSchema = z
  .union([
    z.array(cultureEntrySchema).min(1).max(100),
    z.object({ entries: z.array(cultureEntrySchema).min(1).max(100) }),
  ])
  .transform((payload) => (Array.isArray(payload) ? payload : payload.entries))
  .superRefine((entries, ctx) => {
    const ids = new Set<string>();
    for (const entry of entries) {
      if (ids.has(entry.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `文化条目 ID 重复：${entry.id}` });
      }
      ids.add(entry.id);
    }
  });

export type UploadReadingText = z.infer<typeof readingTextSchema>;
export type UploadCultureEntry = z.infer<typeof cultureEntrySchema>;

export function formatValidationErrors(error: z.ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "内容";
      return `${path}: ${issue.message}`;
    })
    .join("；");
}
