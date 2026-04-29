# diffbot

Claude reads your git diffs and posts a summary to a Discord channel.

Each push to `main` triggers a GitHub Action that:
1. Reads the latest commit's diff
2. Sends it to Claude (Haiku 4.5) for a structured summary
3. Posts a formatted embed to your Discord channel

## Use it on your own repo

### 1. Get an Anthropic API key
https://console.anthropic.com → API Keys → Create Key

### 2. Create a Discord webhook
In Discord: channel settings (⚙) → Integrations → Webhooks → New Webhook → Copy Webhook URL

### 3. Add both as secrets in your repo
On GitHub: **Settings → Secrets and variables → Actions → New repository secret**
- `ANTHROPIC_API_KEY`
- `DISCORD_WEBHOOK_URL`

### 4. Add a workflow file
Create `.github/workflows/summarize.yml` in your repo:

```yaml
name: Summarize commits

on:
  push:
    branches: [main]

jobs:
  summarize:
    uses: spicypapr1ka/diffbot/.github/workflows/summarize-commit.yml@v1
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
```

### 5. Push a commit
Watch the **Actions** tab for the run, then check your Discord channel for the embed.

## What you'll see in Discord

> 🟦 **Fix null crash in profile loader theme lookup**
> • Added optional chaining when reading user.preferences.theme
> • Falls back to "light" theme when user or preferences are missing
> • Prevents TypeError when loadProfile is called before user data resolves
>
> **Author:** you   **Changes:** +1 / −1 across 1 file
> _a3f9b21_

Color reflects the commit category (feat/fix/refactor/etc.). Risky changes (auth, migrations, large deletions) get a red border and a ⚠️.

## Cost

Roughly **$0.001 per commit** on Claude Haiku 4.5. A repo with 10 commits/day costs about $0.30/month, billed to your own Anthropic account.

## Customize

Fork the repo and tweak:
- **Skip patterns** in [scripts/git.mjs](scripts/git.mjs) — files to exclude from the diff
- **Summary style** in [scripts/claude.mjs](scripts/claude.mjs) — the system prompt
- **Embed format** in [scripts/discord.mjs](scripts/discord.mjs) — colors, fields, layout

## Limitations

- Public repos only on free GitHub plans (reusable workflows from private repos require a paid plan)
- One commit per workflow run — bulk pushes summarize only the head commit
- Diffs over ~40KB are truncated before being sent to Claude
