"use client";

import { useEffect, useState, FormEvent, DragEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  due_date: string | null;
  priority: number | null;
  routine_id: string | null;
};

type Routine = {
  id: string;
  title: string;
  description: string | null;
  frequency: string; // "daily" | "weekly" | "weekday" 想定
  day_of_week: number | null;
  default_priority: number | null;
  is_active: boolean;
};

type Tab = "active" | "carryover" | "completed";
type Section = "today" | "future" | "noDue";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [priority, setPriority] = useState<number>(2); // 1〜4
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("active");

  // ルーティン生成中フラグ
  const [generating, setGenerating] = useState(false);

  // ドラッグ中の情報
  const [dragging, setDragging] = useState<{
    section: Section | null;
    id: string | null;
  }>({ section: null, id: null });

  // セクションごとの並び順（UI 上のみ保持）
  const [orderToday, setOrderToday] = useState<string[] | null>(null);
  const [orderFuture, setOrderFuture] = useState<string[] | null>(null);
  const [orderNoDue, setOrderNoDue] = useState<string[] | null>(null);
// コンポーネントの外でも中でもOK（関数として定義）
const getTodayStr = () => {
  const now = new Date(); // ローカル（日本時間）
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // 例: 2025-11-17
};
  const todayStr = getTodayStr();

  // ====== 1. 初回ロードでタスク取得 ======
  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("タスク取得エラー:", error);
        return;
      }

      setTasks((data as Task[]) || []);
    };

    fetchTasks();
  }, []);

  // ====== 2. 集計（総数・完了数・完了率） ======
  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const completionRate =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // ====== 3. ステータス・期限による分類 ======
  const activeTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");

  // 持ち越し（昨日以前が締切で未完了）
  const carryoverTasks = activeTasks.filter(
    (t) => t.due_date && t.due_date < todayStr,
  );

  // 未完了タブ用のセクション分け
  const baseToday = activeTasks.filter((t) => t.due_date === todayStr);
  const baseFuture = activeTasks.filter(
    (t) => t.due_date && t.due_date > todayStr,
  );
  const baseNoDue = activeTasks.filter((t) => !t.due_date);

  // 並び順を適用
  const applyOrder = (baseTasks: Task[], orderedIds: string[] | null) => {
    if (!orderedIds) return baseTasks;
    const map = new Map(baseTasks.map((t) => [t.id, t]));
    const ordered: Task[] = [];
    for (const id of orderedIds) {
      const item = map.get(id);
      if (item) ordered.push(item);
    }
    const rest = baseTasks.filter((t) => !orderedIds.includes(t.id));
    return [...ordered, ...rest];
  };

  const todayTasks = applyOrder(baseToday, orderToday);
  const futureTasks = applyOrder(baseFuture, orderFuture);
  const noDueTasks = applyOrder(baseNoDue, orderNoDue);

  // ====== 4. タスク追加 ======
  const handleAddTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    const insertData: {
      title: string;
      status: string;
      description?: string | null;
      due_date?: string | null;
      priority?: number | null;
      routine_id?: string | null;
    } = {
      title,
      status: "todo",
    };

    if (dueDate) insertData.due_date = dueDate;
    insertData.priority = priority;

    const { data, error } = await supabase
      .from("tasks")
      .insert(insertData)
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error("タスク追加エラー:", error);
      return;
    }

    if (data) {
      setTasks((prev) => [data as Task, ...prev]);
      setTitle("");
      setDueDate("");
      setPriority(2);
    }
  };

  // ====== 5. 削除 ======
  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      console.error("タスク削除エラー:", error);
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // ====== 6. 完了 / 未完了 トグル ======
  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id)
      .select()
      .single();

    if (error) {
      console.error("ステータス更新エラー:", error);
      return;
    }

    if (data) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? (data as Task) : t)),
      );
    }
  };

  // ====== 7. 重要度ラベル ======
  const getPriorityLabel = (p: number | null) => {
    switch (p) {
      case 1:
        return { label: "低", className: "bg-gray-100 text-gray-700" };
      case 2:
        return { label: "普通", className: "bg-blue-50 text-blue-700" };
      case 3:
        return { label: "高", className: "bg-orange-50 text-orange-700" };
      case 4:
        return { label: "緊急", className: "bg-red-50 text-red-700" };
      default:
        return { label: "未設定", className: "bg-gray-100 text-gray-500" };
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date) return false;
    if (task.status === "done") return false;
    return task.due_date < todayStr;
  };

  // ====== 8. D&D 並び替え（未完了タブの 3 セクション） ======
  const getOrderState = (section: Section) => {
    switch (section) {
      case "today":
        return [orderToday, setOrderToday] as const;
      case "future":
        return [orderFuture, setOrderFuture] as const;
      case "noDue":
        return [orderNoDue, setOrderNoDue] as const;
    }
  };

  const getBaseTasksBySection = (section: Section) => {
    switch (section) {
      case "today":
        return baseToday;
      case "future":
        return baseFuture;
      case "noDue":
        return baseNoDue;
    }
  };

  const handleDragStart = (section: Section, id: string) => {
    setDragging({ section, id });
  };

  const handleDragOver = (
    e: DragEvent<HTMLLIElement>,
    section: Section,
    overId: string,
  ) => {
    e.preventDefault();
    if (!dragging.id || dragging.section !== section) return;

    const [order, setOrder] = getOrderState(section);
    const base = getBaseTasksBySection(section);
    const currentIds = order ?? base.map((t) => t.id);

    if (dragging.id === overId) return;

    const newIds = reorderIds(currentIds, dragging.id, overId);
    setOrder(newIds);
  };

  const handleDrop = (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    setDragging({ section: null, id: null });
  };

  const reorderIds = (ids: string[], fromId: string, toId: string) => {
    const newIds = [...ids];
    const fromIndex = newIds.indexOf(fromId);
    const toIndex = newIds.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) return newIds;
    const [moved] = newIds.splice(fromIndex, 1);
    newIds.splice(toIndex, 0, moved);
    return newIds;
  };

  // ====== 9. ルーティンタスクから「今日のタスク」を生成 ======
  const handleGenerateRoutines = async () => {
    setGenerating(true);
    try {
      // 1) 有効なルーティンを取得
      const { data: routines, error: routineError } = await supabase
        .from("routine_tasks")
        .select("*")
        .eq("is_active", true);

      if (routineError) {
        console.error("ルーティン取得エラー:", routineError);
        return;
      }

      const routinesTyped = (routines as Routine[]) || [];
      if (routinesTyped.length === 0) return;

      const weekday = new Date().getDay(); // 0:日〜6:土

      // 今日生成対象のルーティンを判定
      const todayRoutines = routinesTyped.filter((r) => {
        if (!r.is_active) return false;

        switch (r.frequency) {
          case "daily":
            return true;
          case "weekday":
            return weekday >= 1 && weekday <= 5;
          case "weekly":
            return r.day_of_week === weekday;
          default:
            return false;
        }
      });

      if (todayRoutines.length === 0) return;

      // 2) すでに「今日の分」が tasks にある routine_id を調べる
      const routineIds = todayRoutines.map((r) => r.id);

      const { data: existing, error: existingError } = await supabase
        .from("tasks")
        .select("routine_id")
        .eq("due_date", todayStr)
        .in("routine_id", routineIds);

      if (existingError) {
        console.error("既存タスク確認エラー:", existingError);
        return;
      }

      const existingSet = new Set(
        (existing as { routine_id: string | null }[] | null || [])
          .map((t) => t.routine_id)
          .filter((id): id is string => !!id),
      );

      const toInsertRoutines = todayRoutines.filter(
        (r) => !existingSet.has(r.id),
      );

      if (toInsertRoutines.length === 0) {
        console.log("本日分のルーティンタスクはすでに生成済みです");
        return;
      }

      // 3) tasks に INSERT するデータを組み立て
      const insertData = toInsertRoutines.map((r) => ({
        title: r.title,
        status: "todo",
        due_date: todayStr,
        priority: r.default_priority ?? 2,
        routine_id: r.id,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("tasks")
        .insert(insertData)
        .select();

      if (insertError) {
        console.error("ルーティンタスク生成エラー:", insertError);
        return;
      }

      if (inserted) {
        // 生成されたタスクを state に反映
        setTasks((prev) => [...(inserted as Task[]), ...prev]);
      }
    } finally {
      setGenerating(false);
    }
  };

  // ====== 10. JSX ======
  return (
    <main className="flex justify-center px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        {/* サマリーカード */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500">タスク総数</p>
            <p className="mt-1 text-2xl font-semibold">{totalCount}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500">完了</p>
            <p className="mt-1 text-2xl font-semibold text-green-600">
              {doneCount}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500">完了率</p>
            <p className="mt-1 text-2xl font-semibold">
              {completionRate}
              <span className="text-sm ml-1">%</span>
            </p>
          </div>
        </div>

        {/* ヘッダー + ルーティン生成ボタン */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              タスク管理
            </h1>
            <p className="text-xs text-gray-500">今日の日付：{todayStr}</p>
          </div>
          <button
            onClick={handleGenerateRoutines}
            disabled={generating}
            className="self-start rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
          >
            {generating ? "ルーティン生成中..." : "今日のルーティンを生成"}
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="inline-flex rounded-full bg-gray-200 p-1 text-xs gap-1">
          <button
            className={`px-4 py-1 rounded-full transition-colors ${
              activeTab === "active"
                ? "bg.white shadow text-gray-900 bg-white"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("active")}
          >
            未完了タスク
          </button>
          <button
            className={`px-4 py-1 rounded-full transition-colors ${
              activeTab === "carryover"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("carryover")}
          >
            持ち越し
          </button>
          <button
            className={`px-4 py-1 rounded-full transition-colors ${
              activeTab === "completed"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            完了タスク
          </button>
        </div>

        {/* 未完了タブ */}
        {activeTab === "active" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <form
              onSubmit={handleAddTask}
              className="mb-6 space-y-3 text-sm text-gray-800"
            >
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="新しいタスクを入力"
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">期限</span>
                  <input
                    type="date"
                    className="border border-gray-300 px-2 py-1 rounded-lg text-gray-900 text-xs"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </label>

                <label className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">重要度</span>
                  <select
                    className="border border-gray-300 px-2 py-1 rounded-lg text-gray-900 text-xs"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                  >
                    <option value={1}>低</option>
                    <option value={2}>普通</option>
                    <option value={3}>高</option>
                    <option value={4}>緊急</option>
                  </select>
                </label>

                <button
                  type="submit"
                  className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "追加中..." : "追加"}
                </button>
              </div>
            </form>

            <div className="space-y-6">
              <TaskSection
                title="今日のタスク"
                emptyText="今日のタスクはありません。"
                tasks={todayTasks}
                getPriorityLabel={getPriorityLabel}
                isOverdue={isOverdue}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteTask}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                section="today"
              />

              <TaskSection
                title="明日以降のタスク"
                emptyText="今後のタスクはありません。"
                tasks={futureTasks}
                getPriorityLabel={getPriorityLabel}
                isOverdue={isOverdue}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteTask}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                section="future"
              />

              <TaskSection
                title="期限なし"
                emptyText="期限のないタスクはありません。"
                tasks={noDueTasks}
                getPriorityLabel={getPriorityLabel}
                isOverdue={isOverdue}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteTask}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                section="noDue"
              />
            </div>
          </section>
        )}

        {/* 持ち越しタブ */}
        {activeTab === "carryover" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              持ち越しタスク（期限が過ぎている未完了）
            </h2>
            <ul className="space-y-3">
              {carryoverTasks.map((task) => {
                const priorityInfo = getPriorityLabel(task.priority);
                const overdue = isOverdue(task);

                return (
                  <li
                    key={task.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {task.title}
                        </Link>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityInfo.className}`}
                        >
                          重要度: {priorityInfo.label}
                        </span>
                        {overdue && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                            期限超過
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        作成日: {new Date(task.created_at).toLocaleString()}
                        {task.due_date && (
                          <>
                            {" ／ "}
                            期限:{" "}
                            <span className="text-red-600 font-semibold">
                              {task.due_date}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className="text-xs text.green-600 hover:underline text-green-600"
                      >
                        完了
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        削除
                      </button>
                    </div>
                  </li>
                );
              })}

              {carryoverTasks.length === 0 && (
                <p className="text-sm text-gray-600 mt-4">
                  持ち越し中のタスクはありません。いい感じです 👍
                </p>
              )}
            </ul>
          </section>
        )}

        {/* 完了タブ */}
        {activeTab === "completed" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              完了したタスク
            </h2>
            <ul className="space-y-3">
              {completedTasks.map((task) => {
                const priorityInfo = getPriorityLabel(task.priority);
                return (
                  <li
                    key={task.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-medium text-gray-500 line-through hover:underline"
                        >
                          {task.title}
                        </Link>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityInfo.className}`}
                        >
                          重要度: {priorityInfo.label}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          完了
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        作成日: {new Date(task.created_at).toLocaleString()}
                        {task.due_date && (
                          <>
                            {" ／ "}期限: {task.due_date}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        未完了に戻す
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        削除
                      </button>
                    </div>
                  </li>
                );
              })}

              {completedTasks.length === 0 && (
                <p className="text-sm text-gray-600 mt-4">
                  完了したタスクはまだありません。
                </p>
              )}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

/** 共通セクションコンポーネント（未完了タブ用：今日 / 明日以降 / 期限なし） */
type TaskSectionProps = {
  title: string;
  emptyText: string;
  tasks: Task[];
  section: Section;
  getPriorityLabel: (p: number | null) => { label: string; className: string };
  isOverdue: (task: Task) => boolean;
  onToggleStatus: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragStart: (section: Section, id: string) => void;
  onDragOver: (
    e: DragEvent<HTMLLIElement>,
    section: Section,
    overId: string,
  ) => void;
  onDrop: (e: DragEvent<HTMLLIElement>) => void;
};

function TaskSection(props: TaskSectionProps) {
  const {
    title,
    emptyText,
    tasks,
    section,
    getPriorityLabel,
    isOverdue,
    onToggleStatus,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
  } = props;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-2">{title}</h2>
      <ul className="space-y-3 min-h-[40px]">
        {tasks.map((task) => {
          const priorityInfo = getPriorityLabel(task.priority);
          const overdue = isOverdue(task);

          return (
            <li
              key={task.id}
              draggable
              onDragStart={() => onDragStart(section, task.id)}
              onDragOver={(e) => onDragOver(e, section, task.id)}
              onDrop={onDrop}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors cursor-move"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/tasks/${task.id}`}
                    className={`font-medium hover:underline ${
                      task.status === "done"
                        ? "text-gray-400 line-through"
                        : "text-blue-700"
                    }`}
                  >
                    {task.title}
                  </Link>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityInfo.className}`}
                  >
                    重要度: {priorityInfo.label}
                  </span>
                  {task.status === "done" && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      完了
                    </span>
                  )}
                  {overdue && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                      期限超過
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  作成日: {new Date(task.created_at).toLocaleString()}
                  {task.due_date && (
                    <>
                      {" ／ "}
                      期限:{" "}
                      <span
                        className={
                          overdue ? "text-red-600 font-semibold" : undefined
                        }
                      >
                        {task.due_date}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleStatus(task)}
                  className="text-xs text-green-600 hover:underline"
                >
                  {task.status === "done" ? "未完了に戻す" : "完了"}
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  削除
                </button>
              </div>
            </li>
          );
        })}

        {tasks.length === 0 && (
          <p className="text-xs text-gray-500">{emptyText}</p>
        )}
      </ul>
    </div>
  );
}