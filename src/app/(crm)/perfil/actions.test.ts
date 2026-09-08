import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireCrmUser: m.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { userProfile: { update: m.update } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveProfile } from "./actions";
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ id: "me" }); });
it("edits only the signed-in profile without changing permissions", async () => {
  await saveProfile({ id: "other", role: "ADMIN", displayName: "Sebastián", avatarColor: "green" });
  expect(m.update).toHaveBeenCalledWith({ where: { id: "me" }, data: { displayName: "Sebastián", avatarColor: "green" } });
});
it("requires a session", async () => { m.auth.mockRejectedValue(new Error("auth")); await expect(saveProfile({})).rejects.toThrow(); expect(m.update).not.toHaveBeenCalled(); });
it("does not save invalid input", async () => { expect((await saveProfile({ displayName: "", avatarColor: "unknown" })).ok).toBe(false); expect(m.update).not.toHaveBeenCalled(); });
it("does not leak database errors", async () => { m.update.mockRejectedValue(new Error("private")); const result = await saveProfile({ displayName: "Seba", avatarColor: "green" }); expect(result.ok).toBe(false); expect(result.message).not.toContain("private"); });
