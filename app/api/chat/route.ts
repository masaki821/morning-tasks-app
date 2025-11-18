import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { message } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is missing" },
      { status: 500 }
    );
  }

  // OpenAI API 呼び出し
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    }),
  });

  // OpenAI API 自体がエラーを返した場合
  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", errorText);
    return NextResponse.json(
      { error: "OpenAI API error", detail: errorText },
      { status: 500 }
    );
  }

  const data = await response.json();

  // ここで「答え」だけに絞って返す
  const answer =
    data?.choices?.[0]?.message?.content ??
    "OpenAI から有効な回答が返ってきませんでした。";

  return NextResponse.json({ answer });
}