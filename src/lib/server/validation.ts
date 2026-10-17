import { z } from "zod";

const namePattern = /^[\p{L}\p{M}\p{Zs}'’.-]+$/u;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "名字至少需要 2 个字符。")
    .max(32, "名字不能超过 32 个字符。")
    .regex(namePattern, "名字只能包含文字、空格、撇号或连字符。"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("请输入有效的邮箱地址。")
    .max(254, "邮箱地址过长。"),
  password: z
    .string()
    .min(8, "密码至少需要 8 个字符。")
    .max(128, "密码不能超过 128 个字符。"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("请输入有效的邮箱地址。"),
  password: z.string().min(1, "请输入密码。").max(128, "密码过长。"),
});

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "输入内容有误，请检查后重试。";
}
