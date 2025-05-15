import type React from "react";

import type { Message } from "@/lib/types";
import MessageItem from "./message-item";
import {
  useRef,
  useEffect,
  useCallback,
  useState,
  useLayoutEffect,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function useMessages() {
  const localMessages: Message[] = [
    {
      id: "1",
      chatId: "1",
      role: "assistant",
      timestamp: new Date(),
      content: "Hello! How can I help you today?",
    },
  ];
  const serverMessages = useQuery(api.messages.listMessages);
  if (!serverMessages) return localMessages;

  for (const message of serverMessages) {
    localMessages.push({
      id: message._id + "-user",
      chatId: message._id,
      role: "user",
      timestamp: new Date(message._creationTime),
      content: message.prompt,
    });
    localMessages.push({
      id: message._id + "-assistant",
      chatId: message._id,
      role: "assistant",
      timestamp: new Date(message._creationTime),
      streamId: message.responseStreamId,
    });
  }
  return localMessages;
}

export default function ChatWindow() {
  const [drivenIds, setDrivenIds] = useState<Set<string>>(new Set());
  const [isStreaming, setIsStreaming] = useState(false);
  const messages = useMessages();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearAllMessages = useMutation(api.messages.clearMessages);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
      }
    },
    [messagesEndRef]
  );

  const windowSize = useWindowSize();

  useEffect(() => {
    scrollToBottom();
  }, [windowSize, scrollToBottom]);

  const sendMessage = useMutation(api.messages.sendMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setInputValue("");

    const chatId = await sendMessage({
      prompt: inputValue,
    });

    setDrivenIds((prev) => {
      prev.add(chatId);
      return prev;
    });

    setIsStreaming(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto py-6 px-4 md:px-8 lg:px-12"
      >
        <div className="w-full max-w-5xl mx-auto space-y-6">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              driven={
                message.role === "assistant" && drivenIds.has(message.chatId)
              }
              scrollToBottom={scrollToBottom}
              stopStreaming={() => {
                setIsStreaming(false);
                focusInput();
              }}
              message={message}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 py-6 px-4 md:px-8 lg:px-12">
        <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={isStreaming}
              className="flex-1 p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-base text-black"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isStreaming}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:text-gray-200 font-medium"
            >
              Send
            </button>
            <button
              type="button"
              disabled={messages.length < 2 || isStreaming}
              onClick={() => {
                clearAllMessages();
                setInputValue("");
                setIsStreaming(false);
                focusInput();
              }}
              className="px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:text-gray-200 font-medium"
            >
              Clear Chat
            </button>
          </div>
          {isStreaming && (
            <div className="text-xs text-gray-500 mt-2">
              AI is responding...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}
