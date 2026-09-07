import {beforeEach,describe,it,expect,vi} from "vitest";
const m=vi.hoisted(()=>({auth:vi.fn(),member:vi.fn(),customer:vi.fn(),task:vi.fn(),conversation:vi.fn(),event:vi.fn()}));
vi.mock("@/lib/auth",()=>({requireCrmUser:m.auth}));vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/prisma",()=>({prisma:{$transaction:(f:Function)=>f({userProfile:{findFirst:m.member},customer:{updateMany:m.customer},task:{updateMany:m.task},conversation:{findFirst:m.conversation},conversationEvent:{create:m.event}})}}));
import {assignLead,updateLeadTask} from "./team-actions";
describe("team responsibility",()=>{
 beforeEach(()=>{vi.resetAllMocks();m.auth.mockResolvedValue({id:"u",email:"a@b.test"});m.member.mockResolvedValue({id:"member"});m.customer.mockResolvedValue({count:1});m.task.mockResolvedValue({count:1});m.conversation.mockResolvedValue({id:"chat"});});
 it("requires a session",async()=>{m.auth.mockRejectedValue(new Error("auth"));await expect(assignLead({id:"lead",assigneeId:"member",expected:null})).rejects.toThrow();expect(m.customer).not.toHaveBeenCalled();});
 it("assigns active members with an audit",async()=>{expect((await assignLead({id:"lead",assigneeId:"member",expected:null})).ok).toBe(true);expect(m.customer).toHaveBeenCalledWith({where:{id:"lead",assigneeId:null},data:{assigneeId:"member"}});expect(m.event).toHaveBeenCalled();});
 it("rejects inactive members",async()=>{m.member.mockResolvedValue(null);expect((await assignLead({id:"lead",assigneeId:"member",expected:null})).ok).toBe(false);expect(m.customer).not.toHaveBeenCalled();});
 it("does not overwrite a concurrent assignment",async()=>{m.customer.mockResolvedValue({count:0});expect((await assignLead({id:"lead",assigneeId:"member",expected:null})).ok).toBe(false);expect(m.event).not.toHaveBeenCalled();});
 it("unassigns without requiring a target member",async()=>{expect((await assignLead({id:"lead",assigneeId:"",expected:"member"})).ok).toBe(true);expect(m.member).not.toHaveBeenCalled();});
 it("validates task status before writing",async()=>{expect((await updateLeadTask({id:"t",customerId:"c",assigneeId:"",status:"INVALID",dueAt:"",expected:new Date().toISOString()})).ok).toBe(false);expect(m.task).not.toHaveBeenCalled();});
 it("updates only the task of this lead with an optimistic version",async()=>{expect((await updateLeadTask({id:"t",customerId:"c",assigneeId:"member",status:"DONE",dueAt:"",expected:"2026-09-07T00:00:00.000Z"})).ok).toBe(true);expect(m.task).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({id:"t",customerId:"c",updatedAt:expect.any(Object)}),data:expect.objectContaining({status:"DONE",completedAt:expect.any(Date)})}));});
});
