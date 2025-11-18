"use client";

import { useState } from "react";

export default function AiBotPage() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          data.detail || data.error || "サーバーエラーが発生しました。";
        setResponse(errorMsg);
        return;
      }

      setResponse(data.answer || data.reply || "回答がありませんでした。");
    } catch (e) {
      console.error(e);
      setResponse("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">AI チャットボット</h1>

        <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          <p className="text-sm text-gray-600">
            タスクの整理や今日やることの相談など、自由に質問してください。
          </p>

          <textarea
            className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            rows={4}
            placeholder="例）明日の朝にやるべきタスクを3つに整理して"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            onClick={sendMessage}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "送信中..." : "送信"}
          </button>

          <div className="mt-2 rounded-xl bg-gray-50 border border-gray-100 p-4 min-h-[80px] whitespace-pre-wrap text-sm text-gray-900">
            {response || "ここにAIの回答が表示されます。"}
          </div>
        </section>
      </div>
    </main>
  );
}