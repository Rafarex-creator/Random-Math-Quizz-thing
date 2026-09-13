# Quiz Arena — Vercel deployment

A no-login quiz app (create quizzes, get a shareable link, see live results),
built as a static page plus two small serverless functions, storing data in
Vercel's own KV database (nothing outside Vercel).

## 1. Get the project onto your machine
Unzip this folder wherever you keep code, then open a terminal in it.

## 2. Push it to GitHub (recommended)
```
git init
git add .
git commit -m "Quiz Arena"
```
Create an empty repo on GitHub, then follow GitHub's instructions to push
this local repo to it.

## 3. Import into Vercel
- Go to vercel.com → **Add New → Project** → import the GitHub repo.
- No build settings needed — leave everything as default and click **Deploy**.
  (First deploy will fail or the API routes will error until step 4 is done —
  that's expected.)

## 4. Add a Redis database (Vercel's native "KV" was retired — this replaces it)
- In your Vercel project, go to the **Storage** tab.
- Click **Create Database** (or **Browse Marketplace**) and choose a **Redis**
  option — the listed provider is **Upstash**. It's still one click from
  inside Vercel; you're not signing up for anything separately.
- Once created, click **Connect Project** and select this project.
- This automatically adds the `KV_REST_API_URL` / `KV_REST_API_TOKEN`
  (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) environment
  variables the code needs — the app reads either name automatically via
  `Redis.fromEnv()`, so you don't need to touch them yourself.

## 5. Redeploy
- Go to **Deployments** → click the ⋯ menu on the latest one → **Redeploy**,
  so it picks up the new environment variables.

## 6. Done
Your app is live at `https://your-project-name.vercel.app`.
- Creating a quiz gives you a link like `.../?code=ABC123` — opening that
  link auto-fills the code and drops the visitor straight into picking a
  username.
- Everyone's results and your own published quizzes are remembered in your
  browser (via `localStorage`) so you can come back to the host dashboard
  later.

## Prefer the command line instead of GitHub?
```
npm i -g vercel
cd quiz-arena-vercel
vercel        # first deploy, follow prompts
```
Then still do step 4 (create + connect the KV database) in the dashboard,
and run `vercel --prod` again to redeploy with it connected.

## Notes
- There's no login system, so anyone with a quiz's link/code can see that
  quiz's leaderboard — same trust model as Kahoot/Blooket.
- Scores are calculated server-side from submitted answers, so they can't be
  faked from the browser.
- Usernames are checked against a basic profanity filter before a quiz
  submission is accepted.
