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
  deadline: number | null;
  serverNow: number;
  last: { guess: string; points: number } | null;
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

function spellingSuggestion(guess: string) {
  // Shared vocabulary, independent of the current question or its scoring.
  const words = "apple apricot avocado banana bicycle blueberry broccoli burger cabbage carrot celery cherry chocolate cinnamon cucumber doughnut fries grapefruit hockey ketchup lemonade lettuce mango monopoly nectarine oatmeal orange pancake peach peanut pear pineapple potato raspberry sandwich spinach strawberry tomato vanilla volleyball watermelon yogurt zucchini".split(" ");
  const value = guess.trim().toLowerCase();
  if (value.length < 4 || words.includes(value)) return null;
  const nearby = words.filter(word => {
    if (Math.abs(word.length - value.length) > 1) return false;
    const shorter = word.length < value.length ? word : value;
    const longer = word.length < value.length ? value : word;
    const first = [...shorter].findIndex((char, index) => char !== longer[index]);
    if (first < 0) return longer.length > shorter.length;
    if (longer.length > shorter.length) return shorter.slice(first) === longer.slice(first + 1);
    return shorter.slice(first + 1) === longer.slice(first + 1)
      || shorter[first] === longer[first + 1] && shorter[first + 1] === longer[first]
        && shorter.slice(first + 2) === longer.slice(first + 2);
  });
  return nearby.length === 1 ? nearby[0] : null;
}

export default function Home() {
  const [board, setBoard] = useState<Board | null>(null);
  const [playing, setPlaying] = useState(false);
  const [review, setReview] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(20);
  const [clockOffset, setClockOffset] = useState(0);
  const pending = useRef(false);
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
      setClockOffset(data.serverNow - Date.now());
      setReview(Boolean(data.last && !data.deadline && !data.results));
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
      else if (review) summary.current?.focus();
      else if (!suggestion) input.current?.focus();
    }
  }, [playing, busy, board, review, suggestion]);

  async function send(action: "start" | "guess" | "expire", entry?: string) {
    if (!board || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/hive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, guess: entry, date: board.date, index: board.count }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 409) throw new Error(data.error);
      setClockOffset(data.serverNow - Date.now());
      setRemaining(data.deadline ? Math.max(0, Math.ceil((data.deadline - data.serverNow) / 1000)) : 20);
      setBoard(data);
      if (action === "start" && response.ok) setReview(false);
      if (data.count > board.count) {
        setReview(true);
        setGuess("");
        setSuggestion(null);
      }
      if (data.error) setError(data.error);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not reach the hive.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!board?.deadline) return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((board.deadline! - Date.now() - clockOffset) / 1000));
      setRemaining(seconds);
      if (!seconds && !pending.current && !error) void send("expire");
    };
    const interval = window.setInterval(tick, 150);
    tick();
    return () => window.clearInterval(interval);
  }, [board, clockOffset, error]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!guess.trim() || !remaining || pending.current) return;
    const candidate = spellingSuggestion(guess);
    if (candidate) setSuggestion(candidate);
    else void send("guess", guess);
  }

  const results = review ? null : board?.results;
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
    <main className={playing && board && !results ? "shell arcade" : "shell"} style={{ "--depth": playing ? depth : 0 } as CSSProperties}>
      <HiveInterior />
      <div aria-hidden="true" className={`journey-scene ${depth >= 17 ? "center" : depth >= 10 ? "inside" : depth >= 4 ? "approach" : "field"}`}>
        <div className="journey-hills" /><div className="journey-hive" /><div className="journey-grass" />
      </div>
      {playing && board && !results && <div className="flight-marker" aria-hidden="true">🐝</div>}
      <header className="masthead">
        <button className="brand" onClick={() => setPlaying(false)}><Hexagon size={22} aria-hidden /> The Hive Mind</button>
        <span className="mode">Simulated results</span>
      </header>

      {!playing && (
        <section className="hero">
          <div className="emblem" aria-hidden><span>🐝</span></div>
          <p className="eyebrow">{date ? `Daily hive / ${date}` : "Daily hive"}</p>
          <h1>Think like<br /><em>the hive.</em></h1>
          <p className="intro">Seven questions. Twenty seconds per guess. Guess what most people would say and make your way to the queen.</p>
          <button className="primary" disabled={!board && !error} onClick={() => board ? (setPlaying(true), !board.deadline && !board.count && void send("start")) : void loadBoard()}>
            {results ? "See your results" : board?.count ? "Continue your hive" : board ? "Enter the hive" : error ? "Try again" : "Opening the hive…"}
            <ArrowRight size={20} aria-hidden />
          </button>
          <details>
            <summary>How to play</summary>
            <p>You have 20 seconds to type and confirm each guess. Take your time between chambers. Each locked guess gets a verdict. Better guesses move you toward the queen. The answer breakdowns open after the seventh guess. A new board opens at midnight UTC.</p>
          </details>
        </section>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      {playing && board && (
        <section className="game">
          <div className="flight-hud">
            <p className="eyebrow">{location} / {board.count} of 7 locked</p>
            <p className="depth-readout"><span>Hive depth</span> <strong>{Math.round(depth / 21 * 100)}%</strong></p>
          </div>
          <ol className="comb" aria-label="Honeycomb progress">
            {Array.from({ length: 7 }, (_, index) => (
              <li key={index} className={index < board.count ? "filled " + verdict(board.tiers[index]).className : index === board.count ? "active" : ""}
                aria-label={`Chamber ${index + 1}${index < board.count ? ", locked" : ""}`}
                aria-current={index === board.count ? "step" : undefined}>
                {index === 6 ? <Crown size={20} aria-hidden /> : index < board.count ? <Check size={18} aria-hidden /> : index + 1}
              </li>
            ))}
          </ol>

          <div className="verdict-area" role="status">
            {lastVerdict && !review && (
              <p key={board.count} className={`verdict ${lastVerdict.className}`}>
                <span>Chamber {board.count}</span> {lastVerdict.label}
              </p>
            )}
          </div>

          {review && lastVerdict ? (
            <div className="panel finale round-review">
              <p className="eyebrow">Chamber {board.count} of 7</p>
              <h2 ref={summary} tabIndex={-1} className={lastVerdict.className}>{board.last?.guess ? lastVerdict.label : "Time’s up"}</h2>
              {board.last?.guess && <p>Your guess <strong>{board.last.guess}</strong></p>}
              <p><strong>+{board.last?.points ?? 0}</strong> honey points</p>
              <button className="primary" disabled={busy} onClick={() => board.results ? setReview(false) : void send("start")}>
                {board.results ? "See full results" : "Start next question"}
              </button>
            </div>
          ) : !results && board.deadline ? (
            <div className="playfield">
              <div className="panel prompt-panel"><p className="eyebrow">Chamber {board.count + 1} of 7</p>
              <h2 id="prompt">{board.prompt}</h2><p className="round-clock">Time left <strong>{remaining}s</strong></p></div>
              <form className="answer-dock" onSubmit={submit}>
                <label htmlFor="guess">What would most people say?</label>
                <input id="guess" ref={input} aria-describedby="prompt" value={guess} onChange={event => { setGuess(event.target.value); setSuggestion(null); }}
                  maxLength={60} autoComplete="off" spellCheck placeholder="Type your guess" readOnly={busy} required />
                <button className="primary" disabled={busy || !guess.trim() || !remaining || Boolean(suggestion)}>
                  {busy ? "Locking guess…" : board.count === 6 ? "Lock guess and reveal" : "Lock in guess"} <ArrowRight size={20} aria-hidden />
                </button>
                {suggestion && <div className="spell-confirm" role="group" aria-label="Spelling confirmation">
                  <p>Did you mean <strong>{suggestion}</strong>?</p>
                  <button type="button" disabled={busy || !remaining} onClick={() => void send("guess", suggestion)}>Use {suggestion}</button>
                  <button type="button" disabled={busy || !remaining} onClick={() => void send("guess", guess)}>Keep my guess</button>
                </div>}
                {error && !remaining && <button type="button" onClick={() => void send("expire")}>Retry timeout</button>}
              </form>
            </div>
          ) : results ? (
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
                  <p className="your-guess">Your guess <strong>{row.guess || "Timed out"}</strong> · <span className={verdict(row.matched >= 3 ? 2 : row.matched > 0 ? 1 : row.matched).className}>{verdict(row.matched).label}</span></p>
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
          ) : <button className="primary" disabled={busy} onClick={() => void send("start")}>Start question</button>}
        </section>
      )}
      <footer>New board at midnight UTC <span>Progress saved in this browser</span></footer>
    </main>
  );
}
