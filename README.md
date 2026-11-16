# The Hive Mind

A daily consensus game. The server rotates three seven-question survey boards at midnight UTC. Players have 20 seconds per question. Each guess gets a verdict immediately, and the full ranked answer breakdown appears after all seven.

## Run and deploy

Use Node.js 22+, run `pnpm install --frozen-lockfile`, then `pnpm dev`. Set `HIVE_GAME_SECRET` to a strong private random value in `.env.local`.

For Vercel, keep `HIVE_GAME_SECRET` in the Preview and Production environment variables. Upload the extracted files to the GitHub repository root and make sure the latest production deployment is Ready. This release needs no survey environment variables, database, or manual answer entry. It starts a fresh run for players.

## Survey data and scoring

The 21 prompts and response counts come from the crowdsourced development split of [ProtoQA](https://github.com/iesl/protoqa-data), by Michael Boratko, Xiang Lorraine Li, Rajarshi Das, Tim O'Gorman, Dan Le, and Andrew McCallum. Source revision c6c5696cd0cc18d990499a431c2923cef8003104. See [ProtoQA: A Question Answering Dataset for Prototypical Common-Sense Reasoning](https://arxiv.org/abs/2005.00771). Licensed under Creative Commons Attribution 4.0 International. See PROTOQA-LICENSE.txt.

Adaptations: selected a subset of the prompts, corrected one article, chose display labels from the most frequent response text in each published answer cluster, and ordered clusters by published count with alphabetical tie-breaking. Percentages use the sum of included cluster counts for each question. The responses are from the published survey.

One answer earns 50 points; the next two earn 34; remaining recorded groups earn 18. Exact aliases and unambiguous whole-word partial matches count. Unrecognized answers and timeouts earn zero. This uses survey responses to score plausible alternatives, and some valid guesses may fall outside the sample. Answer groups remain server-side during play and are returned after the seventh guess. Survey source data is public.
