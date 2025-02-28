# Convex Component: Persistent Text Streaming

[![npm version](https://badge.fury.io/js/@convex-dev%2Fpersistent-text-streaming.svg)](https://badge.fury.io/js/@convex-dev%2Fpersistent-text-streaming)

<!-- START: Include on https://convex.dev/components -->

This Convex component provides persistent text streaming to the client.
Specifically, it provides a React hook that can be used to stream text to the
client from an HTTP action. The text is persistent because--in addition to being
streamed immediately back to the original client--it is stored in the database,
so it can be accessed by the client even after the stream has finished, or by
other users, etc.

The most common use case is for AI chat applications. The example app (found in the
`example` directory) is a just such a simple chat app that demonstrates use of the
component.

Here's what you'll end up with! The left window is streaming the chat body to the client,
and the right window is subscribed to the chat body via a database query. Refreshing
the page will always reload the persisted chat history from the database:

(TDB GIF)

## Pre-requisite: Convex

You'll need an existing Convex project to use the component.
Convex is a hosted backend platform, including a database, serverless functions,
and a ton more you can learn about [here](https://docs.convex.dev/get-started).

Run `npm create convex` or follow any of the [quickstarts](https://docs.convex.dev/home) to set one up.

## Installation

See [`example/`](./example/convex/) for a working demo.

1. Install the Persistent Text Streaming component:

```bash
npm install @convex-dev/persistent-text-streaming
```

2. Create a [`convex.config.ts`](./example/convex/convex.config.ts) file in your
   app's `convex/` folder and install the component by calling `use`:

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config";

const app = defineApp();
app.use(persistentTextStreaming);
export default app;
```

## Usage

Here's a simple example of how to use the component:

In `convex/chat.ts`:

```ts
const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming
);

// Create a stream using the component and store the id in the database with
// our chat message.
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

// Create a query that returns the chat body.
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

// Create an HTTP action that generates chunks of the chat body
// and uses the component to stream them to the client and save them to the database.
export const streamChat = httpAction(async (ctx, request) => {
  const generateChat = async (ctx, request, streamId, chunkAppender) => {
    await chunkAppender("Hi there!");
    await chunkAppender("How are you?");
    await chunkAppender("Pretend I'm an AI or something!");
  };

  const response = await persistentTextStreaming.stream(
    ctx,
    request,
    body.streamId as StreamId,
    generateChat
  );

  // Set CORS headers appropriately.
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");
  return response;
});
```

You need to expose this HTTP endpoint in your app, `http.ts`:

```ts
http.route({
  path: "/chat-stream",
  method: "POST",
  handler: streamChat,
});
```

Finally, in your app, you can now create chats and them subscribe to them
via stream and/or database query as optimal:

```ts
// chat-input.tsx, maybe?
const createChat = useMutation(api.chat.createChat);
const formSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const chatId = await createChat({
    prompt: inputValue,
  });
};

// chat-message.tsx, maybe?
import { useStream } from "@convex-dev/persistent-text-streaming";
// ...
// In our component:
const { text, status } = useStream(
  api.chat.getChatBody, // The query to call for the full stream body
  new URL(`${convexSiteUrl}/chat-stream`), // The HTTP endpoint for streaming
  driven, // Set to true if this browser session created this chat and so should generate the stream
  message.streamId as StreamId // The streamId of the chat to subscribe to!
);
```

<!-- END: Include on https://convex.dev/components -->
