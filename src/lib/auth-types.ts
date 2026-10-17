export type UserRole = "learner" | "admin";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};
