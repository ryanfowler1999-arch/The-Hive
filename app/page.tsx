"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ArrowRight, Check, Crown, Hexagon, Share2 } from "lucide-react";

type Result = {
  prompt: string;
  guess: string;
  points: number;
  matched: number;
  choices: { label: string; pct: number }[];
};
type Board = {
  date: string;
  resetsAt: number;
  count: number;
  tiers: number[];
  prompt: string | null;
  results: Result[] | null;
};

const verdicts = [
  { label: "Hive-Minded", step: 3, className: "hive-minded" },
  { label: "Common Thought", step: 2, className: "common-thought" },
  { label: "In the Same Field", step: 1, className: "same-field" },
  { label: "Wrong Hive", step: -2, className: "wrong-hive" },
];

function verdict(tier: number) {
  return verdicts[tier] ?? verdicts[3];
}

function HiveInterior() {
  return <div className="hive-interior" aria-hidden="true">
    <div className="hive-walls">
      {Array.from({ length: 11 }, (_, ring) => (
        <div className="hive-ring" key={ring} style={{ "--ring": ring } as CSSProperties}>
          {Array.from({ length: 6 }, (_, facet) => (
            <i key={facet} style={{ "--facet": facet } as CSSProperties} />
          ))}
        </div>
      ))}
    </div>
  </div>;
}

export default function Home() {
  const [board, setBoard] = useState<Board | null>(null);
  const [playing, setPlaying] = useState(false);
  const [guess, setGuess] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [share, setShare] = useState("");
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const summary = useRef<HTMLHeadingElement>(null);

  async function loadBoard() {
    try {
      const response = await fetch("/api/hive", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setBoard(data);
      setError("");
    } catch {
      setError("The hive is unavailable. Try loading the board again.");
    }
  }

  useEffect(() => { void loadBoard(); }, []);

  useEffect(() => {
    if (!board) return;
    const remaining = board.resetsAt - Date.now();
    const refresh = () => {
      setPlaying(false);
      setGuess("");
      setShare("");
      setCopied(false);
      void loadBoard();
    };
    const timer = window.setTimeout(refresh, remaining > 0 ? remaining + 100 : 1000);
    const onFocus = () => { if (Date.now() >= board.resetsAt) refresh(); };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [board]);

  useEffect(() => {
    if (playing && !busy) {
      if (board?.results) summary.current?.focus();
      else input.current?.focus();
    }
  }, [playing, busy, board]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!board || busy || !guess.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/hive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess, date: board.date, index: board.count }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 409) throw new Error(data.error);
      setBoard(data);
      setGuess("");
      if (data.error) setError(data.error);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save your guess. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const results = board?.results;
  const lastVerdict = board?.count ? verdict(board.tiers[board.count - 1]) : null;
  const depth = board?.tiers.reduce((position, tier) => Math.max(0, position + verdict(tier).step), 0) ?? 0;
  const location = depth >= 17 ? "Queen’s chamber" : depth >= 10 ? "Inner hive" : depth >= 4 ? "Honeycomb passage" : "Outer hive";
  const score = results?.reduce((total, row) => total + row.points, 0) ?? 0;
  const maximum = results?.reduce((total, row) => total + row.choices[0].pct, 0) ?? 0;
  const ratio = maximum ? score / maximum : 0;
  const rank = ratio >= .82 ? "Queen Bee" : ratio >= .62 ? "Royal Advisor" : ratio >= .4 ? "Busy Bee" : "Lone Bee";
  const date = board && new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(board.date + "T00:00:00Z"));

  async function copyScore() {
    if (!results || !board) return;
    const cells = results.map(row => row.matched === 0 ? "🟨" : row.points ? "🟧" : "⬛").join("");
    const message = `🐝 The Hive Mind · ${board.date}\n${cells}\n${score}/${maximum} · ${rank} · Simulated results\n${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setShare(message);
    }
  }

  return (
    <main className="shell" style={{ "--depth": playing ? depth : 0 } as CSSProperties}>
      <HiveInterior />
      <header className="masthead">
        <button className="brand" onClick={() => setPlaying(false)}><Hexagon size={22} aria-hidden /> The Hive Mind</button>
        <span className="mode">Simulated results</span>
      </header>

      {!playing && (
        <section className="hero">
          <div className="emblem" aria-hidden><span>🐝</span></div>
          <p className="eyebrow">{date ? `Daily hive / ${date}` : "Daily hive"}</p>
          <h1>Think like<br /><em>the hive.</em></h1>
          <p className="intro">Seven strange questions. Guess what most people would say and make your way to the queen.</p>
          <button className="primary" disabled={!board && !error} onClick={() => board ? setPlaying(true) : void loadBoard()}>
            {results ? "See your results" : board?.count ? "Continue your hive" : board ? "Enter the hive" : error ? "Try again" : "Opening the hive…"}
            <ArrowRight size={20} aria-hidden />
          </button>
          <details>
            <summary>How to play</summary>
            <p>Type one guess per chamber. Each locked guess gets a verdict. Better guesses move you toward the queen. The answer breakdowns open after the seventh guess. A new board opens at midnight UTC.</p>
          </details>
        </section>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      {playing && board && (
        <section className="game">
          <p className="eyebrow">{location} / {board.count} of 7 locked</p>
          <ol className="comb" aria-label="Honeycomb progress">
            {Array.from({ length: 7 }, (_, index) => (
              <li key={index} className={index < board.count ? "filled" : index === board.count ? "active" : ""}
                aria-label={`Chamber ${index + 1}${index < board.count ? ", locked" : ""}`}
                aria-current={index === board.count ? "step" : undefined}>
                {index === 6 ? <Crown size={20} aria-hidden /> : index < board.count ? <Check size={18} aria-hidden /> : index + 1}
              </li>
            ))}
          </ol>

          <div className="verdict-area" role="status">
            {lastVerdict && (
              <p className={`verdict ${lastVerdict.className}`}>
                <span>Chamber {board.count}</span> {lastVerdict.label}
              </p>
            )}
          </div>

          {!results ? (
            <div className="panel">
              <p className="eyebrow">Chamber {board.count + 1} of 7</p>
              <h2 id="prompt">{board.prompt}</h2>
              <form onSubmit={submit}>
                <label htmlFor="guess">What would most people say?</label>
                <input id="guess" ref={input} aria-describedby="prompt" value={guess} onChange={event => setGuess(event.target.value)}
                  maxLength={60} autoComplete="off" placeholder="Type your guess" readOnly={busy} required />
                <button className="primary" disabled={busy || !guess.trim()}>
                  {busy ? "Locking guess…" : board.count === 6 ? "Lock guess and reveal" : "Lock in guess"} <ArrowRight size={20} aria-hidden />
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="panel finale">
                <Crown size={42} aria-hidden />
                <h2 ref={summary} tabIndex={-1}>{rank}</h2>
                <p><strong>{score} / {maximum}</strong> honey points</p>
                <p>Simulated results use fictional percentages.</p>
                <button className="primary" onClick={() => void copyScore()}>
                  <Share2 size={18} aria-hidden /> {copied ? "Copied!" : "Copy score"}
                </button>
                {share && <textarea aria-label="Score to copy" value={share} readOnly onFocus={event => event.target.select()} />}
              </div>
              {results.map((row, index) => (
                <article className="panel breakdown" key={row.prompt}>
                  <p className="eyebrow">Chamber {index + 1}</p>
                  <h3>{row.prompt}</h3>
                  <p className="your-guess">Your guess <strong>{row.guess}</strong> · <span className={verdict(row.matched).className}>{verdict(row.matched).label}</span></p>
                  <ul>
                    {row.choices.map((choice, choiceIndex) => (
                      <li key={choice.label} className={row.matched === choiceIndex ? "matched" : ""}>
                        <div><span>{choice.label}{row.matched === choiceIndex && " ✓"}</span><strong>{choice.pct}%</strong></div>
                        <div className="track" aria-hidden><span style={{ width: `${choice.pct}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </>
          )}
        </section>
      )}
      <footer>New board at midnight UTC <span>Progress saved in this browser</span></footer>
    </main>
  );
}
