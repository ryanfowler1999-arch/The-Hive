# The Hive Mind 🐝

A deployable Next.js prototype of a daily consensus guessing game.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder run `npm install`.
3. Run `npm run dev` and open http://localhost:3000.

## Publish to the web with Vercel

1. Create a GitHub repository and upload the contents of this folder (not the ZIP itself).
2. Visit https://vercel.com/new and import the GitHub repository.
3. Keep the detected **Next.js** framework settings and click **Deploy**.
4. Vercel will provide a public `.vercel.app` URL. A custom domain can be added later under Project Settings → Domains.

## IMPORTANT: Prototype limitations

- **All consensus percentages are fictional illustrative examples.** The UI explicitly labels them as demo data.
- Questions are currently a fixed seven-question set, **not rotated daily**.
- Results are stored in the browser's `localStorage`, not in a shared database. They are not cross-device or tamper-resistant.
- Answer matching uses a small explicit alias dictionary; unfamiliar answers fall into "Other." This is a demo simplification and can misclassify legitimate responses.
- No real-time multiplayer, login, moderation, rate limits, or real survey sample is connected.
- "Reset demo" clears this device's progress.
- A real release needs a database (e.g. Supabase), a question scheduling/admin system, response normalization and moderation, and a precomputed frozen consensus snapshot for fair instant scoring. Never represent demo figures as genuine user statistics.

## Proposed production scoring model

Each prompt has a versioned consensus snapshot, derived from a previously closed response collection window. A player's guess is normalized, grouped with equivalent responses, and scored using the share of the frozen snapshot belonging to that group. This ensures the same answer receives the same score for every player on a given day.

## Tech

Next.js App Router, React, TypeScript, CSS, lucide-react. No credentials required for the prototype.
