import { expect, it } from "vitest";
import { globalSearchFilters, searchTerm } from "./crm-search";
it("requires deliberate bounded input", () => { expect(searchTerm(["a","b"]).q).toBe(""); expect(searchTerm("a").error).toBeTruthy(); expect(searchTerm("x".repeat(121)).error).toBeTruthy(); expect(searchTerm(" 1 ").q).toBe("1"); });
it("normalizes phone formatting only in the search", () => { expect(globalSearchFilters("+54 9 11 2360-4715").customer.OR).toContainEqual({phone:{contains:"5491123604715"}}); });
it("finds orders by number and bounds database integer values", () => { expect(globalSearchFilters("#42").order.OR).toContainEqual({saleNumber:42}); expect(globalSearchFilters("99999999999999").order.OR?.some(v=>"saleNumber" in v)).toBe(false); });
it("searches profile names and never message contents", () => { const f = globalSearchFilters("Walter"); expect(f.customer.OR).toContainEqual({whatsappProfileName:{contains:"Walter",mode:"insensitive"}}); expect(f.conversation).toEqual({customer:f.customer}); });
