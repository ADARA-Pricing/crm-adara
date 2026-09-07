import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
import { getBotAnalytics } from "./bot-analytics-server";

describe("Botpress analytics connection", () => {
  beforeEach(() => {
    vi.stubEnv("BOTPRESS_API_TOKEN", "test-token");
    vi.stubEnv("BOTPRESS_BOT_ID", "test-bot");
    vi.stubEnv("BOTPRESS_WORKSPACE_ID", "test-workspace");
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it("uses a read-only admin request and records sync time", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ records: [] }) });
    vi.stubGlobal("fetch", fetcher);
    expect(await getBotAnalytics("2026-09-01T00:00:00.000Z", "2026-09-07T23:59:59.999Z")).toMatchObject({ records: [], syncedAt: expect.any(String) });
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/v1/admin/bots/test-bot/analytics?"), expect.objectContaining({ headers: { Authorization: "Bearer test-token", "x-workspace-id": "test-workspace" }, cache: "no-store" }));
    expect(new URL(fetcher.mock.calls[0][0]).searchParams.get("endDate")).toBe("2026-09-08T00:00:00.000Z");
  });
  it("does not leak upstream errors or credentials", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "secret" }));
    const result = await getBotAnalytics("2026-09-05T00:00:00.000Z", "2026-09-05T23:59:59.999Z");
    expect(result).toHaveProperty("error");
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(result).not.toHaveProperty("records");
  });
  it("rejects malformed payload rather than displaying zeros", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ invalid: true }) }));
    expect(await getBotAnalytics("2026-09-05T00:00:00.000Z", "2026-09-05T23:59:59.999Z")).toHaveProperty("error");
  });
  it("requires configuration before making any request", async () => {
    vi.stubEnv("BOTPRESS_API_TOKEN", "");
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect(await getBotAnalytics("a", "b")).toHaveProperty("error");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("supports a single day without counting a bucket from the next day", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ records: [
      { startDateTimeUtc: "2026-09-05T23:00:00.000Z", endDateTimeUtc: "2026-09-06T00:00:00.000Z", userMessages: 2 },
      { startDateTimeUtc: "2026-09-06T00:00:00.000Z", endDateTimeUtc: "2026-09-06T01:00:00.000Z", userMessages: 9 },
    ] }) }));
    const result = await getBotAnalytics("2026-09-05T00:00:00.000Z", "2026-09-05T23:59:59.999Z");
    expect("records" in result && result.records).toHaveLength(1);
  });
});
