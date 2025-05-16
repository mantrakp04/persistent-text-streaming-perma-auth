import { getConvexSiteUrl } from "@/lib/utils";
import { StreamId } from "@convex-dev/persistent-text-streaming";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { useMemo, useEffect } from "react";
import Markdown from "react-markdown";

export function ServerMessage({
  message,
  driven,
  stopStreaming,
  scrollToBottom,
}: {
  message: Doc<"userMessages">;
  driven: boolean;
  stopStreaming: () => void;
  scrollToBottom: () => void;
}) {
  const { text, status } = useStream(
    api.streaming.getStreamBody,
    new URL(`${getConvexSiteUrl()}/chat-stream`),
    driven,
    message.responseStreamId as StreamId
  );

  const isCurrentlyStreaming = useMemo(() => {
    if (!driven) return false;
    return status === "pending" || status === "streaming";
  }, [driven, status]);

  useEffect(() => {
    if (!driven) return;
    if (isCurrentlyStreaming) return;
    stopStreaming();
  }, [driven, isCurrentlyStreaming, stopStreaming]);

  useEffect(() => {
    if (!text) return;
    scrollToBottom();
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
