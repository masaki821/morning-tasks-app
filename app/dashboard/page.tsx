export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">Morning Tasks ダッシュボード</h1>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>こんにちは、ユーザーさん</span>
            <button className="rounded-full border px-3 py-1 text-xs hover:bg-gray-100">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
        {/* サマリーカード */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">今日のタスク</p>
            <p className="mt-2 text-2xl font-bold">5件</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">完了済み</p>
            <p className="mt-2 text-2xl font-bold text-green-600">2件</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">未完了</p>
            <p className="mt-2 text-2xl font-bold text-red-500">3件</p>
          </div>
        </section>

        {/* 最近のタスクリスト（ダミーデータ） */}
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">最近のタスク</h2>
          <ul className="mt-3 divide-y text-sm">
            <li className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">資料作成</p>
                <p className="text-xs text-gray-500">明日のMTG用</p>
              </div>
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
                進行中
              </span>
            </li>
            <li className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">メール返信</p>
                <p className="text-xs text-gray-500">クライアントA</p>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                完了
              </span>
            </li>
            <li className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">タスク整理</p>
                <p className="text-xs text-gray-500">明日の分を確認</p>
              </div>
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                未着手
              </span>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}