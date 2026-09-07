import {describe,it,expect} from "vitest";
import {replyWindow,needsReply,messageActivity} from "./conversation-activity";
import {inboxWhere} from "./inbox-filters";
const now=Date.parse("2026-09-07T15:00:00Z");
describe("WhatsApp window and filters",()=>{
 it("opens only from incoming messages",()=>expect(replyWindow({lastIncomingAt:null,lastOutgoingAt:new Date(now)} ,now).state).toBe("unknown"));
 it("expires at the exact 24 hour boundary",()=>expect(replyWindow({lastIncomingAt:new Date(now-86400000),lastOutgoingAt:null},now).state).toBe("closed"));
 it("does not extend when the bot responds",()=>expect(replyWindow({lastIncomingAt:new Date(now-90000000),lastOutgoingAt:new Date(now)},now).state).toBe("closed"));
 it("shows remaining availability",()=>expect(replyWindow({lastIncomingAt:new Date(now-3600000),lastOutgoingAt:null},now).label).toBe("Disponible · 23 h 0 min"));
 it("treats missing or future dates as unknown",()=>expect(replyWindow({lastIncomingAt:new Date(now+1),lastOutgoingAt:null},now).state).toBe("unknown"));
 it("does not apply whatsapp windows to webchat",()=>expect(replyWindow({lastIncomingAt:null,lastOutgoingAt:null,channel:"webchat"},now).state).toBe("other"));
 it("separates response pending from merely unread",()=>{expect(needsReply({lastIncomingAt:new Date(now),lastOutgoingAt:null})).toBe(true);expect(needsReply({lastIncomingAt:new Date(now-1),lastOutgoingAt:new Date(now)})).toBe(false);});
 it("ignores invalid and future messages",()=>expect(messageActivity([{direction:"incoming",createdAt:"invalid"},{direction:"incoming",createdAt:new Date(now+1).toISOString()}],now).lastIncomingAt).toBeNull());
 it("uses latest timestamp regardless of order",()=>expect(messageActivity([{direction:"incoming",createdAt:new Date(now).toISOString()},{direction:"incoming",createdAt:new Date(now-1).toISOString()}],now).lastIncomingAt?.getTime()).toBe(now));
 it("combines owner category stage and open window",()=>{const {where}=inboxWhere({owner:"mine",category:"Celulares",stage:"VERY_INTERESTED",window:"open"},"operator",new Date(now));expect(where.customer).toMatchObject({assigneeId:"operator",interestCategories:{has:"Celulares"},funnelStage:"VERY_INTERESTED"});expect(where.lastIncomingAt).toEqual({gt:new Date(now-86400000),lte:new Date(now)});});
 it("treats unknown separately from expired",()=>expect(inboxWhere({window:"unknown",owner:"none"},"operator",new Date(now)).where).toMatchObject({lastIncomingAt:null,customer:{assigneeId:null}}));
 it("rejects invalid stage filters safely",()=>expect(inboxWhere({stage:"INVALID",page:"-5"},"u").filters).toMatchObject({stage:"",page:1}));
 it("defines purchases as delivered or collected orders",()=>expect(inboxWhere({bought:"yes"},"u").where.customer).toMatchObject({orders:{some:{status:"DELIVERED"}}}));
});
