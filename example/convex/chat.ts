import {
  query,
  mutation,
  httpAction,
  ActionCtx,
  internalQuery,
} from "./_generated/server";
import { api, components } from "./_generated/api";
import {
  PersistentTextStreaming,
  StreamId,
  StreamIdValidator,
} from "@convex-dev/persistent-text-streaming";
import { v } from "convex/values";
import { OpenAI } from "openai";

const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming
);

export const createChat = mutation({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const streamId = await persistentTextStreaming.createStream(ctx);
    const chatId = await ctx.db.insert("chats", {
      title: "...",
      prompt: args.prompt,
      stream: streamId,
    });
    return chatId;
  },
});

export const getChatBody = query({
  args: {
    streamId: StreamIdValidator,
  },
  handler: async (ctx, args) => {
    return await persistentTextStreaming.getStreamBody(
      ctx,
      args.streamId as StreamId
    );
  },
});

export const getChatForStream = internalQuery({
  args: {
    streamId: StreamIdValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chats")
      .withIndex("by_stream", (q) => q.eq("stream", args.streamId))
      .first();
  },
});

type StreamChatRequestBody = {
  streamId: string;
};

async function gptStreamer(
  ctx: ActionCtx,
  request: Request,
  streamId: StreamId,
  chunkAppender: (text: string) => Promise<void>
) {
  let chats = await ctx.runQuery(api.chat.getChats);
  const prompt = chats[chats.length - 1].prompt;
  chats = chats.slice(0, -1);

  // Let's pass along the prior context.
  const context = [];

  const bodies = await Promise.all(
    chats.map(async (chat) => {
      const body = await ctx.runQuery(api.chat.getChatBody, {
        streamId: chat.stream,
      });
      return body;
    })
  );

  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    const chat = chats[i];
    context.push({
      userMessage: chat.prompt,
      assistantMessage: body,
    });
  }

  const openai = new OpenAI();
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that can answer questions and help with tasks.
          Please provide your response in markdown format.
          
          You are continuing a conversation. The conversation so far is found in the following JSON-formatted value:

          ${JSON.stringify(context)}`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: true,
  });

  for await (const part of stream) {
    const text = part.choices[0]?.delta?.content || "";
    await chunkAppender(text);
  }
}

export const streamChat = httpAction(async (ctx, request) => {
  const body = (await request.json()) as StreamChatRequestBody;
  const response = await persistentTextStreaming.stream(
    ctx,
    request,
    body.streamId as StreamId,
    gptStreamer
  );
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");
  return response;
});

export const getChats = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chats").collect();
  },
});

export const clearChat = mutation({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db.query("chats").collect();
    await Promise.all(chats.map((chat) => ctx.db.delete(chat._id)));
  },
});
