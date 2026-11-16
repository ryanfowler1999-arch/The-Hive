import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { publishedBoards } from "./published";

export const dynamic = "force-dynamic";

const dayMs = 86_400_000;
const cookieName = "hive-survey-v1";
const tierFor = (index: number) => index < 0 ? -1 : index === 0 ? 0 : index < 3 ? 1 : 2;
const tierPoints = [50, 34, 18];
type Board = (typeof publishedBoards)[number];
const roundMs = 20_000;
type Progress = { guesses: string[]; deadline: number | null };
const secret = () => process.env.HIVE_GAME_SECRET;
const sign = (value: string) => createHmac("sha256", secret()!).update(value).digest();
const normalize = (value: string) => value.normalize("NFKD")
  .replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim().replace(/^(a|an|the) /, "");

function dailyBoard() {
  const day = Math.floor(Date.now() / dayMs);
  const date = new Date(day * dayMs).toISOString().slice(0, 10);
  const board = publishedBoards[day % publishedBoards.length];
  return { date, board, resetsAt: (day + 1) * dayMs };
}

function readProgress(request: NextRequest, date: string): Progress {
  const empty = { guesses: [], deadline: null };
  const [payload, signature] = request.cookies.get(cookieName)?.value.split(".") ?? [];
  if (!payload || !signature) return empty;
  const expected = sign(payload);
  const received = Buffer.from(signature, "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return empty;
  const saved = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  return saved.date === date ? saved : empty;
}

function matches(group: string, guess: string, partial: boolean) {
  const value = normalize(guess);
  if (!value) return false;
  return group.split("|").some(alias => {
    const candidate = normalize(alias);
    return partial ? value.length >= 3 && ` ${candidate} `.includes(` ${value} `) : candidate === value;
  });
}

function reveal(board: Board, guesses: string[]) {
  return board.slice(0, guesses.length).map(({ prompt, responses }, index) => {
    const groups = responses.map(({ label, aliases }) => [label, ...aliases].join("|"));
    const exact = groups.findIndex(group => matches(group, guesses[index], false));
    const partial = groups.flatMap((group, i) => matches(group, guesses[index], true) ? [i] : []);
    const matched = exact >= 0 ? exact : partial.length === 1 ? partial[0] : -1;
    const tier = tierFor(matched);
    const points = tierPoints[tier] ?? 0;
    const total = responses.reduce((sum, row) => sum + row.count, 0);
    const choices = responses.map((row, i) => ({
      label: row.label,
      pct: Math.round(row.count / total * 1000) / 10,
      tier: tierFor(i),
    }));
    return { prompt, choices, matched, tier, guess: guesses[index], points };
  });
}

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

function state(daily: ReturnType<typeof dailyBoard>, progress: Progress) {
  const { guesses, deadline } = progress;
  const { date, board, resetsAt } = daily;
  const graded = reveal(board, guesses);
  const tiers = graded.map(row => row.tier);
  return {
    date, resetsAt, tiers, deadline, real: true, maxPoints: board.length * tierPoints[0], serverNow: Date.now(),
    last: graded.length ? { guess: graded.at(-1)!.guess, points: graded.at(-1)!.points } : null,
    count: guesses.length,
    prompt: deadline ? board[guesses.length]?.prompt ?? null : null,
    results: guesses.length === board.length ? graded : null,
  };
}

export function GET(request: NextRequest) {
  if (!secret()) return response({ error: "The hive is missing its server configuration." }, 503);
  const daily = dailyBoard();
  return response(state(daily, readProgress(request, daily.date)));
}

export async function POST(request: NextRequest) {
  if (!secret()) return response({ error: "The hive is missing its server configuration." }, 503);
  const body = await request.json().catch(() => null);

  const daily = dailyBoard();
  const progress = readProgress(request, daily.date);
  const { guesses, deadline } = progress;
  if (body?.date !== daily.date || body.index !== guesses.length || guesses.length >= daily.board.length) {
    return response({ ...state(daily, progress), error: "The board changed. Your progress is up to date." }, 409);
  }
  if (body.action === "start") {
    return save(daily, { guesses, deadline: deadline ?? Date.now() + roundMs });
  }
  if (!deadline) return response({ error: "Start the question first." }, 400);
  if (Date.now() >= deadline) return save(daily, { guesses: [...guesses, ""], deadline: null });
  const guess = typeof body.guess === "string" ? body.guess.trim() : "";
  if (body.action === "expire") return response(state(daily, progress));
  if (guess.length > 60 || !normalize(guess)) return response({ error: "Enter a guess with 1–60 characters." }, 400);
  return save(daily, { guesses: [...guesses, guess], deadline: null });
}

function save(daily: ReturnType<typeof dailyBoard>, progress: Progress) {
  const payload = Buffer.from(JSON.stringify({ date: daily.date, ...progress })).toString("base64url");
  const result = response(state(daily, progress));
  result.cookies.set(cookieName, `${payload}.${sign(payload).toString("base64url")}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/hive",
    expires: new Date(daily.resetsAt),
  });
  return result;
}
