import { expect, it } from "vitest";
import { funnelViewFilter } from "./crm-funnel-filters";
it("combines view filters without changing stages", () => { expect(funnelViewFilter({category:"Celulares",owner:"mine",method:"PICKUP",viewStage:"LOCAL_PICKUP"},"user").where).toEqual({interestCategories:{has:"Celulares"},assigneeId:"user",deliveryPreference:"PICKUP",funnelStage:"LOCAL_PICKUP"}); });
it("uses the last known message, not contact update time", () => { expect(funnelViewFilter({age:"7"},"user",new Date("2026-09-08T12:00:00Z")).where.lastMessageAt).toEqual({lt:new Date("2026-09-01T12:00:00Z")}); });
it("does not classify missing timestamps as old activity", () => { expect(funnelViewFilter({age:"unknown",method:"unknown"},"user").where).toMatchObject({lastMessageAt:null,deliveryPreference:null}); });
it("ignores invalid and repeated values", () => { const f = funnelViewFilter({age:"-1",viewStage:"INVALID",q:["a","b"]},"user"); expect(f.q).toBe(""); expect(f.age).toBeUndefined(); expect(f.stage).toBeUndefined(); });
it("queries active and closed groups separately before pagination", () => {
  expect(funnelViewFilter({viewGroup:"closed"},"user").where.funnelStage).toEqual({in:["COMPLETED","ABANDONED"]});
  expect(funnelViewFilter({},"user").where.funnelStage).toEqual({in:["FIRST_CONTACT","INTERESTED","VERY_INTERESTED","COORDINATE_DELIVERY","LOCAL_PICKUP"]});
  expect(funnelViewFilter({viewGroup:"closed",viewStage:"LOCAL_PICKUP"},"user").where.funnelStage).toBe("LOCAL_PICKUP");
});
it("bounds and validates page numbers", () => {
  for (const page of ["0","-1","1.5","invalid","100001"]) expect(funnelViewFilter({page},"user").page).toBe(1);
  expect(funnelViewFilter({page:"2"},"user").page).toBe(2);
});
