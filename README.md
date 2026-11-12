# The Hive Mind

A Next.js daily consensus game. The server chooses a seven-question board from a seven-board pool using the UTC date. The pool repeats weekly. Each guess immediately receives one simulated verdict: Hive-Minded, Common Thought, In the Same Field, or Wrong Hive. The verdict moves the player through the hive. Full answer breakdowns stay behind the seventh guess. An HTTP-only signed cookie saves progress in the current browser through the daily reset.

## Run locally

Use Node.js 22 or newer and run `pnpm install --frozen-lockfile`. Generate a private secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and put it in a local `.env.local` as `HIVE_GAME_SECRET=<generated value>`. Run `pnpm dev` and open http://localhost:3000.

## Publish to the existing Vercel project

1. Commit the change on a GitHub branch and open a pull request against the project's production branch. Confirm the existing Vercel project is linked to `ryanfowler1999-arch/The-Hive`.
2. In Vercel project settings, add a strong `HIVE_GAME_SECRET` for Preview and Production. Keep the value private and stable within each environment. Changing it invalidates in-progress cookies and changes simulated scores.
3. Deploy the branch and check the Vercel preview. Play seven guesses, reload mid-game, confirm that each verdict appears immediately and answer breakdowns first appear after guess seven, and check a narrow mobile viewport. Merge to the configured production branch when ready.
4. In the Vercel project's Domains screen, verify `thehivemind.me` is assigned and apply the exact DNS records Vercel lists at your active DNS provider. Use the Vercel deployment URL to test while DNS propagates.

## Move to genuine consensus

- Use Postgres tables for dated boards, seven ordered prompts per board, stable response groups and aliases, player runs, per-prompt guesses, and versioned consensus snapshots. Assign a board and snapshot ID to each run. Keep published boards immutable.
- Record each guess on the server in a transaction with a unique run-and-prompt key. Use anonymous signed session IDs initially and rate-limit writes. Keep raw free text private with retention limits and moderate or normalize it before grouping.
- Collect an independent sample for each prompt before its scored board goes live. At a defined cutoff, freeze the counts, denominators, and alias versions after reaching a published minimum sample size. Use that snapshot for every player on the board. Continue labeling a board simulated if it uses fictional figures.
- Give browser clients access only through the game API. Return the active prompt, locked count, and the submitted guesses’ verdicts until all seven unique guesses commit. Then return only that board's aggregate results and the player's score. Never put snapshots or signing secrets in public assets or a public repository. Cookie-based demo progress does not enforce one player per day across browsers or prevent players from sharing completed answers.
