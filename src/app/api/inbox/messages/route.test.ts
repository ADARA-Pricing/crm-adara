import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const read = vi.hoisted(() => vi.fn());
vi.mock("@/app/bandeja/chat-actions",()=>({readConversation:read}));
import { GET } from "./route";
beforeEach(()=>vi.resetAllMocks());
it("uses the authenticated reader and forbids caching",async()=>{
  read.mockResolvedValue({ok:true,messages:[]});
  const response=await GET(new NextRequest("https://crm.example.test/api/inbox/messages?id=chat&cursor=older"));
  expect(read).toHaveBeenCalledWith("chat","older");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
});
it("rejects missing identifiers without accessing data",async()=>{
  expect((await GET(new NextRequest("https://crm.example.test/api/inbox/messages"))).status).toBe(400);
  expect(read).not.toHaveBeenCalled();
});
it("does not bypass an authentication failure",async()=>{
  read.mockRejectedValue(new Error("unauthorized"));
  await expect(GET(new NextRequest("https://crm.example.test/api/inbox/messages?id=chat"))).rejects.toThrow("unauthorized");
});
