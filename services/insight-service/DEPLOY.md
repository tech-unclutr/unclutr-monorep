# Deploying the SquareUp Synthesis Demo (free)

The fastest path to a public shareable URL: **Vercel free tier**. Two ways — pick one.

---

## Option A: One-shot CLI deploy (recommended, ~3 minutes)

From inside `synthesis-demo/`:

```bash
npx vercel --yes
```

The first run will prompt you to:
1. Log into Vercel (browser opens — free, sign in with GitHub/Google/email)
2. Link the project to your account
3. Confirm settings (defaults are fine)

Output ends with a URL like `https://squareup-synthesis-demo-xyz.vercel.app` — that's your public shareable link. Anyone can open it; **playback mode works without any API key**, so it's a real demo URL out of the box.

For subsequent deploys (after editing code):
```bash
npx vercel --prod
```

### Enabling Live & Production modes on Vercel

By default, Live mode (browser key) works on the deployed URL — users paste their own Anthropic key, stored in their browser only.

For Production mode (your server-side key, used when paying brands hit the demo through your domain):

1. Go to **vercel.com → your project → Settings → Environment Variables**
2. Add `ANTHROPIC_API_KEY` with your key. Scope: Production (and Preview if you want).
3. Redeploy: `npx vercel --prod`

The trust panel will then show "Server key set ✓" and Production mode will be enabled in the UI.

---

## Option B: GitHub-connected auto-deploy

If you want pushes to a branch to auto-deploy:

1. Push the project to a GitHub repo (we can create one — say the word):
   ```bash
   cd synthesis-demo
   git init && git add . && git commit -m "Initial commit"
   gh repo create nimayshah123/synthesis-demo --private --source=. --push
   ```
2. On vercel.com → New Project → Import from GitHub → pick the repo
3. Vercel auto-detects Next.js and deploys
4. Add `ANTHROPIC_API_KEY` in Settings → Environment Variables (for Production mode)

Every push to `main` redeploys automatically.

---

## Custom domain (free)

Vercel free tier includes custom domain attach. If you want `synthesis.joinsquareup.com`:

1. **vercel.com → project → Settings → Domains → Add**
2. Enter `synthesis.joinsquareup.com`
3. Vercel shows you a CNAME record to add at your DNS provider for `joinsquareup.com`
4. Once DNS propagates (~5-30 min), the synthesis demo is at `synthesis.joinsquareup.com`

The marketing page stays at `joinsquareup.com`; the demo lives on the subdomain.

---

## Cost on free tier

Vercel Hobby (free) plan limits:
- 100 GB bandwidth / month
- 100 hours serverless function execution / month
- 60 second function timeout (matches our `maxDuration` config)

This is *plenty* for demo traffic. If the demo gets so much traffic you blow the free tier — that's a high-quality problem.

API costs are *separate* from Vercel and billed by Anthropic to whichever key handles the request:
- Playback mode: **$0** (no API calls)
- Live mode: ~$0.20-0.50 per real synthesis run, billed to *the user's* key
- Production mode: same per-run cost, billed to *your* server-side key

If you put the demo behind a public URL with your server key, **playback should be the default** so casual visitors don't burn your budget. (Already configured this way — `playback` is default mode.)

---

## Sharing the link

Once deployed:

```
Public URL:   https://synthesis.joinsquareup.com  (or vercel auto-URL)
Default mode: Playback (instant, free, no setup)
What it shows: 6-agent pipeline + 3-agent debate + decision-ready insights, all on the bundled Wildstone sample
```

Drop it in:
- Investor pitch decks ("scan this URL, see it run")
- Email signatures
- Twitter / LinkedIn ("here's what 30 seconds of customer-research synthesis looks like")
- Brand pilot conversations ("paste your transcripts here")

---

## Troubleshooting

**"Function execution timed out"** in Live or Production mode:
The synthesis pipeline's debate stage runs 3 framers + judge per insight. With `topN=10` that's 40 LLM calls. If it exceeds 60s on Vercel free tier, lower `topN` to 5 or upgrade to Vercel Pro ($20/mo, 300s timeout).

**"Error: Anthropic API key required"** in Production mode:
Set `ANTHROPIC_API_KEY` in Vercel project env vars and redeploy.

**Playback mode looks wrong**:
Check that `public/fixtures/*` are in the deploy. Vercel includes `public/` automatically — if they're missing, ensure they were committed to your local copy.
