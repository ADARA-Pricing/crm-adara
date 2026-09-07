import {beforeEach,describe,it,expect,vi} from "vitest";
const m=vi.hoisted(()=>({auth:vi.fn(),create:vi.fn(),update:vi.fn(),product:vi.fn()}));
vi.mock("@/lib/auth",()=>({requireAdmin:m.auth}));vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));vi.mock("@/lib/prisma",()=>({prisma:{automationRule:{create:m.create,update:m.update},product:{findFirst:m.product}}}));
import {saveRule,toggleRule} from "./actions";
const rule={name:"Seguimiento",stage:"VERY_INTERESTED",category:"",action:"TASK",content:"Llamar al interesado",dueHours:24};
describe("automation rule safety",()=>{
 beforeEach(()=>{vi.resetAllMocks();m.auth.mockResolvedValue({role:"ADMIN"});m.product.mockResolvedValue({id:"p"});});
 it("creates rules disabled regardless of client input",async()=>{expect((await saveRule({...rule,enabled:true})).ok).toBe(true);expect(m.create).toHaveBeenCalledWith({data:expect.objectContaining({enabled:false})});});
 it("pauses edited rules",async()=>{await saveRule({...rule,id:"rule"});expect(m.update).toHaveBeenCalledWith({where:{id:"rule"},data:expect.objectContaining({enabled:false})});});
 it("does not accept autonomous sending actions",async()=>{expect((await saveRule({...rule,action:"SEND_MESSAGE"})).ok).toBe(false);expect(m.create).not.toHaveBeenCalled();});
 it("limits due hours",async()=>{expect((await saveRule({...rule,dueHours:9999})).ok).toBe(false);});
 it("requires admin",async()=>{m.auth.mockRejectedValue(new Error("not admin"));await expect(toggleRule("rule",true)).rejects.toThrow();expect(m.update).not.toHaveBeenCalled();});
 it("rejects categories outside catalog",async()=>{m.product.mockResolvedValue(null);expect((await saveRule({...rule,category:"fake"})).ok).toBe(false);});
});
