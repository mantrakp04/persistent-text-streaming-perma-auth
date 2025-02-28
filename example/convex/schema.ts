import { defineSchema, defineTable } from "convex/server";
import { StreamIdValidator } from "@convex-dev/persistent-text-streaming";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
    title: v.string(),
    prompt: v.string(),
    stream: StreamIdValidator,
  }).index("by_stream", ["stream"]),
});
