'use client';

import { useRef, useEffect, useState } from 'react';
import { useGeminiChat } from '@/lib/useGeminiChat';

export const GeminiChatbot = () => {
  const { messages, loading, sendMessage, clearChat } = useGeminiChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const quickMessages = [
    'How many approved providers?',
    'Show pending provider approvals',
    'How many pending appeals?',
    'Recent platform activities',
    'Dashboard stats overview',
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage(input);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center gap-2"
          aria-label="Open chatbot"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-sm font-semibold">Chat</span>
        </button>
      )}

      {/* Chat Dialog */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-24px)] h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-sky-500 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center ring-1 ring-white/20 bg-white/10">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <circle cx="18" cy="18" r="18" fill="#0ea5e9" />
                  <text x="50%" y="52%" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="Inter, Arial">FM</text>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">fixmo-AI</h3>
                <p className="text-xs opacity-90">Powered by Gemini</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition"
              aria-label="Close chatbot"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-4xl mb-3">👋</div>
                <h4 className="font-semibold text-gray-800">Welcome!</h4>
                <p className="text-sm text-gray-600 mt-2">
                  Ask me anything about your FixMo data:
                </p>
                <ul className="text-xs text-gray-600 mt-4 space-y-1">
                  <li>• How many pending approvals?</li>
                  <li>• Top performing providers</li>
                  <li>• Total sales this month</li>
                  <li>• Recent platform activities</li>
                </ul>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Avatar / Label */}
                    {message.role !== 'user' && (
                      <div className="flex-shrink-0 mr-3 mt-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ring-1 ring-sky-200 bg-sky-100">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <circle cx="10" cy="10" r="10" fill="#7dd3fc" />
                            <text x="50%" y="54%" textAnchor="middle" fill="#0369a1" fontSize="9" fontWeight="700" fontFamily="Inter, Arial">AI</text>
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className={`max-w-[75%]`}>
                      {message.role !== 'user' && (
                        <div className="text-xs text-sky-500 font-medium mb-1">fixmo-AI</div>
                      )}

                      <div
                        className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md rounded-tl-2xl'
                            : message.error
                            ? 'bg-red-50 text-red-800 border border-red-100'
                            : 'bg-white text-gray-800 border border-gray-100'
                        }`}
                      >
                        <p>{message.content}</p>

                        {message.loading && (
                          <div className="flex gap-1 mt-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ring-1 ring-sky-200 bg-sky-100">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <circle cx="10" cy="10" r="10" fill="#7dd3fc" />
                          <text x="50%" y="54%" textAnchor="middle" fill="#0369a1" fontSize="9" fontWeight="700" fontFamily="Inter, Arial">AI</text>
                        </svg>
                      </div>
                    </div>

                    <div className="max-w-[75%]">
                      <div className="text-xs text-sky-500 font-medium mb-1">fixmo-AI</div>
                      <div className="px-4 py-3 rounded-2xl text-sm bg-white text-gray-700 border border-gray-100 shadow-sm min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Typing</span>
                          <span className="flex items-center gap-1" aria-label="fixmo-AI is typing">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:-0.2s]" />
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:-0.1s]" />
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 p-4 bg-white">
            {!input.trim() && (
              <div className="mb-3 flex flex-wrap gap-2">
                {quickMessages.slice(0, 5).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(q);
                      inputRef.current?.focus();
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                disabled={loading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Send
              </button>
            </form>
            <button
              onClick={() => {
                clearChat();
                setInput('');
                inputRef.current?.focus();
              }}
              className="text-xs text-gray-500 hover:text-gray-700 mt-2 w-full py-1"
            >
              Clear history
            </button>
          </div>
        </div>
      )}
    </>
  );
};
