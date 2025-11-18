"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 画面のリロードを止める

    // 本当の認証はまだやらない。
    // とりあえずログインボタン押したらダッシュボードへ遷移。
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">ログイン</h1>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="メールアドレス"
            className="border px-4 py-2 rounded"
          />

          <input
            type="password"
            placeholder="パスワード"
            className="border px-4 py-2 rounded"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            ログイン
          </button>
        </form>
      </div>
    </main>
  );
}