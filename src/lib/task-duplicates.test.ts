import { expect, it } from "vitest";
import { duplicateWindowHours, possibleTaskDuplicates } from "./task-duplicates";
const task = {id:"a",title:"Revisar cobertura",type:"FOLLOW_UP",status:"OPEN",customerId:"client",orderId:null,createdAt:new Date("2026-09-08T12:00:00Z")};
it("flags simultaneous similar tasks without mutating them",()=>{
  const tasks=[task,{...task,id:"b",title:" REVISAR  cobertura "}];
  expect(possibleTaskDuplicates(tasks,24).get("a")).toEqual(["b"]);
  expect(tasks[1].title).toBe(" REVISAR  cobertura ");
});
it("does not group different customers, orders, types or reasons",()=>{
  for(const change of [{customerId:"other"},{orderId:"order"},{type:"LOGISTICS"},{title:"Confirmar entrega"}]) expect(possibleTaskDuplicates([task,{...task,id:"b",...change}],24).size).toBe(0);
});
it("excludes closed, unlinked and out of window records",()=>{
  expect(possibleTaskDuplicates([task,{...task,id:"b",status:"DONE"}],24).size).toBe(0);
  expect(possibleTaskDuplicates([task,{...task,id:"b",createdAt:new Date("2026-09-10T12:00:00Z")}],24).size).toBe(0);
  expect(possibleTaskDuplicates([{...task,customerId:null},{...task,id:"b",customerId:null}],24).size).toBe(0);
});
it("validates the configurable suggestion window",()=>{expect(duplicateWindowHours("48")).toBe(48);for(const v of [undefined,"0","bad","721"])expect(duplicateWindowHours(v)).toBe(24);});
