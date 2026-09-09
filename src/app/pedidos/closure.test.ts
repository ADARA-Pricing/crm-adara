import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), initial: vi.fn(), tx: vi.fn(), lock: vi.fn(), find: vi.fn(), update: vi.fn(), count: vi.fn(), customer: vi.fn(), tasks: vi.fn(), activity: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireCrmUser: m.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findUnique: m.initial }, $transaction: m.tx } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { updateOrderStatus } from "./actions";
import { orderActions, orderStatusLabel } from "@/lib/order-status";

beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({id:"operator",role:"SALES",email:"sales@example.test"});
  m.initial.mockResolvedValue({customerId:"customer"});
  m.find.mockResolvedValue({id:"order",customerId:"customer",saleNumber:4,status:"SHIPPED",deliveryMethod:"COURIER"});
  m.update.mockResolvedValue({count:1}); m.count.mockResolvedValue(0);
  m.tx.mockImplementation(fn=>fn({$queryRaw:m.lock,order:{findUnique:m.find,updateMany:m.update,count:m.count},customer:{update:m.customer},task:{updateMany:m.tasks},orderActivity:{create:m.activity}}));
});
it("separates pickup and courier preparation",()=>{
  expect(orderActions("PREPARING","PICKUP")[0].status).toBe("READY_FOR_PICKUP");
  expect(orderActions("PREPARING","COURIER")[0].status).toBe("SHIPPED");
  expect(orderActions("READY_FOR_PICKUP","COURIER")).toEqual([]);
  expect(orderStatusLabel("DELIVERED","PICKUP")).toBe("Retirado");
});
it("rejects closing before explicit confirmation",async()=>{
  await expect(updateOrderStatus("order","DELIVERED")).rejects.toThrow("Confirmá");
  expect(m.tx).not.toHaveBeenCalled();
});
it("requires a cancellation reason",async()=>{
  await expect(updateOrderStatus("order","CANCELLED",true)).rejects.toThrow("Indicá un motivo");
  expect(m.tx).not.toHaveBeenCalled();
});
it("closes delivery, customer, funnel and order tasks together",async()=>{
  await updateOrderStatus("order","DELIVERED",true);
  expect(m.update).toHaveBeenCalledWith(expect.objectContaining({data:{status:"DELIVERED",deliveredAt:expect.any(Date)}}));
  expect(m.customer).toHaveBeenCalledWith({where:{id:"customer"},data:expect.objectContaining({status:"ACTIVE",funnelStage:"COMPLETED"})});
  expect(m.tasks).toHaveBeenCalledOnce(); expect(m.activity).toHaveBeenCalledOnce();
});
it("preserves the funnel if other orders remain open",async()=>{
  m.count.mockResolvedValue(1);
  await updateOrderStatus("order","DELIVERED",true);
  expect(m.customer).toHaveBeenCalledWith({where:{id:"customer"},data:{status:"ACTIVE"}});
});
it("closes pickup only after ready for pickup",async()=>{
  m.find.mockResolvedValue({id:"order",customerId:"customer",saleNumber:4,status:"READY_FOR_PICKUP",deliveryMethod:"PICKUP"});
  await updateOrderStatus("order","DELIVERED",true);
  expect(m.customer).toHaveBeenCalledOnce();
});
it("rejects marking a pickup as shipped",async()=>{
  m.find.mockResolvedValue({status:"PREPARING",deliveryMethod:"PICKUP"});
  await expect(updateOrderStatus("order","SHIPPED")).rejects.toThrow(); expect(m.update).not.toHaveBeenCalled();
});
it("requires regularizing legacy shipped pickup before closing",async()=>{
  expect(orderActions("SHIPPED","PICKUP")[0].status).toBe("READY_FOR_PICKUP");
});
it("preparation does not complete the customer or tasks",async()=>{
  m.find.mockResolvedValue({id:"order",status:"APPROVED_FOR_LOGISTICS",deliveryMethod:"COURIER"});
  await updateOrderStatus("order","PREPARING");
  expect(m.customer).not.toHaveBeenCalled(); expect(m.tasks).not.toHaveBeenCalled();
});
it("rejects duplicate closure without repeating customer updates",async()=>{
  m.find.mockResolvedValue({status:"DELIVERED",deliveryMethod:"COURIER"});
  await expect(updateOrderStatus("order","DELIVERED",true)).rejects.toThrow(); expect(m.customer).not.toHaveBeenCalled();
});
it("rejects a concurrent state change",async()=>{
  m.update.mockResolvedValue({count:0});
  await expect(updateOrderStatus("order","DELIVERED",true)).rejects.toThrow(); expect(m.customer).not.toHaveBeenCalled();
});
it("requires authentication",async()=>{
  m.auth.mockRejectedValue(new Error("unauthorized"));
  await expect(updateOrderStatus("order","DELIVERED",true)).rejects.toThrow("unauthorized"); expect(m.tx).not.toHaveBeenCalled();
});
