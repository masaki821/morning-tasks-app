"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Task = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  due_date: string | null;
  priority: number | null;
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 詳細取得
  useEffect(() => {
    const fetchTask = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (error) {
        console.error("タスク取得エラー:", error);
        setLoading(false);
        return;
      }

      setTask(data as Task);
      setTitle((data as Task).title);
      setLoading(false);
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  // 更新処理
  const handleUpdate = async () => {
    if (!title.trim() || !task) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("tasks")
      .update({ title })
      .eq("id", task.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error("更新エラー:", error);
      return;
    }

    setTask(data as Task);
    alert("更新しました");
  };

  // 削除処理
  const handleDelete = async () => {
    if (!task) return;
    const ok = confirm("このタスクを削除しますか？");
    if (!ok) return;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", task.id);

    if (error) {
      console.error("削除エラー:", error);
      return;
    }

    // 削除後は一覧に戻る
    router.push("/tasks");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700">読み込み中...</p>
      </main>
    );
  }

  if (!task) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <p className="text-gray-700 mb-4">タスクが見つかりませんでした。</p>
        <button
          onClick={() => router.push("/tasks")}
          className="text-blue-600 hover:underline"
        >
          一覧へ戻る
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-gray-100 py-10 px-4">
      <div className="w-full max-w-xl bg-white shadow-md rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">タスク詳細</h1>

        <div className="space-y-2">
          <label className="block text-sm text-gray-700">タイトル</label>
          <input
            className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <p className="text-sm text-gray-600">
          ステータス: <span className="font-semibold">{task.status}</span>
        </p>
        <p className="text-xs text-gray-500">
          作成日: {new Date(task.created_at).toLocaleString()}
        </p>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "タイトルを更新"}
          </button>

          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            削除
          </button>

          <button
            onClick={() => router.push("/tasks")}
            className="ml-auto text-sm text-gray-700 hover:underline"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    </main>
  );
}