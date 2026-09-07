import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireCrmUser: m.auth }));
vi.mock("@/lib/lead-detail", () => ({ readLeadDetail: m.read }));
import { GET } from "./route";
const request = new Request("https://crm.example/api/leads/lead/detail");
const context = { params: Promise.resolve({ id: "lead" }) };
describe("isolated lead detail", () => {
  beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ id: "operator", role: "SALES", email: "private@example.test" }); m.read.mockResolvedValue({ customer: { id: "lead" }, members: [] }); });
  it("authenticates before reading customer data", async () => {
    m.auth.mockRejectedValue(new Error("redirect-login"));
    await expect(GET(request, context)).rejects.toThrow("redirect-login");
    expect(m.read).not.toHaveBeenCalled();
  });
  it("returns only the requested lead without HTTP caching", async () => {
    const response = await GET(request, context);
    expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(m.read).toHaveBeenCalledWith("lead");
    expect(await response.json()).toEqual({ customer: { id: "lead" }, members: [], user: { id: "operator", role: "SALES" } });
  });
  it("does not substitute another customer when the lead is deleted", async () => {
    m.read.mockResolvedValue(null); expect((await GET(request, context)).status).toBe(404);
  });
  it("sanitizes database errors", async () => {
    m.read.mockRejectedValue(new Error("database-secret")); const response = await GET(request, context);
    expect(response.status).toBe(503); expect(await response.text()).not.toContain("database-secret");
  });
  it("rejects invalid identifiers before querying", async () => {
    expect((await GET(request, { params: Promise.resolve({ id: "x".repeat(161) }) })).status).toBe(400);
    expect(m.read).not.toHaveBeenCalled();
  });
});
