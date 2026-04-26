
import React, { useState, useRef, useEffect } from "react";
import { IoChatbubbleEllipsesOutline, IoSend, IoClose, IoSparkles } from "react-icons/io5";
import ChatMessage, { Message } from "./ChatMessage";

// Get the base URL for the backend API
const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}/api` || "http://localhost:5000/api";

const SupportBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat window
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Initial welcome message (only once when opened)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text:
            "👋 Hello! I'm your CarParking AI Assistant. I'm here to help you with booking questions, registration, KYC verification, and app features. What can I help you with today?",
          timestamp: new Date(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      sender: "user",
      text: input.trim(),
      timestamp: new Date(),
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare history for context (excluding the initial welcome message)
      const historyForApi = newMessages.slice(1).map((msg) => ({
        sender: msg.sender,
        text: msg.text,
      }));

      const response = await fetch(`${API_BASE_URL}/support/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
          history: historyForApi,
        }),
      });

      const data = await response.json();

      const botResponse: Message = {
        sender: "bot",
        text: typeof data?.response === "string" ? data.response : JSON.stringify(data?.response ?? "Sorry, no response"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error sending message to bot:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            "⚠️ Sorry, I'm having trouble connecting right now. Please try again in a moment or reach our support team at +91-9876543210.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Use onKeyDown for reliable Enter detection
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Chat Button with Pulse Animation */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 z-50 group"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
        <div className="relative">
          {isOpen ? (
            <IoClose size={28} className="transition-transform duration-300" />
          ) : (
            <IoChatbubbleEllipsesOutline size={28} className="group-hover:rotate-12 transition-transform duration-300" />
          )}
        </div>
        {!isOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
      </button>

      {/* Chat Window with Animation */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden animate-slideUp">
          {/* Header with Gradient */}
          <div className="p-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <IoSparkles size={20} className="text-yellow-300" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  {/* force bold with inline style to avoid any build/purge anomalies */}
                  <h3 className="text-lg tracking-tight" style={{ fontWeight: 700 }}>
                    CarParking AI
                  </h3>
                  <p className="text-xs text-blue-100 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                    Always here to help
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:rotate-90">
                <IoClose size={24} />
              </button>
            </div>
          </div>

          {/* Messages Area with Custom Scrollbar */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-gray-50 to-white custom-scrollbar">
            {messages.map((msg, index) => (
              // use ChatMessage component to ensure consistent rendering & sanitization
              <ChatMessage key={index} msg={msg} />
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex flex-col items-start max-w-[85%]">
                  <div className="p-3.5 rounded-2xl rounded-tl-md bg-white shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area with Enhanced Styling */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full p-3.5 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all duration-200 placeholder-gray-400"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSend}
                className={`p-3.5 rounded-xl transition-all duration-200 ${
                  isLoading || !input.trim()
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
                }`}
                disabled={isLoading || !input.trim()}
              >
                <IoSend size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Powered by AI • Instant responses</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
          opacity: 0;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
};

export default SupportBot;