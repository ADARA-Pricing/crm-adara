import { afterEach, beforeEach, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ getUser: vi.fn(), findUnique: vi.fn(), create: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: m.getUser } }) }));
vi.mock("@/lib/prisma", () => ({ prisma: { userProfile: { findUnique: m.findUnique, create: m.create } } }));
import { requireAdmin, requireCrmUser } from "./auth";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRM_ADMIN_EMAIL", "admin@example.test");
  m.getUser.mockResolvedValue({ data: { user: { id: "operator", email: "operator@example.test", user_metadata: { role: "ADMIN" } } } });
  m.findUnique.mockResolvedValue({ id: "operator", role: "SALES", isActive: true });
});
afterEach(() => vi.unstubAllEnvs());

it("rejects missing sessions before querying profiles", async () => {
  m.getUser.mockResolvedValue({ data: { user: null } });
  await expect(requireCrmUser()).rejects.toThrow("redirect:/login");
  expect(m.findUnique).not.toHaveBeenCalled();
  expect(m.create).not.toHaveBeenCalled();
});
it("rejects an unregistered user without trusting metadata roles", async () => {
  m.findUnique.mockResolvedValue(null);
  await expect(requireCrmUser()).rejects.toThrow("redirect:/login?denied=1");
  expect(m.create).not.toHaveBeenCalled();
});
it("rejects inactive profiles even for the configured administrator", async () => {
  m.getUser.mockResolvedValue({ data: { user: { id: "admin", email: "admin@example.test" } } });
  m.findUnique.mockResolvedValue({ id: "admin", role: "ADMIN", isActive: false });
  await expect(requireCrmUser()).rejects.toThrow("redirect:/login?denied=1");
  expect(m.create).not.toHaveBeenCalled();
});
it.each(["SALES", "LOGISTICS"])("does not allow %s into administrator operations", async role => {
  m.findUnique.mockResolvedValue({ id: "operator", role, isActive: true });
  await expect(requireAdmin()).rejects.toThrow("redirect:/");
});
it("allows an active database administrator", async () => {
  const profile = { id: "operator", role: "ADMIN", isActive: true };
  m.findUnique.mockResolvedValue(profile);
  await expect(requireAdmin()).resolves.toEqual(profile);
});
it("bootstraps only the explicitly configured administrator", async () => {
  m.getUser.mockResolvedValue({ data: { user: { id: "admin", email: "ADMIN@example.test" } } });
  m.findUnique.mockResolvedValue(null);
  m.create.mockResolvedValue({ id: "admin", role: "ADMIN", isActive: true });
  await expect(requireAdmin()).resolves.toMatchObject({ role: "ADMIN" });
  expect(m.create).toHaveBeenCalledWith({ data: { id: "admin", email: "admin@example.test", displayName: null, role: "ADMIN" } });
});
