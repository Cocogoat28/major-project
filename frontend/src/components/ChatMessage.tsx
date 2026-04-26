import React from "react";

export interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp?: Date;
}

/**
 * sanitizeText - removes leading/trailing asterisks and common markdown bold markers like **.
 * You can extend this to strip HTML tags or other unwanted characters.
 */
function sanitizeText(raw: string) {
  if (!raw) return "";

  let s = raw.trim();

  // Remove leading/trailing groups of asterisks (e.g. "**Hello**" -> "Hello")
  s = s.replace(/^\*+/, "").replace(/\*+$/, "");

  // Remove any remaining double-asterisks used for bold in Markdown
  s = s.replace(/\*\*/g, "");

  // Collapse multiple spaces
  s = s.replace(/\s{2,}/g, " ");

  return s;
}

const formatTime = (date?: Date) =>
  date ? new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

export default function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.sender === "user";
  const text = sanitizeText(msg.text);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}>
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[85%]`}>
        <div
          className={`p-3.5 rounded-2xl shadow-sm ${
            isUser
              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md"
              : "bg-white text-gray-800 rounded-tl-md border border-gray-100"
          }`}
        >
          <p
            className="text-sm leading-relaxed font-medium"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: "0.01em",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {text}
          </p>
        </div>

        {msg.timestamp && (
          <span className={`text-xs mt-1 ${isUser ? "text-gray-500" : "text-gray-400"}`}>
            {formatTime(msg.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
