import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { boards } from "./deck";

export const dynamic = "force-dynamic";

const dayMs = 86_400_000;
const cookieName = "hive-board";
const secret = () => process.env.HIVE_GAME_SECRET;
const sign = (value: string) => createHmac("sha256", secret()!).update(value).digest();
const normalize = (value: string) => value.normalize("NFKD")
  .replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim().replace(/^(a|an|the) /, "");

function dailyBoard() {
  const day = Math.floor(Date.now() / dayMs);
  const date = new Date(day * dayMs).toISOString().slice(0, 10);
  return { date, board: boards[day % boards.length], resetsAt: (day + 1) * dayMs };
}

function readGuesses(request: NextRequest, date: string): string[] {
  const [payload, signature] = request.cookies.get(cookieName)?.value.split(".") ?? [];
  if (!payload || !signature) return [];
  const expected = sign(payload);
  const received = Buffer.from(signature, "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return [];
  const saved = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  return saved.date === date ? saved.guesses : [];
}

function reveal(date: string, board: (typeof boards)[number], guesses: string[]) {
  return board.slice(0, guesses.length).map(([prompt, ...answers], index) => {
    const seed = sign(`simulation:${date}:${index}`);
    const percentages = [37 + seed[0] % 11, 23 + seed[1] % 7, 14 + seed[2] % 5];
    const rotation = seed[3] % answers.length;
    const groups = answers.slice(rotation).concat(answers.slice(0, rotation));
    const matched = groups.findIndex(group => group.split("|")
      .some(alias => normalize(alias) === normalize(guesses[index])));
    const choices = groups.map((group, i) => ({ label: group.split("|")[0], pct: percentages[i] }));
    choices.push({ label: "Other answers", pct: 100 - percentages.reduce((a, b) => a + b, 0) });
    return { prompt, choices, matched, guess: guesses[index], points: matched < 0 ? 0 : choices[matched].pct };
  });
}

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

function state(daily: ReturnType<typeof dailyBoard>, guesses: string[]) {
  const { date, board, resetsAt } = daily;
  const graded = reveal(date, board, guesses);
  const tiers = graded.map(row => row.matched);
  return {
    date, resetsAt, tiers,
    count: guesses.length,
    prompt: board[guesses.length]?.[0] ?? null,
    results: guesses.length === board.length ? graded : null,
  };
}

export function GET(request: NextRequest) {
  if (!secret()) return response({ error: "The hive is missing its server configuration." }, 503);
  const daily = dailyBoard();
  return response(state(daily, readGuesses(request, daily.date)));
}

export async function POST(request: NextRequest) {
  if (!secret()) return response({ error: "The hive is missing its server configuration." }, 503);
  const body = await request.json().catch(() => null);
  const guess = typeof body?.guess === "string" ? body.guess.trim() : "";
  if (guess.length > 60 || !normalize(guess)) return response({ error: "Enter a guess with 1–60 characters." }, 400);

  const daily = dailyBoard();
  const guesses = readGuesses(request, daily.date);
  if (body.date !== daily.date || body.index !== guesses.length || guesses.length >= daily.board.length) {
    return response({ ...state(daily, guesses), error: "The board changed. Your progress is up to date." }, 409);
  }

  const next = [...guesses, guess];
  const payload = Buffer.from(JSON.stringify({ date: daily.date, guesses: next })).toString("base64url");
  const result = response(state(daily, next));
  result.cookies.set(cookieName, `${payload}.${sign(payload).toString("base64url")}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/hive",
    expires: new Date(daily.resetsAt),
  });
  return result;
}

