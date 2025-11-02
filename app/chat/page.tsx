"use client";
import { useChat } from "ai/react";
import { useEffect, useRef } from "react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({ api: "/api/chat" });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Ask Your Data</h1>
      <div className="rounded-lg border bg-white p-4 h-[60vh] overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-gray-600">Try: “What was gross, net, AOV, and ROAS over the last 30 days?”</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="mb-3">
            <div className="text-xs text-gray-500">{m.role === "user" ? "You" : "Assistant"}</div>
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about your metrics..."
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}

