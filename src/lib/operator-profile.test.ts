import { expect, it } from "vitest";
import { operatorInitials, profileInput } from "./operator-profile";
it("validates visible names and known avatar colors", () => { expect(profileInput.parse({ displayName: " Seba ", avatarColor: "green", role: "ADMIN" })).toEqual({ displayName: "Seba", avatarColor: "green" }); });
it("rejects blank names and arbitrary avatar values", () => { expect(profileInput.safeParse({ displayName: " ", avatarColor: "green" }).success).toBe(false); expect(profileInput.safeParse({ displayName: "Seba", avatarColor: "url" }).success).toBe(false); });
it("creates readable initials", () => { expect(operatorInitials(" Sebastián Puccio ")).toBe("SP"); expect(operatorInitials("")).toBe("?"); });
