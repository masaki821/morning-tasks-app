// app/api/cron/carry-over/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cron で確実に毎回実行させるための指定（キャッシュさせない）
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const jstNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
    );

    const today = jstNow.toISOString().slice(0, 10); // YYYY-MM-DD
    const yesterdayDate = new Date(jstNow);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    const { data, error } = await supabase
  .from("tasks")
  .update({ due_date: today })
  .eq("due_date", yesterday)      // 昨日締切のタスクで
  .eq("status", "todo")           // まだ未完了のものだけ
  .eq("auto_carry_over", true)    // 自動繰り越しONのものだけ
  .select("id");

    if (error) {
      console.error("carry-over error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      movedCount: data?.length ?? 0,
      from: yesterday,
      to: today,
    });
  } catch (e: any) {
    console.error("carry-over unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}