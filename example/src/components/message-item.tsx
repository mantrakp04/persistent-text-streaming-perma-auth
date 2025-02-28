import type { Message } from "@/lib/types";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { StreamId } from "@convex-dev/persistent-text-streaming";
import { api } from "../../convex/_generated/api";
import Markdown from "react-markdown";
import { useEffect, useMemo } from "react";

interface MessageItemProps {
  message: Message;
  driven: boolean;
  stopStreaming: () => void;
  scrollToBottom: () => void;
}

export default function MessageItem({
  message,
  driven,
  stopStreaming,
  scrollToBottom,
}: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <>
      {message.role === "user" && (
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <div className="text-sm text-gray-500">
            {message.timestamp.toLocaleDateString()}{" "}
            {message.timestamp.toLocaleTimeString()}
          </div>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      )}

      <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`flex gap-4 max-w-[95%] md:max-w-[85%] ${isUser && "flex-row-reverse"}`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isUser ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"
            } font-medium text-sm`}
          >
            {isUser ? "U" : "AI"}
          </div>

          <div
            className={`rounded-lg px-5 py-4 text-base ${
              isUser
                ? "bg-blue-600 text-white"
                : "bg-gray-100 border border-gray-200 text-gray-900"
            }`}
          >
            {message.content !== undefined ? (
              message.content
            ) : (
              <ServerMessage
                message={message}
                driven={driven}
                stopStreaming={stopStreaming}
                scrollToBottom={scrollToBottom}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ServerMessage({
  message,
  driven,
  stopStreaming,
  scrollToBottom,
}: {
  message: Message;
  driven: boolean;
  stopStreaming: () => void;
  scrollToBottom: () => void;
}) {
  const convexSiteUrl = import.meta.env.VITE_CONVEX_URL.replace(
    /\.cloud$/,
    ".site"
  );

  const { text, status } = useStream(
    api.chat.getChatBody,
    new URL(`${convexSiteUrl}/chat-stream`),
    driven,
    message.streamId as StreamId
  );

  const isCurrentlyStreaming = useMemo(() => {
    return driven && (status === "pending" || status === "streaming");
  }, [driven, status]);

  useEffect(() => {
    if (driven && !isCurrentlyStreaming) {
      stopStreaming();
    }
  }, [driven, isCurrentlyStreaming, stopStreaming]);

  useEffect(() => {
    if (text) {
      scrollToBottom();
    }
  }, [text, scrollToBottom]);

  return (
    <div className="md-answer">
      <Markdown>{text || "Thinking..."}</Markdown>
      {status === "error" && (
        <div className="text-red-500 mt-2">Error loading response</div>
      )}
    </div>
  );
}
